# Thiên Quang Smarttools Catalog App

Mobile-first static prototype built from the latest Figma handoff package.

## Run locally

From this folder:

```powershell
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Preview deploy

This app is static, so it can be deployed quickly on either:

- Vercel
- Netlify
- GitHub Pages

Included config:

- `vercel.json`
- `netlify.toml`
- `.github/workflows/deploy-pages.yml`

## GitHub Pages

This repository is prepared for GitHub Pages deployment through GitHub Actions.

After the workflow runs successfully, the preview URL should follow this shape:

```text
https://tqsmarttools.github.io/thien-quang-catalog-app/
```

## Included flows

- `Screen 01` Home
- `Screen 02` Product List
- `Screen 02B` Filter Bottom Sheet
- `Screen 03` Quote List

## Behavior implemented

- Navigation between screens
- Product add/remove toggle
- Quantity stepper with persisted quote state
- Local storage persistence
- Filter bottom sheet with single-select apply/reset flow
- Zalo quote message draft generation

## Assets

Assets are served from `public/assets/`.
