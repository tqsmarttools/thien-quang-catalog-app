# Thien Quang Smarttools Catalog App

Mobile-only catalog PWA built from the latest Figma handoff.

## Run locally

From this folder:

```powershell
node dev-server.js
```

Then open:

```text
http://127.0.0.1:4273/
```

## Public deploy

This app is configured for static deploy on:

- GitHub Pages
- Netlify
- Vercel

Included config:

- `.github/workflows/deploy-pages.yml`
- `netlify.toml`
- `vercel.json`

## GitHub Pages URL

Once the Pages workflow succeeds, the public URL is:

```text
https://tqsmarttools.github.io/thien-quang-catalog-app/
```

## Included screens

- `Screen 01` Home
- `Screen 02` Product List
- `Screen 02B` Filter Bottom Sheet
- `Screen 03` Quote List

## Current behavior

- Screen navigation
- Product add/remove on Screen 02
- Quantity stepper with persisted quote state
- Quote list persistence in local storage
- Filter bottom sheet with apply/reset flow
- Zalo quote message generation

## Assets

Assets are served from `public/assets/`.
