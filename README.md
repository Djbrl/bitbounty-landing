# BitBounty landing page

Static landing page for [BitBounty](https://github.com/Djbrl/bitbounty): paid GitHub issues for developers in West Africa, paid in local currency on mobile money through Bitnob. Built at Code & Chain Dakar 2026.

No build step: `index.html`, `styles.css`, `main.js`. Deployed on Vercel.

## Update the live demo link and the trailer
Edit `site.config.js`:
- `demoUrl`: the live demo URL. Every "Find a paid issue" button points to it, and an "Open the live demo" button appears under the trailer.
- `trailerYoutubeId`: the YouTube id (the part after `v=`). The trailer replaces the "Premieres at Demo Day" placeholder.
- `githubAppUrl`: the GitHub App install link, used by every "Install" / "Post a bounty" button.

Commit and push: Vercel redeploys on its own once the repo is linked, or run `vercel --prod`.

## Run locally
Open `index.html` in a browser, or `npx serve .`.

All code written by an AI agent (Claude Code, claude-opus-5-5), per the team agreement.
