# Temple Game Jungle (Offline Self-Host)

Clean offline copy of the HTML5 Temple Run-style game from templerun.org.

## Run

```bash
cd temple-game-jungle
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## What was changed

- Removed ad banner system (games.js, games.css, banner HTML)
- Removed external ad data fetch (warofsticks.com)
- Kept only the local woff2 font
- No trackers or analytics in the remaining code

## Controls

Typically swipe / arrow keys / space for jump (depends on the original game UI).

## Notes

- Game uses Babylon.js (bundled). Most track data and logic is inside bundle.js.
- Requires a modern browser with WebGL.
- Some optional UI icons that 404'd on the original host were not included; core gameplay assets are present.
