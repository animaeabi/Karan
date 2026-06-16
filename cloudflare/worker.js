// Partypedia signaling + TURN-credentials Worker (Cloudflare)
//
// Two responsibilities:
//   GET  /turn          -> mints short-lived Cloudflare Realtime TURN credentials
//   WS   /ws?room=CODE  -> per-room WebSocket relay (one Durable Object per room)
//
// The relay is a dumb broadcast: every message from a socket is forwarded to all
// OTHER sockets in the same room. The browser clients put {to:'host'|<gid>} on each
// message and filter on their side (same contract as the Supabase broadcast path).
//
// Uses the WebSocket Hibernation API so idle rooms cost nothing.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // --- ephemeral TURN credentials (kept server-side; token never reaches the browser) ---
    if (url.pathname === '/turn') {
      if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) {
        // STUN-only fallback if TURN isn't configured yet.
        return json({ iceServers: { urls: [] } }, cors);
      }
      try {
        const r = await fetch(
          `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.TURN_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ttl: 86400 }),
          }
        );
        return json(await r.json(), cors);
      } catch (e) {
        return json({ iceServers: { urls: [] } }, cors);
      }
    }

    // --- WebSocket signaling relay ---
    if (url.pathname === '/ws') {
      const room = (url.searchParams.get('room') || '').toUpperCase();
      if (!room) return new Response('room required', { status: 400, headers: cors });
      const id = env.ROOMS.idFromName(room);
      return env.ROOMS.get(id).fetch(request);
    }

    return new Response('Partypedia signaling OK', { headers: cors });
  },
};

function json(obj, cors) {
  return new Response(JSON.stringify(obj), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// One Durable Object instance per room code. Pure broadcast relay.
export class Room {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    // Hibernatable: the DO can unload from memory between messages and still
    // keep these sockets open. No duration billing while idle.
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  // Relay each incoming message to every OTHER socket in this room.
  webSocketMessage(ws, message) {
    for (const peer of this.state.getWebSockets()) {
      if (peer !== ws) {
        try { peer.send(message); } catch (e) {}
      }
    }
  }

  webSocketClose(ws) {
    try { ws.close(); } catch (e) {}
  }

  webSocketError(ws) {}
}
