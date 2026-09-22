# iMu6

A small, touch-first online music player designed for older mobile Safari, including iPhone 6.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

This is a static Vite app and can be deployed directly to Vercel. Import the GitHub repository, use `npm run build` as the build command, and use `dist` as the output directory.

The starter catalog uses public sample MP3 URLs for demonstration. Replace the URLs in `src/main.js` with audio you own or have permission to stream before sharing the site publicly. HTTPS audio URLs are required on an HTTPS deployment.

## iPhone 6 notes

The interface uses vanilla JavaScript, conservative CSS, touch-sized controls, and no modern browser APIs beyond the HTML5 audio element. Older iOS Safari may require the first play to be initiated by a tap, which the player button supports.
