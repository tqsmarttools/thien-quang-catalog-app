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

Included config:

- `vercel.json`
- `netlify.toml`

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
