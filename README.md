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

The starter catalog uses public sample MP3 URLs for demonstration. Search uses the official YouTube Data API through `api/youtube-search.js`, and selected results play in YouTube's official embedded player. Search waits two seconds after typing stops so older mobile Safari can keep the input focused. Add a `YOUTUBE_API_KEY` environment variable in Vercel before using YouTube search. The API key must never be committed to GitHub.

## iPhone 6 notes

The interface uses vanilla JavaScript, conservative CSS, touch-sized controls, and no modern browser APIs beyond the HTML5 audio element. Older iOS Safari may require the first play to be initiated by a tap, which the player button supports.
