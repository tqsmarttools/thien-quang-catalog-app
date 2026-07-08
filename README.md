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
- `Screen 02` Category Group Browser
- `Screen 03` Product List
- `Screen 04` Quote List

## Current behavior

- Category-first browsing on Home
- Group browser before product list
- Product add/remove on product list
- Quantity stepper with persisted quote state
- Quote list persistence in local storage
- Filter bottom sheet with apply/reset flow
- Zalo quote message generation

## GA4 setup

To enable Google Analytics 4 tracking:

1. Open [data.js](/C:/Users/Admin/Documents/Thiên%20Quang%20Catalog%20App/data.js)
2. Set `analytics.ga4MeasurementId` to your GA4 Measurement ID
3. Redeploy the app

The tracking scaffold is already wired for:

- `app_open`
- `screen_view`
- `select_category`
- `view_all_groups`
- `open_product_group`
- `add_to_quote`
- `remove_from_quote`
- `change_quote_quantity`
- `apply_product_filter`
- `clear_product_filter`
- `preview_quote_message`
- `send_quote_to_zalo`
- `tap_contact_cta`

## Assets

Assets are served from `public/assets/`.
