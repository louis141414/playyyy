// script.js
const JSON_URL = "games.json";
const FAVORITES_KEY = 'playyyy-favorites';

let allGamesCache = null;
let searchQuery = '';

async function loadGames() {
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Failed to load games", e);
    return [];
  }
}

function normalizeGameName(gameName) {
  return String(gameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch (error) {
    console.error('Failed to read favorites', error);
    return [];
  }
}

function setFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(gameName) {
  return getFavorites().includes(gameName);
}

function toggleFavorite(gameName) {
  const favorites = getFavorites();
  const i = favorites.indexOf(gameName);
  if (i >= 0) favorites.splice(i, 1);
  else favorites.unshift(gameName);
  setFavorites(favorites);
  // update UI depending on current page
  if (document.getElementById('grid')) renderHome();
  updateGameFavoriteButton();
}

function getThumbnailCandidates(gameName) {
  const baseName = normalizeGameName(gameName);
  return [
    `images/thumbnails/${baseName}.jpg`,
    `images/thumbnails/${baseName}.jpeg`,
    `images/thumbnails/${baseName}.png`,
  ];
}

function applyThumbnailFallback(img, candidates, index = 0) {
  if (index >= candidates.length) {
    img.src = 'images/thumbnails/placeholder.jpg';
    return;
  }
  img.onerror = () => applyThumbnailFallback(img, candidates, index + 1);
  img.src = candidates[index];
}

function createGameCard(game) {
  const card = document.createElement('div');
  card.className = 'card glass';

  const link = document.createElement('a');
  link.href = `play.html?game=${encodeURIComponent(game.name)}`;

  const thumbnail = document.createElement('img');
  thumbnail.alt = game.name;
  const candidates = getThumbnailCandidates(game.name);
  applyThumbnailFallback(thumbnail, candidates);

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'card-title-container';

  const titleLink = document.createElement('a');
  titleLink.href = `play.html?game=${encodeURIComponent(game.name)}`;
  titleLink.textContent = game.name;
  titleLink.className = 'card-title-link';

  titleContainer.appendChild(titleLink);

  if (game.tag) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = game.tag;
    titleContainer.appendChild(tag);
  }

  const favoriteButton = document.createElement('button');
  favoriteButton.type = 'button';
  favoriteButton.className = `favorite-btn ${isFavorite(game.name) ? 'active' : ''}`;
  favoriteButton.setAttribute('aria-label', isFavorite(game.name) ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`);
  favoriteButton.textContent = isFavorite(game.name) ? '★' : '☆';
  favoriteButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(game.name);
  });

  footer.appendChild(titleContainer);
  footer.appendChild(favoriteButton);

  link.appendChild(thumbnail);
  card.appendChild(link);
  card.appendChild(footer);

  return card;
}

function renderGameGrid(container, games) {
  if (!container) return;
  container.innerHTML = '';
  if (!games.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No games found.';
    container.appendChild(emptyState);
    return;
  }
  games.forEach(game => container.appendChild(createGameCard(game)));
}

// Home Page - Grid
async function renderHome() {
  if (!allGamesCache) allGamesCache = await loadGames();
  const grid = document.getElementById('grid');
  const favoritesGrid = document.getElementById('favorites-grid');

  const filteredGames = (allGamesCache || []).filter(game => game.name.toLowerCase().includes(searchQuery));
  const favoriteGames = filteredGames.filter(game => isFavorite(game.name));
  const nonFavoriteGames = filteredGames.filter(game => !isFavorite(game.name));

  renderGameGrid(favoritesGrid, favoriteGames);
  renderGameGrid(grid, nonFavoriteGames);
}

function setFavicon(href) {
  if (!href) return;
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

async function renderGame() {
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');

  const titleEl = document.getElementById('game-title');
  if (!gameName) {
    if (titleEl) titleEl.textContent = "No game selected";
    return;
  }

  // set favicon based on game folder (normalize to avoid bad paths)
  const safeName = encodeURIComponent(normalizeGameName(gameName));
  setFavicon(`./games/${safeName}/favicon.png`);

  const games = await loadGames();
  const game = games.find(g => g.name === gameName);

  if (!game) {
    if (titleEl) titleEl.textContent = "Game not found";
    return;
  }

  if (titleEl) titleEl.textContent = game.name;
  const iframe = document.getElementById('game-iframe');
  if (iframe) iframe.src = game.url;

  const description = document.getElementById('description');
  if (description) {
    description.innerHTML = `
      <div class="game-meta">
        <div>
          Enjoy playing <strong>${game.name}</strong>!<br>
          <small>Full screen recommended (F11)</small><br>
        </div>
        <button id="game-favorite-btn" class="favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}" type="button">
          ${isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites'}
        </button>
      </div>
    `;
  }

  const favoriteButton = document.getElementById('game-favorite-btn');
  if (favoriteButton) {
    favoriteButton.addEventListener('click', () => {
      toggleFavorite(game.name);
      favoriteButton.textContent = isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites';
      favoriteButton.classList.toggle('active', isFavorite(game.name));
    });
  }
}

function updateGameFavoriteButton() {
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  const favoriteButton = document.getElementById('game-favorite-btn');
  if (!gameName || !favoriteButton) return;
  favoriteButton.textContent = isFavorite(gameName) ? '★ Favorite' : '☆ Add to favorites';
  favoriteButton.classList.toggle('active', isFavorite(gameName));
}

// Auto run correct function
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('grid')) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', event => {
        searchQuery = event.target.value.toLowerCase().trim();
        renderHome();
      });
    }
    renderHome();

    // Save / Load buttons (export/import cookies)
    const saveBtn = document.getElementById('save-data-btn');
    const loadBtn = document.getElementById('load-data-btn');
    const fileInput = document.getElementById('load-file-input');

    function parseCookies() {
      const raw = document.cookie || '';
      if (!raw) return {};
      return raw.split('; ').reduce((acc, cookie) => {
        const eq = cookie.indexOf('=');
        if (eq < 0) return acc;
        const name = decodeURIComponent(cookie.substring(0, eq));
        const value = decodeURIComponent(cookie.substring(eq + 1));
        acc[name] = value;
        return acc;
      }, {});
    }

    function downloadJSON(data, filename) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function snapshotStorage(storage) {
      const out = {};
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          out[key] = storage.getItem(key);
        }
      } catch (err) {
        // Access to storage might be denied in some contexts
      }
      return out;
    }

    function exportCookiesToFile() {
      const cookies = parseCookies();
      const local = snapshotStorage(window.localStorage);
      const session = snapshotStorage(window.sessionStorage);
      const data = {
        meta: {
          hostname: location.hostname,
          generatedAt: new Date().toISOString()
        },
        cookies,
        localStorage: local,
        sessionStorage: session
      };
      const filename = `playyyy-save-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      console.log('Exporting save:', {
        cookiesCount: Object.keys(cookies).length,
        localStorageCount: Object.keys(local).length,
        sessionStorageCount: Object.keys(session).length,
        filename
      });
      downloadJSON(data, filename);
      alert(`Export ready: ${Object.keys(cookies).length} cookies, ${Object.keys(local).length} localStorage keys, ${Object.keys(session).length} sessionStorage keys. File: ${filename}`);
    }

    function importCookiesFromFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          // Support older exports which might be just a cookie map
          const cookieMap = parsed && parsed.cookies ? parsed.cookies : (parsed && parsed.cookies === undefined ? parsed : {});

          const cookieCount = cookieMap && typeof cookieMap === 'object' ? Object.keys(cookieMap).length : 0;
          const localCount = parsed && parsed.localStorage && typeof parsed.localStorage === 'object' ? Object.keys(parsed.localStorage).length : 0;
          const sessionCount = parsed && parsed.sessionStorage && typeof parsed.sessionStorage === 'object' ? Object.keys(parsed.sessionStorage).length : 0;

          console.log('Importing save file:', { cookieCount, localCount, sessionCount, fileName: file.name });

          // Ask user to confirm before applying
          const ok = confirm(`Load save file ${file.name}?\nThis will set ${cookieCount} cookies, ${localCount} localStorage keys and ${sessionCount} sessionStorage keys on ${location.hostname}. Continue?`);
          if (!ok) return;

          // Set cookies with a 1 year expiry and path=/ to restore broadly
          const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
          if (cookieMap && typeof cookieMap === 'object') {
            Object.keys(cookieMap).forEach(name => {
              const value = String(cookieMap[name]);
              try {
                document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
              } catch (e) {
                console.warn('Failed to set cookie', name, e);
              }
            });
          }

          // Restore localStorage and sessionStorage if present
          if (parsed && parsed.localStorage && typeof parsed.localStorage === 'object') {
            try {
              Object.keys(parsed.localStorage).forEach(k => {
                window.localStorage.setItem(k, parsed.localStorage[k]);
              });
            } catch (e) {
              console.warn('Failed to set localStorage keys', e);
            }
          }

          if (parsed && parsed.sessionStorage && typeof parsed.sessionStorage === 'object') {
            try {
              Object.keys(parsed.sessionStorage).forEach(k => {
                window.sessionStorage.setItem(k, parsed.sessionStorage[k]);
              });
            } catch (e) {
              console.warn('Failed to set sessionStorage keys', e);
            }
          }

          alert('Save loaded — cookies and storage set. Reload pages if needed.');
        } catch (err) {
          console.error(err);
          alert('Failed to load save file — invalid JSON. Open devtools console for details.');
        }
      };
      reader.readAsText(file);
    }

    if (saveBtn) saveBtn.addEventListener('click', exportCookiesToFile);
    if (loadBtn) loadBtn.addEventListener('click', () => fileInput && fileInput.click());
    if (fileInput) fileInput.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (f) importCookiesFromFile(f);
      fileInput.value = '';
    });
  } else if (document.getElementById('game-iframe')) {
    renderGame();
  }
});