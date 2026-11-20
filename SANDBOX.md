# Leasing Lab practice sandbox

Leasing Lab follows the rental, lead, showing, reporting and access workflows in the demo with its own interface. The app uses fictional records and keeps changes in your browser. The practice email schedules and access codes stay in the app.

Open **Tutorial** in the top bar to choose one of ten lessons. **Show me where** takes you to the control for the current step. Complete the action to advance. Switch to **Free practice** for the same workspace without the coach and highlights. Use **Reset practice data** from the sidebar to clear changes and lesson progress in this browser.

## Run locally

Open `sandbox/index.html` in a browser, or serve the folder locally.

```sh
python3 -m http.server 8768 --directory sandbox
```

Then visit `http://localhost:8768/`. The hosted and local versions store data separately by browser and origin.

## GitHub Pages

Use **Settings → Pages → Deploy from a branch** and select **`gh-pages` / `(root)`**. This branch contains only the static practice app and its fictional assets. The main branch and frame archive can remain private. Pages availability for a private repository depends on the GitHub plan and settings for the owner.

The site address is `https://huzshk0707.github.io/tenant-turner-demo/`. To update the site, publish the contents of `sandbox/` into the root of `gh-pages`, retaining `.nojekyll`.

The practice property cards use illustrative photos from Unsplash. The sources are listed in [photo credits](sandbox/assets/photo-credits.txt).

## Verify the practice flows

With the local server running and Playwright installed, run `node tools/check-sandbox.cjs`. The check completes all ten lessons, tests persisted changes and reset, and verifies the phone layout. Set `LEASING_URL` for a different test URL or `LEASING_CHROMIUM` for a system Chromium executable.
