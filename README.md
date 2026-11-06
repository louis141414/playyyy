<div align="center">
  <img src="./favicon.svg" alt="Playyyy Logo" height="128">
  <p><strong>Find your game. Hit Playyyy.</strong><br>
  Play popular browser games instantly, no downloads, no accounts, no ads.</p>

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

## Features

- Browse and search a catalog of browser games
- Filter by category and sort A–Z, by recently added, or favorites first
- Save favorites in your browser (stored locally on your device)
- Random game picker and a daily featured game
- Dark and light themes
- Full-screen play
- Responsive layout for desktop, tablet, and mobile
- Installable as a Progressive Web App (PWA) with offline access to the site shell
- Keyboard-friendly controls and labeled, accessible UI

Every game has its own link in the format `/game/?id=<game name>`, so you can share a direct link to a game.

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- JSON

No frameworks and no build step.

---

## Repository Layout

- `index.html` and `404.html`: site entry pages
- `game/index.html`: game page template
- `assets/js/`: shared JavaScript
- `assets/css/`: shared styles
- `assets/images/`: thumbnails and app icons
- `games.json`: the game catalog (titles, categories, and links)
- `games/<game-name>/`: per-game folders, kept as-is because games rely on relative file paths
- `manifest.json` and `service-worker.js`: PWA files, kept at the site root
- `verify/`: legal documents (Terms, Privacy, and Takedown Policy)

---

## Running Locally

```bash
git clone https://github.com/louis141414/playyyy.git
cd playyyy
```

Open `index.html` in a browser, or serve the folder with any static file server, for example:

```bash
python3 -m http.server 8000
```

---

## Installing and Offline Use

On a supported browser, use the browser menu to install Playyyy or add it to your home screen. The service worker caches the site shell (home page, game page, game list, and shared interface files). Games themselves may still need an internet connection.

---

## Privacy

Theme preference and favorites are stored in your browser's local storage and are not sent to a server. Game-page visits may be measured with StatCounter. See the Privacy Notice in `verify/` for details.

---

## Games and Third-Party Content

Playyyy links to or hosts browser games that were created by third parties. Those games remain the property of their respective owners. Playyyy does not claim ownership of any third-party game, character, name, or artwork.

If you own rights to a game listed here and want it removed or changed, see the Takedown Policy in `verify/`.

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-change`)
3. Commit your changes
4. Push the branch and open a Pull Request

For bugs or ideas, open an issue. Game suggestions should include the game's name, a link to a version the creator has made available for browser play, and confirmation that the creator permits its use on this site.

---

## License

The **code** in this repository (HTML, CSS, JavaScript, and documentation) is licensed under the **MIT License**. See [LICENSE](LICENSE).

This license does **not** apply to third-party games, names, logos, or artwork, which remain the property of their owners.

---

## Author

[@louis141414](https://github.com/louis141414)