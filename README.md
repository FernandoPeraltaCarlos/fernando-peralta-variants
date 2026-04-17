# Shopify Weather Section

Reusable Shopify theme implementation for the Charlotte's Web technical challenge.

This repository contains the storefront side of the solution: a custom Shopify section that renders the current weather and consumes a secure Vercel proxy instead of calling WeatherAPI directly from the browser.

## What is included

- A reusable Shopify section with theme editor settings
- Frontend logic to fetch and render current weather
- Visual states for loading, error, and ready
- Optional visitor geolocation with city fallback
- Integration with the Vercel proxy hosted at `https://shopify-app-wheather.vercel.app/api/weather`

## Key files

- `sections/weather-section.liquid`: section markup, data attributes, and schema
- `assets/weather-section.js`: fetch logic, geolocation handling, and DOM rendering
- `assets/section-weather.css`: section presentation and weather mood styling

## Section settings

The section exposes the following settings in the Shopify theme editor:

- `Title`
- `Use visitor location`
- `City`
- `Padding top`
- `Padding bottom`

`City` is used as the fallback location when geolocation is disabled or unavailable.

## How it works

1. Shopify renders `weather-section.liquid`.
2. The section outputs configuration through `data-*` attributes.
3. `weather-section.js` resolves the requested location.
4. The browser calls the Vercel proxy endpoint.
5. The proxy calls WeatherAPI server-side and returns a reduced JSON payload.
6. The section updates the UI with the current weather.

## Installation

Copy these files into the target Shopify theme:

- `sections/weather-section.liquid`
- `assets/weather-section.js`
- `assets/section-weather.css`

Then push the theme with Shopify CLI:

```bash
shopify theme push
```

Or upload the files manually in the Shopify code editor.

After that:

1. Open the Shopify theme editor.
2. Add the `Weather` section to a page.
3. Configure the title and city.
4. Enable or disable visitor geolocation as needed.

## Proxy dependency

This theme expects the weather proxy to be available at:

```text
https://shopify-app-wheather.vercel.app/api/weather
```

The proxy exists to keep `WEATHER_API_KEY` on the server. A Shopify theme cannot safely store third-party API secrets in public storefront code.

The proxy repository lives separately in `../shopify-app-wheather`.

## Notes

- The section uses `aria-live="polite"` for status updates.
- It re-initializes on `shopify:section:load` for theme editor compatibility.
- If the proxy URL changes, update the `data-weather-endpoint` value in `sections/weather-section.liquid`.
