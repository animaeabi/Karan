# Karanpedia — How Well Do You Know Karan?

A self-contained roast quiz about Karan. Add your own photos and questions, then
share. The entire app is a single static `index.html` (all CSS/JS inline; the only
external request is to Google Fonts), so it runs great on GitHub Pages.

## Live site

Once Pages is enabled (see below), the site is served from the repository root at:

```
https://<owner>.github.io/<repo>/
```

## Hosting on GitHub Pages

There are two ways to publish it. **Option A** is the recommended, automated path.

### Option A — GitHub Actions (recommended)

This repo includes `.github/workflows/deploy-pages.yml`, which builds and deploys
the site on every push to the default branch (and can be triggered manually).

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. The workflow runs automatically on push, and can be re-run from the **Actions**
   tab via "Run workflow". When it finishes, the deploy step prints the live URL.

### Option B — Deploy from a branch (no workflow)

If you'd rather not use the workflow:

1. In the repo, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Select the branch and the `/ (root)` folder, then **Save**.
4. Wait a minute for the first build, then open the printed URL.

## Local preview

It's a single file — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```
