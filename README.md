<div align="center">
  <img src="./favicon.svg" alt="Playyyy Logo" height="128">
  <p><strong>Fast, ad-free browser games.</strong><br>
  Play 100+ popular titles instantly, no downloads, no accounts, no ads.</p>

  <p>
    <a href="https://louis141414.github.io/playyyy/"><strong>Play Now</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/github/stars/louis141414/playyyy?style=flat-square" alt="Stars">
    <img src="https://img.shields.io/github/license/louis141414/playyyy?style=flat-square" alt="License">
    <img src="https://img.shields.io/github/last-commit/louis141414/playyyy?style=flat-square" alt="Last commit">
  </p>
</div>

---

## Why Playyyy?

- **No ads**: Just pure gaming
- **Lightning fast**: Built with pure vanilla HTML, CSS & JavaScript
- **Works everywhere**: Great for school, work, or anywhere else
- **Favorites system**: Star the games you love (saved in your browser)
- **Search and filters**: Search, filter by category, and keep your current browse view in the URL
- **Clean game links**: Every game has a simple `/game/?id=<game name>` URL, such as `/game/?id=Pac-Man`
- **Recently added and random picks**: Browse new additions or spin the filtered game wheel
- **Fully responsive**: Looks great on desktop, tablet and mobile
- **Installable PWA**: Install Playyyy on supported phones and computers; the app shell is cached for offline access
- **Accessible browsing**: Keyboard-friendly filters, clear focus styles, labeled controls, and progressive game-card loading

---

## Features

- 100+ high-quality browser games (Slope, Drive Mad, Retro Bowl, Geometry Dash, 2048, and many more)
- Clean, modern interface with dark and light themes
- Daily featured game and A–Z, recently added, and favorites-first sorting
- Full-screen support
- Lightweight and optimized for speed
- Open source and easy to customize

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- JSON

No frameworks. No unnecessary dependencies.

---

## Repository layout

- `index.html` and `404.html` are the static-site entry pages. `game/index.html` serves game pages at `/game/?id=<game name>`.
- `assets/js/` contains shared JavaScript; `assets/css/` contains shared styles; and `assets/images/` contains thumbnails and app icons. The root `manifest.json` and `service-worker.js` stay at the site root for PWA scope.
- `games.json` is the game catalog. Each game lives in its own `games/<game-name>/` folder, with its original internal asset layout preserved because game files rely on relative paths.
- `verify/` contains verification assets.

The root `.gitignore` excludes operating-system metadata files such as `.DS_Store` and `Thumbs.db`.

---

## Install and offline use

On a supported browser, use the browser menu to install Playyyy or add it to your home screen. The service worker caches the home page, game page, game list, manifest, and shared interface files for offline access. Pac-Man (Flash) and the newest Flash games use the locally hosted Ruffle player; its runtime adds about 29 MB to the initial install, and each Flash game is cached the first time it is played online so it can be replayed offline. Every game opens behind the Playyyy loading screen; common embedded loading indicators, including Unity progress screens, are hidden while their games load. Minecraft also reports its download progress. Game frames block top-level navigation and outside links so games remain within Playyyy. Other game files are not cached and may still need an internet connection. Theme preference and favorites stay in local browser storage; game-page visits may be measured with StatCounter. The featured game changes daily, **Most favorited** sorts your locally saved favorites first, and opening a game preserves your search, category, sort, and browse position when you return.

Game pages use `/game/?id=<game name>` URLs. Game page views are sent to StatCounter with the game name in the page title.

---

## Getting Started

```bash
git clone https://github.com/louis141414/playyyy.git
```

Then just open `index.html` in your browser, or serve the folder with any static file server.

---

## Contributing

Contributions are always welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Use the **Request a game** button on the home page to suggest a game. Include its name, playable link, and description; after opening the issue, attach a game ZIP if available and a banner sized exactly **480 × 100 px**. You can also [open a game request directly](https://github.com/louis141414/playyyy/issues/new?template=game_request.yml).

For other ideas or improvements, feel free to open an issue.

---

## License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---

## Author

**Louis Paelinck**  
[@louis141414](https://github.com/louis141414)

---

## Notice

All games on this site belong to their original creators and owners.  
Playyyy simply provides a convenient way to play them in the browser.

The creator of this project is **not responsible** if a teacher (or anyone else) catches you playing games when you’re not supposed to.  
Play at your own risk.

---

<div align="center">
  <sub>Made with ❤️ for people who just want to play games</sub>
</div>
