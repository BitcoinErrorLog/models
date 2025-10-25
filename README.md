# VISA? Preset – Layered Payments Simulator

Single-file GitHub Pages site containing a tunable UI for the “VISA?” preset.
Open `index.html` locally or publish via GitHub Pages.

## Quick publish to GitHub Pages (browser)
1. Create a new repo on GitHub, for example `visa-pages-site`.
2. Upload the files from this folder (at minimum `index.html` and `.nojekyll`).
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set **Branch** to **main** and **/ (root)**, then click **Save**.
6. Wait a minute. Your site will appear at `https://<your-username>.github.io/<repo-name>/`.

## Quick publish (GitHub CLI)
```bash
# inside the folder with index.html
git init
git add .
git commit -m "Initial commit: VISA? preset site"
gh repo create visa-pages-site --public --source=. --remote=origin --push
# Enable Pages from main branch, root
gh api -X PUT repos/:owner/visa-pages-site/pages --field "source[branch]=main" --field "source[path]=/"
echo "Visit https://<your-username>.github.io/visa-pages-site/"
```

## Optional: Custom domain
- Add a `CNAME` file with your domain inside (single line).
- Point your domain’s DNS to GitHub Pages per GitHub docs.

## Notes
- This site is entirely client-side. No build step needed.
- To update, commit and push a new `index.html`.
