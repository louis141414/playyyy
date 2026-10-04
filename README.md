<div align="center">
  <img src="https://i.ibb.co/Dfh3WWKG/Screenshot-2026-06-13-13-55-12-removebg-preview.png" alt="Playyyy Logo" height="280">
  <p><strong>Fast, ad-free browser games.</strong><br>
  Play 100+ popular titles instantly, no downloads, no accounts, no ads.</p>

  <p>
    <a href="https://louis141414.github.io/playyyy/"><strong>Play Now</strong></a> ·
    <a href="https://louis141414.github.io/playyyy/download.html">Download for Windows</a>
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
- **Search**: Find any game in seconds
- **Fully responsive**: Looks great on desktop, tablet and mobile
- **Installable PWA**: Install Playyyy on supported phones and computers; the app shell is cached for offline access

---

## Features

- 100+ high-quality browser games (Slope, Drive Mad, Retro Bowl, Geometry Dash, 2048, and many more)
- Clean, modern interface with a dark theme
- Full-screen support
- Lightweight and optimized for speed
- Open source and easy to customize

---

## Desktop Version (Windows)

Prefer a desktop app?

- [Online version](https://github.com/louis141414/playyyy/raw/refs/heads/main/pc-version/Playyyy-setup.exe) (requires internet)
- [Offline version](https://github.com/louis141414/playyyy/raw/refs/heads/main/pc-version/Playyyy%20-%20offline%20setup.exe)

Or visit the [download page](https://louis141414.github.io/playyyy/download.html).

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- JSON

No frameworks. No unnecessary dependencies.

---

## Repository layout

- `index.html`, `play.html`, `404.html`, and `download.html` are the static-site entry pages and stay at the repository root so their public URLs remain stable.
- `assets/js/` contains shared JavaScript; `assets/css/` contains shared styles; and `assets/images/` contains thumbnails and app icons. The root `manifest.json` and `service-worker.js` stay at the site root for PWA scope.
- `games.json` is the game catalog. Each game lives in its own `games/<game-name>/` folder, with its original internal asset layout preserved because game files rely on relative paths.
- `pc-version/` contains desktop installers; and `verify/` contains verification assets.

The root `.gitignore` excludes operating-system metadata files such as `.DS_Store` and `Thumbs.db`.

---

## Install and offline use

On a supported browser, choose **Install app** on the site to add Playyyy to your home screen or apps. The home page, game list, and shared interface files are cached for offline access; individual game files are not pre-cached, so a game may still need an internet connection.

Game page views are sent to StatCounter with the game name in both the page title and the `game` URL parameter, so its page-view reports can show which games are opened most often.

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
