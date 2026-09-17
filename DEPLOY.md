# badmintul.com deployment runbook

This runbook publishes the static Vite build to Hostinger and points it at the production Convex deployment. Run all application commands from `app/`.

1. Confirm the production deployment is the intended Convex project.

   ```powershell
   cd app
   npx convex dashboard --prod
   ```

   The current production deployment is `frugal-vole-549` with client URL `https://frugal-vole-549.convex.cloud`.

2. Deploy the Convex functions to production when backend code has changed.

   ```powershell
   cd app
   npx convex deploy
   ```

3. Build the frontend with production environment values. `app/.env.production` must contain the production `VITE_CONVEX_URL`; never build the Hostinger artifact from the dev-only `.env.local`.

   ```powershell
   cd app
   npm install
   npm run build -- --mode production
   ```

4. Run the preflight URL check before uploading. It must find the production URL and must find no dev deployment URL.

   ```powershell
   cd app
   Select-String -Path dist/assets/*.js -Pattern 'frugal-vole-549.convex.cloud'
   Select-String -Path dist/assets/*.js -Pattern 'keen-scorpion-113.convex.cloud'
   ```

   The first command must return a match. The second command must return no match. If it does return a match, remove stale build output and rebuild with `--mode production`.

5. Upload the complete contents of `app/dist/` to the Hostinger public web root, usually `public_html/`, using Hostinger File Manager or FTP. Preserve the generated `assets/` directory, `manifest.webmanifest`, `sw.js`, `workbox-*.js`, and the root icon files. Upload the contents of `dist`, not the `dist` directory itself, so `index.html` is at the public root.

6. Configure the domain in Hostinger. Point `badmintul.com` and `www.badmintul.com` at the hosting account, enable the Hostinger SSL certificate, and force HTTPS. Verify that `https://badmintul.com/` serves `index.html` and that `/manifest.webmanifest` and `/sw.js` return HTTP 200 responses.

7. Convex origin/CORS check. This app uses the Convex React client and Convex Auth directly; it does not expose a custom `convex/http.ts` HTTP action, so there is no application CORS header to edit. The Convex Auth provider uses the production `CONVEX_SITE_URL` supplied by the production deployment. Open the production deployment with `npx convex dashboard --prod`, then inspect its Settings/Authentication or Integrations page if the dashboard presents an allowed-origin field and add exactly `https://badmintul.com` (and `https://www.badmintul.com` only if that hostname is served). Do not add `*`. If an HTTP action is added later, configure its `OPTIONS` and response headers in `app/convex/http.ts` with the same explicit origin.

8. Verify the live site in a clean browser session: sign up a player, sign up a venue owner, submit a venue, promote a controlled account with the Task 14 CLI command, approve the venue, and make a booking. Confirm browser requests use `frugal-vole-549.convex.cloud`, not `keen-scorpion-113.convex.cloud`, and inspect the console for mixed-content or CORS errors.

9. After deployment, rerun the Task 12 production hardening checks: the concurrent same-slot booking race and cross-owner venue access attempt. Record the results in `REVIEW.md`.
