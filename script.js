// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const CONFIG = {
  JSON_URL: 'games.json',
  STORAGE: {
    FAVORITES: 'playyyy-favorites',
    INTRO_SEEN: 'playyyy_intro',
    GAMES_CACHE: 'playyyy-games-cache',
    CACHE_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
  },
  DEBOUNCE: {
    SEARCH: 300,
    RESIZE: 250
  },
  ANIMATION: {
    INTRO_DURATION: 1500, // Reduced from 5000ms
    FADEOUT_DURATION: 800
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Sanitizes HTML to prevent XSS attacks
 * @param {string} str - Input string
 * @returns {string} - Sanitized string
 */
function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a string for use in HTML attributes
 * @param {string} str - Input string
 * @returns {string} - Sanitized attribute value
 */
function sanitizeAttr(str) {
  return sanitizeHtml(str).replace(/ /g, '_');
}

/**
 * Safely gets an element by ID with null check
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} - DOM element or null
 */
function getElement(id) {
  return document.getElementById(id);
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Normalizes game name for URL/thumbnail generation
 * @param {string} gameName - Game name
 * @returns {string} - Normalized name
 */
function normalizeGameName(gameName) {
  return String(gameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================
// STORAGE SERVICE
// ============================================
const StorageService = {
  /**
   * Gets favorites from localStorage
   * @returns {string[]} - Array of favorite game names
   */
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE.FAVORITES) || '[]');
    } catch (error) {
      console.error('Failed to read favorites:', error);
      return [];
    }
  },

  /**
   * Sets favorites in localStorage
   * @param {string[]} favorites - Array of favorite game names
   */
  setFavorites(favorites) {
    try {
      localStorage.setItem(CONFIG.STORAGE.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  },

  /**
   * Toggles favorite status for a game
   * @param {string} gameName - Game name
   * @returns {string[]} - Updated favorites array
   */
  toggleFavorite(gameName) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(gameName);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.unshift(gameName);
    }
    this.setFavorites(favorites);
    return favorites;
  },

  /**
   * Checks if a game is favorite
   * @param {string} gameName - Game name
   * @returns {boolean} - Is favorite
   */
  isFavorite(gameName) {
    return this.getFavorites().includes(gameName);
  },

  /**
   * Gets cached games or null if expired
   * @returns {Array|null} - Cached games or null
   */
  getCachedGames() {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE.GAMES_CACHE);
      if (!cached) return null;

      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp > CONFIG.STORAGE.CACHE_EXPIRY) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Sets games cache with timestamp
   * @param {Array} games - Games data
   */
  setCachedGames(games) {
    try {
      localStorage.setItem(
        CONFIG.STORAGE.GAMES_CACHE,
        JSON.stringify({ timestamp: Date.now(), data: games })
      );
    } catch (error) {
      console.error('Failed to cache games:', error);
    }
  }
};

// ============================================
// COOKIE SERVICE (Safe version)
// ============================================
const CookieService = {
  /**
   * Safely sets a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Expiration days
   */
  set(name, value, days = 30) {
    try {
      const sanitizedName = sanitizeAttr(name);
      const sanitizedValue = sanitizeAttr(value);
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${sanitizedName}=${sanitizedValue};${expires};path=/;SameSite=Lax`;
    } catch (error) {
      console.error('Failed to set cookie:', error);
    }
  },

  /**
   * Safely gets a cookie
   * @param {string} name - Cookie name
   * @returns {string|null} - Cookie value or null
   */
  get(name) {
    try {
      const sanitizedName = sanitizeAttr(name);
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${sanitizedName}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop().split(';').shift();
        return decodeURIComponent(cookieValue);
      }
      return null;
    } catch {
      return null;
    }
  }
};

// ============================================
// GAME SERVICE
// ============================================
const GameService = {
  allGames: null,
  searchQuery: '',

  /**
   * Loads games from JSON file with caching
   * @returns {Promise<Array>} - Games data
   */
  async loadGames() {
    // Try cache first
    if (!this.allGames) {
      this.allGames = StorageService.getCachedGames();
    }

    if (this.allGames) {
      return this.allGames;
    }

    try {
      const response = await fetch(CONFIG.JSON_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.allGames = await response.json();
      StorageService.setCachedGames(this.allGames);
      return this.allGames;
    } catch (error) {
      console.error('Failed to load games:', error);
      // Return cached games if available, otherwise empty array
      return StorageService.getCachedGames() || [];
    }
  },

  /**
   * Filters games based on search query
   * @returns {Array} - Filtered games
   */
  getFilteredGames() {
    if (!this.allGames) return [];
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return [...this.allGames];
    return this.allGames.filter(game =>
      game.name.toLowerCase().includes(query)
    );
  },

  /**
   * Gets thumbnail URL candidates for a game
   * @param {string} gameName - Game name
   * @returns {string[]} - Array of thumbnail URLs
   */
  getThumbnailCandidates(gameName) {
    const baseName = normalizeGameName(gameName);
    return [
      `images/thumbnails/${baseName}.jpg`,
      `images/thumbnails/${baseName}.jpeg`,
      `images/thumbnails/${baseName}.png`,
    ];
  },

  /**
   * Applies thumbnail with fallback
   * @param {HTMLImageElement} img - Image element
   * @param {string[]} candidates - Thumbnail URLs
   * @param {number} index - Current candidate index
   */
  applyThumbnailFallback(img, candidates, index = 0) {
    if (index >= candidates.length) {
      img.src = 'images/thumbnails/placeholder.jpg';
      img.alt = 'Game thumbnail';
      return;
    }

    img.onerror = () => {
      this.applyThumbnailFallback(img, candidates, index + 1);
    };
    img.src = candidates[index];
    img.alt = img.dataset.gameName || 'Game thumbnail';
  }
};

// ============================================
// DOM UTILITIES
// ============================================
const DOMUtils = {
  /**
   * Creates a game card element
   * @param {Object} game - Game data
   * @returns {HTMLElement} - Game card
   */
  createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'card glass';
    card.dataset.gameName = sanitizeAttr(game.name);

    const link = document.createElement('a');
    link.href = `play.html?game=${encodeURIComponent(game.name)}`;
    link.className = 'game-link';

    const thumbnail = document.createElement('img');
    thumbnail.loading = 'lazy';
    thumbnail.dataset.gameName = sanitizeAttr(game.name);
    thumbnail.alt = sanitizeHtml(game.name);

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const titleContainer = document.createElement('div');
    titleContainer.className = 'card-title-container';

    const titleLink = document.createElement('a');
    titleLink.href = `play.html?game=${encodeURIComponent(game.name)}`;
    titleLink.textContent = sanitizeHtml(game.name);
    titleLink.className = 'card-title-link';

    titleContainer.appendChild(titleLink);

    if (game.tag) {
      const tag = document.createElement('span');
      tag.className = 'card-tag';
      tag.textContent = sanitizeHtml(game.tag);
      titleContainer.appendChild(tag);
    }

    const favoriteButton = document.createElement('button');
    favoriteButton.type = 'button';
    favoriteButton.className = `favorite-btn ${StorageService.isFavorite(game.name) ? 'active' : ''}`;
    favoriteButton.setAttribute('aria-label', StorageService.isFavorite(game.name)
      ? `Remove ${sanitizeHtml(game.name)} from favorites`
      : `Add ${sanitizeHtml(game.name)} to favorites`);
    favoriteButton.textContent = StorageService.isFavorite(game.name) ? '★' : '☆';

    favoriteButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      StorageService.toggleFavorite(game.name);
      favoriteButton.classList.toggle('active', StorageService.isFavorite(game.name));
      favoriteButton.setAttribute('aria-label', StorageService.isFavorite(game.name)
        ? `Remove ${sanitizeHtml(game.name)} from favorites`
        : `Add ${sanitizeHtml(game.name)} to favorites`);
      favoriteButton.textContent = StorageService.isFavorite(game.name) ? '★' : '☆';

      // Update UI based on current page
      if (getElement('grid')) {
        GameRenderer.renderHome();
      }
      GameRenderer.updateGameFavoriteButton();
    });

    footer.appendChild(titleContainer);
    footer.appendChild(favoriteButton);

    link.appendChild(thumbnail);
    card.appendChild(link);
    card.appendChild(footer);

    // Apply thumbnail after element is in DOM for IntersectionObserver
    setTimeout(() => {
      const candidates = GameService.getThumbnailCandidates(game.name);
      GameService.applyThumbnailFallback(thumbnail, candidates);
    }, 0);

    return card;
  },

  /**
   * Renders game grid
   * @param {HTMLElement} container - Container element
   * @param {Array} games - Games to render
   */
  renderGameGrid(container, games) {
    if (!container) return;

    container.innerHTML = '';

    if (!games || games.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No games found.';
      container.appendChild(emptyState);
      return;
    }

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    games.forEach(game => {
      fragment.appendChild(DOMUtils.createGameCard(game));
    });
    container.appendChild(fragment);
  }
};

// ============================================
// RENDERER
// ============================================
const GameRenderer = {
  /**
   * Renders home page with games
   */
  async renderHome() {
    if (!GameService.allGames) {
      GameService.allGames = await GameService.loadGames();
    }

    const grid = getElement('grid');
    const favoritesGrid = getElement('favorites-grid');

    const filteredGames = GameService.getFilteredGames();
    const favoriteGames = filteredGames.filter(game => StorageService.isFavorite(game.name));
    const nonFavoriteGames = filteredGames.filter(game => !StorageService.isFavorite(game.name));

    DOMUtils.renderGameGrid(favoritesGrid, favoriteGames);
    DOMUtils.renderGameGrid(grid, nonFavoriteGames);
  },

  /**
   * Sets favicon for game page
   * @param {string} href - Favicon URL
   */
  setFavicon(href) {
    if (!href) return;

    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = sanitizeHtml(href);
  },

  /**
   * Renders game page
   */
  async renderGame() {
    const params = new URLSearchParams(window.location.search);
    const gameName = params.get('game');
    const decodedGameName = gameName ? decodeURIComponent(gameName) : null;

    const titleEl = getElement('game-title');
    if (titleEl) {
      titleEl.textContent = decodedGameName ? sanitizeHtml(decodedGameName) : 'No game selected';
    }

    if (!decodedGameName) {
      return;
    }

    // Set favicon based on game folder
    const safeName = encodeURIComponent(normalizeGameName(decodedGameName));
    this.setFavicon(`./games/${safeName}/favicon.png`);

    const games = await GameService.loadGames();
    const game = games.find(g => g.name === decodedGameName);

    if (!game) {
      if (titleEl) titleEl.textContent = 'Game not found';
      return;
    }

    if (titleEl) titleEl.textContent = sanitizeHtml(game.name);

    const iframe = getElement('game-iframe');
    if (iframe) {
      // Validate URL before setting src
      try {
        const url = new URL(game.url, window.location.origin);
        iframe.src = url.href;
      } catch (e) {
        console.error('Invalid game URL:', game.url, e);
        iframe.src = 'about:blank';
      }
    }

    const description = getElement('description');
    if (description) {
      description.innerHTML = `
        <div class="game-meta">
          <div>
            Enjoy playing <strong>${sanitizeHtml(game.name)}</strong>!<br>
            <small>Full screen recommended (F11)</small><br>
          </div>
          <button id="game-favorite-btn" class="favorite-btn favorite-btn-large ${
            StorageService.isFavorite(game.name) ? 'active' : ''
          }" type="button">
            ${StorageService.isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites'}
          </button>
        </div>
      `;
    }

    const favoriteButton = getElement('game-favorite-btn');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', () => {
        StorageService.toggleFavorite(game.name);
        const isFav = StorageService.isFavorite(game.name);
        favoriteButton.textContent = isFav ? '★ Favorite' : '☆ Add to favorites';
        favoriteButton.classList.toggle('active', isFav);
      });
    }
  },

  /**
   * Updates game favorite button state
   */
  updateGameFavoriteButton() {
    const params = new URLSearchParams(window.location.search);
    const gameName = params.get('game');
    const decodedGameName = gameName ? decodeURIComponent(gameName) : null;
    const favoriteButton = getElement('game-favorite-btn');

    if (!decodedGameName || !favoriteButton) return;

    const isFav = StorageService.isFavorite(decodedGameName);
    favoriteButton.textContent = isFav ? '★ Favorite' : '☆ Add to favorites';
    favoriteButton.classList.toggle('active', isFav);
  }
};

// ============================================
// EXPORT/IMPORT SERVICE (Safe version)
// ============================================
const ExportImportService = {
  /**
   * Parses cookies safely
   * @returns {Object} - Parsed cookies
   */
  parseCookies() {
    const raw = document.cookie || '';
    if (!raw) return {};

    const cookies = {};
    raw.split('; ').forEach(cookie => {
      const eq = cookie.indexOf('=');
      if (eq < 0) return;

      try {
        const name = decodeURIComponent(cookie.substring(0, eq).trim());
        const value = decodeURIComponent(cookie.substring(eq + 1).trim());
        if (name && value) {
          cookies[sanitizeAttr(name)] = sanitizeHtml(value);
        }
      } catch (e) {
        console.warn('Failed to parse cookie:', cookie, e);
      }
    });
    return cookies;
  },

  /**
   * Creates a downloadable JSON file
   * @param {Object} data - Data to export
   * @param {string} filename - Filename
   */
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeAttr(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },

  /**
   * Creates a snapshot of storage
   * @param {Storage} storage - localStorage or sessionStorage
   * @returns {Object} - Storage snapshot
   */
  snapshotStorage(storage) {
    const out = {};
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key);
          out[sanitizeAttr(key)] = sanitizeHtml(value || '');
        }
      }
    } catch (err) {
      console.warn('Failed to access storage:', err);
    }
    return out;
  },

  /**
   * Exports cookies and storage to file
   */
  exportCookiesToFile() {
    const cookies = this.parseCookies();
    const local = this.snapshotStorage(window.localStorage);
    const session = this.snapshotStorage(window.sessionStorage);

    const data = {
      meta: {
        hostname: sanitizeHtml(location.hostname),
        generatedAt: new Date().toISOString(),
        version: '1.0'
      },
      cookies,
      localStorage: local,
      sessionStorage: session
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `playyyy-save-${timestamp}.json`;

    console.log('Exporting save:', {
      cookiesCount: Object.keys(cookies).length,
      localStorageCount: Object.keys(local).length,
      sessionStorageCount: Object.keys(session).length,
      filename
    });

    this.downloadJSON(data, filename);

    // Sanitize alert message
    const safeFilename = sanitizeHtml(filename);
    alert(`Export ready: ${Object.keys(cookies).length} cookies, ${Object.keys(local).length} localStorage keys, ${Object.keys(session).length} sessionStorage keys. File: ${safeFilename}`);
  },

  /**
   * Imports cookies and storage from file
   * @param {File} file - Import file
   */
  importCookiesFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);

        // Validate structure
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid file structure');
        }

        const cookieMap = parsed.cookies || {};
        const cookieCount = Object.keys(cookieMap).length;
        const localCount = Object.keys(parsed.localStorage || {}).length;
        const sessionCount = Object.keys(parsed.sessionStorage || {}).length;

        console.log('Importing save file:', {
          cookieCount,
          localCount,
          sessionCount,
          fileName: sanitizeHtml(file.name)
        });

        // Ask for confirmation with sanitized filename
        const safeFilename = sanitizeHtml(file.name);
        const ok = confirm(`Load save file ${safeFilename}?\nThis will set ${cookieCount} cookies, ${localCount} localStorage keys and ${sessionCount} sessionStorage keys on ${sanitizeHtml(location.hostname)}. Continue?`);

        if (!ok) return;

        // Set cookies with safe defaults
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        Object.entries(cookieMap).forEach(([name, value]) => {
          if (typeof name === 'string' && typeof value === 'string') {
            try {
              const safeName = sanitizeAttr(name);
              const safeValue = sanitizeAttr(value);
              document.cookie = `${safeName}=${safeValue}; path=/; expires=${expires}; SameSite=Lax`;
            } catch (e) {
              console.warn('Failed to set cookie:', name, e);
            }
          }
        });

        // Restore localStorage
        if (parsed.localStorage && typeof parsed.localStorage === 'object') {
          try {
            Object.entries(parsed.localStorage).forEach(([key, value]) => {
              if (typeof key === 'string') {
                const safeKey = sanitizeAttr(key);
                const safeValue = typeof value === 'string' ? value : String(value);
                window.localStorage.setItem(safeKey, safeValue);
              }
            });
          } catch (e) {
            console.warn('Failed to set localStorage keys', e);
          }
        }

        // Restore sessionStorage
        if (parsed.sessionStorage && typeof parsed.sessionStorage === 'object') {
          try {
            Object.entries(parsed.sessionStorage).forEach(([key, value]) => {
              if (typeof key === 'string') {
                const safeKey = sanitizeAttr(key);
                const safeValue = typeof value === 'string' ? value : String(value);
                window.sessionStorage.setItem(safeKey, safeValue);
              }
            });
          } catch (e) {
            console.warn('Failed to set sessionStorage keys', e);
          }
        }

        alert('Save loaded — cookies and storage set. Reload pages if needed.');
        // Refresh the page to apply changes
        location.reload();
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to load save file — invalid JSON or structure. Open devtools console for details.');
      }
    };
    reader.readAsText(file);
  }
};

// ============================================
// INTRO ANIMATION
// ============================================
const IntroAnimation = {
  intro: getElement('intro'),
  fill: getElement('fill'),
  status: getElement('status'),

  /**
   * Finishes intro animation
   */
  finishIntro() {
    if (this.intro) {
      this.intro.classList.add('fadeout');
      setTimeout(() => {
        if (this.intro) {
          this.intro.style.display = 'none';
        }
        CookieService.set(CONFIG.STORAGE.INTRO_SEEN, '1', 30);
      }, CONFIG.ANIMATION.FADEOUT_DURATION);
    }
  },

  /**
   * Animates intro loading bar
   */
  animate() {
    let progress = 0;
    const start = performance.now();
    const duration = CONFIG.ANIMATION.INTRO_DURATION;

    const animateFrame = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      progress = Math.floor(t * 100);

      if (this.fill) {
        this.fill.style.width = `${progress}%`;
      }

      if (this.status) {
        if (progress < 30) {
          this.status.textContent = 'Preparing assets...';
        } else if (progress < 60) {
          this.status.textContent = 'Loading games...';
        } else if (progress < 90) {
          this.status.textContent = 'Finalizing...';
        } else {
          this.status.textContent = 'Ready';
        }
      }

      if (t < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        this.finishIntro();
      }
    };

    requestAnimationFrame(animateFrame);
  },

  /**
   * Initializes intro based on cookie
   */
  init() {
    const hasSeen = CookieService.get(CONFIG.STORAGE.INTRO_SEEN) === '1';

    if (!hasSeen) {
      this.animate();
    } else {
      if (getElement('loader')) {
        getElement('loader').style.display = 'none';
      }
      if (getElement('status')) {
        getElement('status').style.display = 'none';
      }
      setTimeout(() => {
        this.finishIntro();
      }, 500);
    }
  }
};

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize intro
  IntroAnimation.init();

  // Check which page we're on
  if (getElement('grid')) {
    // Home page
    const searchInput = getElement('search-input');

    if (searchInput) {
      // Debounced search
      const handleSearch = debounce((event) => {
        GameService.searchQuery = event.target.value.toLowerCase().trim();
        GameRenderer.renderHome();
      }, CONFIG.DEBOUNCE.SEARCH);

      searchInput.addEventListener('input', handleSearch);
    }

    // Initial render
    GameRenderer.renderHome();

    // Save/Load buttons (export/import)
    const saveBtn = getElement('save-data-btn');
    const loadBtn = getElement('load-data-btn');
    const fileInput = getElement('load-file-input');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        ExportImportService.exportCookiesToFile();
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          ExportImportService.importCookiesFromFile(file);
        }
        fileInput.value = '';
      });
    }

    // Lazy loading for thumbnails with IntersectionObserver
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const gameName = img.dataset.gameName;
            if (gameName) {
              const candidates = GameService.getThumbnailCandidates(gameName);
              GameService.applyThumbnailFallback(img, candidates);
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });

      // Observe all images in grid
      const observeImages = () => {
        document.querySelectorAll('.card img').forEach(img => {
          if (!img.src || img.src === 'images/thumbnails/placeholder.jpg') {
            observer.observe(img);
          }
        });
      };

      // Initial observation
      setTimeout(observeImages, 100);

      // Re-observe after render
      const originalRenderHome = GameRenderer.renderHome;
      GameRenderer.renderHome = async function() {
        await originalRenderHome.apply(this, arguments);
        setTimeout(observeImages, 50);
      };
    }

  } else if (getElement('game-iframe')) {
    // Game page
    GameRenderer.renderGame();
  }
});

// ============================================
// COOKIE FUNCTIONS (Backward compatible)
// ============================================
/**
 * Sets a cookie (backward compatible)
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration days
 */
function setCookie(name, value, days) {
  CookieService.set(name, value, days);
}

/**
 * Gets a cookie (backward compatible)
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null
 */
function getCookie(name) {
  return CookieService.get(name);
}

// ============================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================
// These ensure existing code that might reference these functions still works
window.toggleFavorite = (gameName) => {
  StorageService.toggleFavorite(gameName);
  if (getElement('grid')) GameRenderer.renderHome();
  GameRenderer.updateGameFavoriteButton();
};

window.isFavorite = (gameName) => StorageService.isFavorite(gameName);
window.getFavorites = () => StorageService.getFavorites();
window.setFavorites = (favs) => StorageService.setFavorites(favs);
window.normalizeGameName = normalizeGameName;
