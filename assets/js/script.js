function loadStatcounter() {
  if (window.sc_project || window.location.hostname !== 'louis141414.github.io') return;

  window.sc_project = 13299407;
  window.sc_invisible = 1;
  window.sc_security = 'd0abe929';

  const script = document.createElement('script');
  script.src = 'https://www.statcounter.com/counter/counter.js';
  script.async = true;
  script.onerror = () => console.error('Could not load StatCounter tracking script.');
  document.head.appendChild(script);
}

// =======================
// SUPER SIMPLE VERSION
// =======================

let allGames = []; // ✅ Altijd array
let searchQuery = '';
let selectedCategory = 'all';
let selectedSort = 'recent';
let wheelSpinTimer = null;
let wheelSpinAnimation = null;
const GAME_CARD_BATCH_SIZE = 24;
const GAME_CACHE_NAME = 'playyyy-games-v1';

function getBrowseParams() {
  const params = new URLSearchParams();
  if (searchQuery.trim()) params.set('q', searchQuery.trim());
  if (selectedCategory !== 'all') params.set('category', selectedCategory);
  if (selectedSort !== 'recent') params.set('sort', selectedSort);
  return params;
}

function updateBrowseUrl() {
  const params = getBrowseParams();
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

function readBrowseUrl() {
  const params = new URLSearchParams(window.location.search);
  searchQuery = params.get('q') || '';
  selectedCategory = params.get('category') || 'all';
  const requestedSort = params.get('sort');
  selectedSort = ['recent', 'newest', 'az', 'favorites'].includes(requestedSort) ? requestedSort : 'recent';
  if (selectedSort === 'newest') selectedSort = 'recent';
}

function getGameUrl(game) {
  const params = new URLSearchParams({ id: game.name });
  const browseQuery = getBrowseParams().toString();
  if (browseQuery) params.set('from', `?${browseQuery}`);
  return `${getAppBasePath()}game/?${params}`;
}

function getAppBasePath() {
  return new URL('.', document.baseURI).pathname;
}

function getGamesHomeUrl(from) {
  const requestedReturn = new URLSearchParams(String(from || '').replace(/^\?/, ''));
  const returnParams = new URLSearchParams();
  for (const key of ['q', 'category', 'sort']) {
    const value = requestedReturn.get(key);
    if (value) returnParams.set(key, value);
  }
  return `${getAppBasePath()}${returnParams.size ? `?${returnParams}` : ''}#all-games`;
}

const CATEGORY_GAME_NAMES = {
  Action: ['1v1.LOL', '10 Minutes Till Dawn', 'Age of War', "Baldi's Basics", 'Battle Beavers', 'Choose Your Weapon', 'Electric Man 2', 'FNAF', 'Gun Mayhem', 'Happy Wheels', 'Knife Hit', 'Raft Wars', 'Skibidi', 'Stick War', 'Superhot', 'The Binding of Isaac', 'Zombocalypse', 'Zombotron'],
  Racing: ['Aquapark Slides', 'Crazy Tunnel 3D', 'Drift Hunters', 'Drive Mad', 'escape road', 'HexGL', 'Monster Tracks', 'Moto X3M', 'PolyTrack', 'Slope', 'Subway Surfers', 'Tanuki Sunset', 'Tunnel Rush'],
  Puzzle: ['2048', 'Astray', 'Bad Ice Cream', 'Bad Piggies', 'Bloxors', 'Chess', 'Color Switch', 'Cut the Rope', 'Factory Balls', 'Hextris', 'Infinite Craft', 'Minesweeper', 'Portal', 'Tetris', 'The Impossible Quiz', 'There Is No Game', 'This is the Only Level', 'Unfair Mario', 'Watermelon Game', 'We Become What We Behold', 'Wordle', "World's Hardest Game"],
  Idle: ['BitLife', 'Clicker Heroes', 'Cookie Clicker', 'Corporation Inc', "Papa's Freezeria", 'Sort the Court', 'Stack', 'Tiny Fishing', 'Townscaper'],
  '.io': ['Hole.io', 'Paper.io 2', 'Territorial.io', 'Yohoho.io'],
  Platformer: ['Achievement Unlocked', 'Appel', 'Cactus McCoy', 'Celeste', 'Dadish', 'Dino Bros', 'Doodle Jump', 'Fancy Pants Adventure', 'Fireboy and Watergirl', 'Flappy Bird', 'Geometry Dash', 'Gobble', 'Helix Jump', 'Learn to Fly', 'Level Devil', 'OVO', 'Red Ball 4', 'Roper', 'Run', 'Run 2', 'Run 3', 'Shift', 'Space Waves', 'Stickman Hook', 'Vex'],
  Sports: ['1 on 1 Soccer', 'Basket Bros', 'Champion Island', 'Crossy Road', 'Retro Bowl'],
  Strategy: ['Bloons TD', 'Pandemic 2', 'Stick War', 'Totally Accurate Battle Simulator'],
  Adventure: ['Among Us', 'Duck Life', 'Fruit Ninja', 'Jetpack Joyride']
};

function getGameCategory(game) {
  if (game.category) return game.category;
  return Object.entries(CATEGORY_GAME_NAMES).find(([, names]) => names.includes(game.name))?.[0] || 'Uncategorized';
}

function sortGames(games) {
  const sortedGames = [...games];
  if (selectedSort === 'az') {
    sortedGames.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  } else if (selectedSort === 'favorites') {
    sortedGames.sort((a, b) => Number(isFavorite(b.name)) - Number(isFavorite(a.name)));
  }
  return sortedGames;
}

function renderActiveFilters() {
  const container = document.getElementById('active-filters');
  if (!container) return;

  container.replaceChildren();
  const filters = [];
  if (searchQuery.trim()) filters.push({ label: `Search: ${searchQuery.trim()}`, clear: () => { searchQuery = ''; } });
  if (selectedCategory !== 'all') filters.push({ label: `Category: ${selectedCategory}`, clear: () => { selectedCategory = 'all'; } });
  if (selectedSort !== 'recent') {
    const sortLabels = { newest: 'Recently added', az: 'A–Z', favorites: 'Most favorited' };
    filters.push({ label: `Sort: ${sortLabels[selectedSort] || 'Recently added'}`, clear: () => { selectedSort = 'recent'; } });
  }

  if (!filters.length) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  filters.forEach(filter => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip';
    chip.append(filter.label);
    const removeIcon = createUiIcon('m18 6-12 12M6 6l12 12', 'filter-remove-icon');
    chip.append(removeIcon);
    chip.setAttribute('aria-label', `Remove ${filter.label} filter`);
    chip.addEventListener('click', () => {
      filter.clear();
      syncBrowseControls();
      updateBrowseUrl();
      renderHome();
    });
    container.appendChild(chip);
  });

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'clear-filters-btn';
  clearButton.textContent = 'Clear all';
  clearButton.addEventListener('click', clearBrowseFilters);
  container.appendChild(clearButton);
}

function syncBrowseControls() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  if (searchInput) searchInput.value = searchQuery;
  if (categoryFilter) categoryFilter.value = selectedCategory;
  if (sortFilter) sortFilter.value = selectedSort;
}

function clearBrowseFilters() {
  searchQuery = '';
  selectedCategory = 'all';
  selectedSort = 'recent';
  syncBrowseControls();
  updateBrowseUrl();
  renderHome();
}

function renderFeaturedGame() {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid || !allGames.length) return;

  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86400000);
  const game = allGames[((dayNumber % allGames.length) + allGames.length) % allGames.length];
  const card = createGameCard(game);
  card.classList.add('featured-card');
  card.setAttribute('aria-label', `Game of the day: ${game.name}`);
  const titleContainer = card.querySelector('.card-title-container');
  const category = document.createElement('span');
  category.className = 'featured-category';
  category.textContent = getGameCategory(game);
  titleContainer.appendChild(category);
  titleContainer.querySelectorAll('.card-tag:not(.card-popularity-badge)').forEach(tag => tag.remove());
  const reportLink = card.querySelector('.report-link');
  if (reportLink) reportLink.remove();
  featuredGrid.replaceChildren(card);
}

// =======================
// LOAD GAMES (Altijd werkt!)
// =======================
async function loadGames() {
  try {
    const response = await fetch('games.json');
    allGames = await response.json();
    
    // ✅ ZORG DAT HET EEN ARRAY IS!
    if (!Array.isArray(allGames)) {
      allGames = [];
    }
    
    return allGames;
  } catch (error) {
    console.error('Error loading games:', error);
    allGames = []; // ✅ Altijd array
    return [];
  }
}

// =======================
// FAVORITES
// =======================
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('playyyy-favorites') || '[]');
  } catch {
    return [];
  }
}

function isFavorite(name) {
  if (!name) return false;
  return getFavorites().includes(name);
}

function toggleFavorite(name) {
  if (!name) return;
  
  const favorites = getFavorites();
  const index = favorites.indexOf(name);
  
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(name);
  }
  
  localStorage.setItem('playyyy-favorites', JSON.stringify(favorites));
  
  // Update UI
  if (document.getElementById('grid')) renderHome();
  if (document.getElementById('featured-grid')) renderFeaturedGame();
  updateGameFavoriteButton();
}

// =======================
// THUMBNAILS
// =======================
function normalizeName(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getThumbnailCandidates(name) {
  const base = normalizeName(name);
  if (name === 'Doom') {
    return [
      'assets/images/thumbnails/doom.svg',
      `assets/images/thumbnails/${base}.jpg`,
      `assets/images/thumbnails/${base}.jpeg`,
      `assets/images/thumbnails/${base}.png`,
    ];
  }
  if (name === 'Appel') {
    return [
      'assets/images/thumbnails/appel.svg',
      `assets/images/thumbnails/${base}.jpg`,
      `assets/images/thumbnails/${base}.jpeg`,
      `assets/images/thumbnails/${base}.png`,
    ];
  }
  return [
    `assets/images/thumbnails/${base}.jpg`,
    `assets/images/thumbnails/${base}.jpeg`,
    `assets/images/thumbnails/${base}.png`,
  ];
}

function applyThumbnailFallback(img, candidates, index = 0) {
  if (!img) return;
  if (index >= candidates.length) {
    img.src = 'assets/images/thumbnails/placeholder.jpg';
    return;
  }
  img.onerror = () => applyThumbnailFallback(img, candidates, index + 1);
  img.src = candidates[index];
}

// =======================
// CREATE GAME CARD
// =======================
function createUiIcon(path, className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `ui-icon ${className}`);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  iconPath.setAttribute('d', path);
  svg.appendChild(iconPath);
  return svg;
}

function renderFavoriteButton(button, active, showLabel = false) {
  const star = createUiIcon('m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z', 'favorite-icon');
  button.replaceChildren(star);
  if (showLabel) button.append(active ? 'Favorite' : 'Add to favorites');
}

function createGameCard(game) {
  if (!game || !game.name) {
    return document.createElement('div');
  }

  const card = document.createElement('div');
  card.className = 'card glass';
  card.tabIndex = 0;
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', `Game: ${game.name}`);

  const link = document.createElement('a');
  link.href = getGameUrl(game);

  const thumbnail = document.createElement('img');
  thumbnail.alt = game.name;
  thumbnail.loading = 'lazy';
  thumbnail.decoding = 'async';

  const candidates = getThumbnailCandidates(game.name);
  applyThumbnailFallback(thumbnail, candidates);

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'card-title-container';

  const titleLink = document.createElement('a');
  titleLink.href = getGameUrl(game);
  titleLink.textContent = game.name;
  titleLink.className = 'card-title-link';

  titleContainer.appendChild(titleLink);

  const isPopular = game.popularity === true || /popular|most played/i.test(game.tag || '');
  if (isPopular) {
    const tag = document.createElement('span');
    tag.className = 'card-tag card-popularity-badge';
    tag.textContent = 'Popular';
    tag.setAttribute('aria-label', `${game.name} is marked as popular`);
    titleContainer.appendChild(tag);
  }

  if (game.tag && !isPopular) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = game.tag;
    titleContainer.appendChild(tag);
  }

  const favoriteBtn = document.createElement('button');
  favoriteBtn.type = 'button';
  favoriteBtn.className = `favorite-btn ${isFavorite(game.name) ? 'active' : ''}`;
  renderFavoriteButton(favoriteBtn, isFavorite(game.name));
  favoriteBtn.setAttribute('aria-label', `${isFavorite(game.name) ? 'Remove' : 'Add'} ${game.name} ${isFavorite(game.name) ? 'from' : 'to'} favorites`);
  favoriteBtn.setAttribute('aria-pressed', String(isFavorite(game.name)));
  favoriteBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(game.name);
  };

  const reportLink = document.createElement('a');
  reportLink.href = reportIssueUrl(game.name);
  reportLink.target = '_blank';
  reportLink.rel = 'noopener noreferrer';
  reportLink.className = 'report-link';
  reportLink.textContent = 'Report';
  reportLink.setAttribute('aria-label', `Report ${game.name} as broken`);

  footer.appendChild(titleContainer);
  footer.appendChild(reportLink);
  footer.appendChild(favoriteBtn);

  link.appendChild(thumbnail);
  card.appendChild(link);
  card.appendChild(footer);

  return card;
}

// =======================
// RENDER GAMES
// =======================
function renderGameGrid(container, games, emptyMessage, emptySuggestion, batchSize = 0) {
  if (!container) return;

  container.innerHTML = '';

  if (!games || games.length === 0) {
    if (!emptyMessage) return;
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    if (emptySuggestion) {
      const suggestion = document.createElement('span');
      suggestion.textContent = emptySuggestion;
      empty.appendChild(suggestion);
    }
    container.appendChild(empty);
    return;
  }

  const appendGames = (start, end, beforeElement = null) => {
    const fragment = document.createDocumentFragment();
    games.slice(start, end).forEach(game => {
      if (game) fragment.appendChild(createGameCard(game));
    });
    if (beforeElement) container.insertBefore(fragment, beforeElement);
    else container.appendChild(fragment);
  };

  if (!batchSize || games.length <= batchSize) {
    appendGames(0, games.length);
    return;
  }

  let renderedCount = 0;
  const loadMoreButton = document.createElement('button');
  loadMoreButton.type = 'button';
  loadMoreButton.className = 'load-more-games';
  loadMoreButton.addEventListener('click', () => {
    const nextCount = Math.min(renderedCount + batchSize, games.length);
    appendGames(renderedCount, nextCount, loadMoreButton);
    renderedCount = nextCount;
    if (renderedCount < games.length) {
      loadMoreButton.textContent = `Show ${Math.min(batchSize, games.length - renderedCount)} more games`;
    } else {
      loadMoreButton.textContent = 'All games loaded';
      loadMoreButton.disabled = true;
    }
  });
  const firstCount = Math.min(batchSize, games.length);
  appendGames(0, firstCount);
  renderedCount = firstCount;
  loadMoreButton.textContent = `Show ${Math.min(batchSize, games.length - renderedCount)} more games`;
  container.appendChild(loadMoreButton);
}

// =======================
// RENDER HOME
// =======================
async function renderHome() {
  const grid = document.getElementById('grid');
  const favoritesGrid = document.getElementById('favorites-grid');
  const recentGrid = document.getElementById('recent-grid');
  const recentSection = document.getElementById('recent-section');
  const allGamesDescription = document.getElementById('all-games-description');

  if (!grid && !favoritesGrid) return;

  // ✅ ZORG DAT GAMES GELADEN ZIJN
  if (allGames.length === 0) {
    await loadGames();
  }

  // ✅ Filter games
  const query = (searchQuery || '').toLowerCase().trim();
  const matchingGames = query
    ? allGames.filter(g => g && g.name && g.name.toLowerCase().includes(query))
    : allGames;
  const filteredGames = selectedCategory === 'all'
    ? matchingGames
    : matchingGames.filter(game => getGameCategory(game) === selectedCategory);

  const favoriteGames = getFavorites()
    .map(name => allGames.find(game => game && game.name === name))
    .filter(Boolean);
  const otherGames = filteredGames.filter(g => g && !isFavorite(g.name));
  const showAllInCatalog = selectedSort === 'favorites';
  const catalogGames = sortGames(showAllInCatalog ? filteredGames : otherGames);

  if (allGamesDescription) {
    allGamesDescription.textContent = `${filteredGames.length} ${filteredGames.length === 1 ? 'game' : 'games'} found${showAllInCatalog ? ' · your favorites first' : ''}`;
  }
  renderActiveFilters();
  renderGameGrid(favoritesGrid, favoriteGames, 'No favorites yet.', 'Tap a star on any game to save it here.');
  renderGameGrid(
    grid,
    catalogGames,
    filteredGames.length === 0 ? 'No games match these filters.' : 'All matching games are in your favorites.',
    filteredGames.length === 0 ? 'Try another search or choose a different category.' : '',
    GAME_CARD_BATCH_SIZE
  );

  const recentGames = getRecentlyPlayed()
    .map(name => allGames.find(game => game && game.name === name))
    .filter(Boolean);
  if (recentSection) recentSection.hidden = recentGames.length === 0;
  renderGameGrid(recentGrid, recentGames);
}

function getRecentlyPlayed() {
  try {
    const recent = JSON.parse(localStorage.getItem('playyyy-recent') || '[]');
    return Array.isArray(recent) ? recent.filter(name => typeof name === 'string').slice(0, 4) : [];
  } catch {
    return [];
  }
}

function addRecentlyPlayed(name) {
  const recent = getRecentlyPlayed().filter(gameName => gameName !== name);
  recent.unshift(name);
  try {
    localStorage.setItem('playyyy-recent', JSON.stringify(recent.slice(0, 8)));
  } catch (error) {
    console.warn('Could not save recently played games:', error);
  }
}

function reportIssueUrl(gameName) {
  const params = new URLSearchParams({
    title: `Broken game: ${gameName}`,
    body: `The game "${gameName}" appears to be broken.\n\nPage: ${window.location.origin}${getAppBasePath()}game/?id=${encodeURIComponent(gameName)}\n\nWhat happened?`,
  });
  return `https://github.com/louis141414/playyyy/issues/new?${params}`;
}

// =======================
// =======================
// RENDER GAME PAGE
// =======================
function setGameLoading(title, message, { indeterminate = true, retryVisible = false } = {}) {
  const loading = document.getElementById('game-loading');
  const progress = document.getElementById('game-download-progress');
  const loadingBar = document.getElementById('game-loading-indeterminate');
  const status = document.getElementById('game-loading-status');
  const retry = document.getElementById('game-download-retry');
  const titleElement = document.getElementById('game-loading-title');

  if (titleElement) titleElement.textContent = title;
  if (status) status.textContent = message;
  if (progress) progress.hidden = true;
  if (loadingBar) loadingBar.hidden = !indeterminate;
  if (retry) retry.hidden = !retryVisible;
  if (loading) loading.hidden = false;
}

function isMinecraftGame(game) {
  return game.name.toLowerCase().includes('minecraft');
}

function formatDownloadSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function preloadMinecraftIndex(game, iframe) {
  const loading = document.getElementById('game-loading');
  const progress = document.getElementById('game-download-progress');
  const status = document.getElementById('game-loading-status');
  const retry = document.getElementById('game-download-retry');

  if (!loading || !progress || !status || !retry || !window.caches) {
    launchGameFrame(game, iframe);
    return;
  }

  const indexUrl = new URL(game.url, document.baseURI);

  try {
    const cache = await window.caches.open(GAME_CACHE_NAME);
    if (await cache.match(indexUrl.href)) {
      launchGameFrame(game, iframe);
      return;
    }

    setGameLoading('Preparing Minecraft', `Downloading ${game.name} to your browser cache. This large download may take a few minutes.`, {
      indeterminate: true
    });
    progress.removeAttribute('value');

    const response = await fetch(indexUrl);
    if (!response.ok) throw new Error(`Download returned HTTP ${response.status}`);

    const total = Number(response.headers.get('content-length'));
    const hasTotal = Number.isSafeInteger(total) && total > 0;
    progress.hidden = !hasTotal;
    document.getElementById('game-loading-indeterminate').hidden = hasTotal;
    if (hasTotal) {
      progress.max = total;
    }

    const cacheWrite = cache.put(indexUrl.href, response.clone());
    if (response.body) {
      const reader = response.body.getReader();
      let downloaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        downloaded += value.byteLength;

        if (hasTotal) progress.value = Math.min(downloaded, total);
        status.textContent = hasTotal
          ? `Downloaded ${formatDownloadSize(downloaded)} of ${formatDownloadSize(total)}`
          : `Downloaded ${formatDownloadSize(downloaded)}`;
      }
    }

    await cacheWrite;
    launchGameFrame(game, iframe);
  } catch (error) {
    console.error(`Could not preload ${game.name} into the browser cache:`, error);
    const message = error instanceof Error && error.message.includes('HTTP')
      ? `The game file could not be downloaded (${error.message}). Check your connection and try again.`
      : 'The game could not be saved to your browser cache. Check your connection or available storage, then try again.';
    setGameLoading('Could not prepare Minecraft', message, {
      indeterminate: false,
      retryVisible: true
    });
    retry.onclick = () => preloadMinecraftIndex(game, iframe);
  }
}

function isVisibleInGame(element, gameWindow) {
  if (!element.isConnected || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = gameWindow.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}

function getProgressRatio(element, gameWindow) {
  const progressElement = element.matches('progress,[role="progressbar"]')
    ? element
    : element.querySelector('progress,[role="progressbar"]');
  if (progressElement) {
    const value = Number(progressElement.getAttribute('aria-valuenow') ?? progressElement.value);
    const max = Number(progressElement.getAttribute('aria-valuemax') ?? progressElement.max ?? 1);
    if (Number.isFinite(value) && Number.isFinite(max) && max > 0) return value / max;
  }

  const fill = element.matches('.full,.inner,.fill,#unity-progress-bar-full,#loading-inner,[class*="progress-bar-full"],[class*="progress-bar-inner"]')
    ? element
    : element.querySelector('.full,.inner,.fill,#unity-progress-bar-full,#loading-inner,[class*="progress-bar-full"],[class*="progress-bar-inner"]');
  if (!fill) return null;

  const width = fill.style.width || gameWindow.getComputedStyle(fill).width;
  if (width.endsWith('%')) {
    const ratio = Number.parseFloat(width) / 100;
    return Number.isFinite(ratio) ? ratio : null;
  }

  const widthPixels = Number.parseFloat(width);
  const parentWidth = fill.parentElement?.clientWidth || 0;
  return parentWidth > 0 && Number.isFinite(widthPixels) ? widthPixels / parentWidth : null;
}

function getGameLoadingElements(gameDocument, gameWindow) {
  const candidates = gameDocument.querySelectorAll('[id], [class]');
  const loadingElements = [];
  const loadingName = /load|progress|preload|splash|spinner/i;
  const loadingText = /loading|downloading|starting|initializing|please wait/i;

  for (const element of candidates) {
    if (element === gameDocument.body || element === gameDocument.documentElement || /^(canvas|button|input|progress)$/i.test(element.tagName)) continue;
    const name = `${element.id} ${typeof element.className === 'string' ? element.className : ''}`;
    if (!loadingName.test(name) || !isVisibleInGame(element, gameWindow)) continue;

    const text = (element.innerText || element.textContent || '').trim();
    const hasProgress = Boolean(element.querySelector('progress,[role="progressbar"],.full,#unity-progress-bar-full,#loading-inner,[class*="progress-bar-inner"]'));
    if (!hasProgress && !loadingText.test(text)) continue;
    loadingElements.push(element);
  }

  return loadingElements.filter(element => !loadingElements.some(other => other !== element && other.contains(element)));
}

function isGameLoaderComplete(element, gameWindow) {
  if (!element.isConnected || element.hidden || element.getAttribute('aria-hidden') === 'true') return true;
  const style = gameWindow.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return true;
  if (/\b(complete|completed|loaded|finished|done|error|failed)\b/i.test(element.className)) return true;
  if (/\b(error|failed|unable to load)\b/i.test(element.textContent || '')) return true;
  const progress = getProgressRatio(element, gameWindow);
  return progress !== null && progress >= 0.995;
}

function usesRufflePlayer(gameDocument, gameWindow) {
  return [...gameDocument.scripts].some(script => /ruffle/i.test(script.src))
    || Boolean(gameDocument.querySelector('ruffle-player, #ruffle-container, #ruffle'))
    || 'RufflePlayer' in gameWindow;
}

function blockExternalNavigation(gameWindow, gameDocument, iframe, game, token) {
  const appOrigin = window.location.origin;
  const reportBlocked = () => {
    if (token !== iframe.gameLoadToken) return;
    setGameLoading(game.name, 'This game tried to open a page outside Playyyy. Navigation was blocked.', {
      indeterminate: false,
      retryVisible: true
    });
    const retry = document.getElementById('game-download-retry');
    if (retry) retry.onclick = () => launchGameFrame(game, iframe);
  };
  const isExternal = value => {
    try {
      return new URL(value, gameDocument.baseURI).origin !== appOrigin;
    } catch (error) {
      console.error('Could not validate a game navigation URL:', error);
      return true;
    }
  };

  gameDocument.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || !isExternal(link.href)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reportBlocked();
  });

  gameDocument.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof gameWindow.HTMLFormElement) || !isExternal(form.action)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reportBlocked();
  }, true);

  for (const meta of gameDocument.querySelectorAll('meta[http-equiv="refresh"]')) {
    meta.remove();
  }

  const originalOpen = gameWindow.open.bind(gameWindow);
  gameWindow.open = (url, ...args) => {
    if (url && isExternal(url)) {
      reportBlocked();
      return null;
    }
    return originalOpen(url, ...args);
  };
}

function waitForGameReady(gameDocument, gameWindow, game, iframe, token) {
  const loaderStyle = gameDocument.createElement('style');
  loaderStyle.textContent = '.playyyy-native-loader { opacity: 0 !important; pointer-events: none !important; }';
  gameDocument.head.appendChild(loaderStyle);

  const syncLoaders = () => {
    const loaders = getGameLoadingElements(gameDocument, gameWindow);
    for (const element of loaders) element.classList.add('playyyy-native-loader');
    return loaders;
  };

  const loaders = syncLoaders();
  if (!loaders.length || loaders.every(element => isGameLoaderComplete(element, gameWindow))) {
    const loading = document.getElementById('game-loading');
    if (loading) loading.hidden = true;
    return;
  }

  setGameLoading(game.name, 'Starting game and loading its files...');
  const loadingTimeout = window.setTimeout(() => {
    if (token !== iframe.gameLoadToken) return;
    const loading = document.getElementById('game-loading');
    if (!loading || loading.hidden) return;
    setGameLoading(game.name, 'This game is taking longer than expected. You can keep waiting or try again.', {
      retryVisible: true
    });
    const retry = document.getElementById('game-download-retry');
    if (retry) retry.onclick = () => launchGameFrame(game, iframe);
  }, 60000);
  const observer = new gameWindow.MutationObserver(() => {
    if (token !== iframe.gameLoadToken) {
      observer.disconnect();
      return;
    }

    const currentLoaders = syncLoaders();
    if (!currentLoaders.length || currentLoaders.every(element => isGameLoaderComplete(element, gameWindow))) {
      window.clearTimeout(loadingTimeout);
      observer.disconnect();
      const loading = document.getElementById('game-loading');
      if (loading) loading.hidden = true;
    }
  });
  observer.observe(gameDocument.documentElement, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  });

}

function launchGameFrame(game, iframe) {
  iframe.gameLoadToken = (iframe.gameLoadToken || 0) + 1;
  const token = iframe.gameLoadToken;
  iframe.gameNavigationBlocked = false;
  const sandboxFlags = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads';
  if (iframe.getAttribute('sandbox') !== sandboxFlags) iframe.setAttribute('sandbox', sandboxFlags);
  if (!iframe.sandboxGuard) {
    iframe.sandboxGuard = new MutationObserver(() => {
      if (iframe.getAttribute('sandbox') !== sandboxFlags) {
        console.warn('Restored the game frame navigation restrictions.');
        iframe.setAttribute('sandbox', sandboxFlags);
      }
    });
    iframe.sandboxGuard.observe(iframe, { attributes: true, attributeFilter: ['sandbox'] });
  }
  const loading = document.getElementById('game-loading');

  if (iframe.gameLoadHandler) iframe.removeEventListener('load', iframe.gameLoadHandler);
  iframe.gameLoadHandler = () => {
    if (token !== iframe.gameLoadToken) return;
    if (iframe.gameNavigationBlocked) return;

    let gameWindow;
    let gameDocument;
    try {
      gameWindow = iframe.contentWindow;
      gameDocument = gameWindow.document;
      if (gameWindow.location.origin !== window.location.origin) {
        throw new Error('External game navigation detected.');
      }
    } catch (error) {
      console.warn(`Blocked an external navigation from ${game.name}.`, error);
      iframe.gameNavigationBlocked = true;
      iframe.src = 'about:blank';
      setGameLoading(game.name, 'This game tried to open a page outside Playyyy. Navigation was blocked.', {
        indeterminate: false,
        retryVisible: true
      });
      const retry = document.getElementById('game-download-retry');
      if (retry) retry.onclick = () => launchGameFrame(game, iframe);
      return;
    }

    blockExternalNavigation(gameWindow, gameDocument, iframe, game, token);
    if (usesRufflePlayer(gameDocument, gameWindow)) {
      setGameLoading(game.name, 'Starting game and loading its files...');
      waitForGameReady(gameDocument, gameWindow, game, iframe, token);
    } else if (loading) {
      loading.hidden = true;
    }
  };
  iframe.addEventListener('load', iframe.gameLoadHandler);

  if (isMinecraftGame(game)) {
    setGameLoading(game.name, 'Starting game and loading its files...');
  } else if (loading) {
    loading.hidden = true;
  }

  iframe.src = game.url;
}

async function renderGame() {
  const params = new URLSearchParams(window.location.search);
  const decodedName = params.get('id');
  const homeLink = document.getElementById('game-home-link');
  if (homeLink) homeLink.href = getGamesHomeUrl(params.get('from'));

  const titleEl = document.getElementById('game-title');
  const gameContainer = document.getElementById('game-container');
  const notFound = document.getElementById('game-not-found');

  const showNotFound = () => {
    if (titleEl) titleEl.textContent = 'Game not found';
    document.title = 'Game not found | Playyyy';
    document.getElementById('page-description')?.setAttribute('content', 'This Playyyy game link is invalid or unavailable. Browse the collection to find another game.');
    document.getElementById('og-title')?.setAttribute('content', 'Game not found | Playyyy');
    document.getElementById('og-description')?.setAttribute('content', 'This Playyyy game link is invalid or unavailable. Browse the collection to find another game.');
    if (gameContainer) gameContainer.hidden = true;
    if (notFound) notFound.hidden = false;
  };

  if (allGames.length === 0) {
    await loadGames();
  }

  if (!decodedName) {
    showNotFound();
    return;
  }

  const game = allGames.find(g => g && g.name === decodedName);
  if (!game) {
    showNotFound();
    return;
  }

  if (gameContainer) gameContainer.hidden = false;
  if (notFound) notFound.hidden = true;

  if (titleEl) titleEl.textContent = game.name;
  const pageTitle = `Play ${game.name} free online | Playyyy`;
  document.title = pageTitle;
  const descriptionText = `Play ${game.name} free in your browser on Playyyy. No download or account required.`;
  document.getElementById('page-description')?.setAttribute('content', descriptionText);
  document.getElementById('og-title')?.setAttribute('content', pageTitle);
  document.getElementById('og-description')?.setAttribute('content', descriptionText);
  document.getElementById('og-url')?.setAttribute('content', window.location.href);
  document.getElementById('twitter-title')?.setAttribute('content', pageTitle);
  document.getElementById('twitter-description')?.setAttribute('content', descriptionText);
  addRecentlyPlayed(game.name);
  loadStatcounter();

  const iframe = document.getElementById('game-iframe');
  if (iframe) {
    iframe.title = `${game.name}. Click inside the game to start if prompted.`;
    if (isMinecraftGame(game)) {
      preloadMinecraftIndex(game, iframe);
    } else {
      launchGameFrame(game, iframe);
    }
  }

  const description = document.getElementById('description');
  if (description) {
    description.innerHTML = `
      <div class="game-meta">
        <div>
          Enjoy playing <strong>${game.name}</strong>!<br>
          <small>Full screen recommended (F11)</small>
        </div>
        <button id="game-favorite-btn" class="favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}" type="button" aria-label="${isFavorite(game.name) ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`}" aria-pressed="${isFavorite(game.name)}">
          <svg class="ui-icon favorite-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z"></path>
          </svg>${isFavorite(game.name) ? 'Favorite' : 'Add to favorites'}
        </button>
        <a class="report-link report-link-large" href="${reportIssueUrl(game.name)}" target="_blank" rel="noopener noreferrer">Report broken game</a>
      </div>
    `;

    const favBtn = document.getElementById('game-favorite-btn');
    if (favBtn) {
      favBtn.onclick = () => {
        toggleFavorite(game.name);
        renderFavoriteButton(favBtn, isFavorite(game.name), true);
        favBtn.className = `favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}`;
        favBtn.setAttribute('aria-label', `${isFavorite(game.name) ? 'Remove' : 'Add'} ${game.name} ${isFavorite(game.name) ? 'from' : 'to'} favorites`);
        favBtn.setAttribute('aria-pressed', String(isFavorite(game.name)));
      };
    }
  }
}

function updateGameFavoriteButton() {
  const gameBtn = document.getElementById('game-favorite-btn');
  if (!gameBtn) return;

  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('id');
  if (!gameName) return;

  const decodedName = gameName;
  renderFavoriteButton(gameBtn, isFavorite(decodedName), true);
  gameBtn.className = `favorite-btn favorite-btn-large ${isFavorite(decodedName) ? 'active' : ''}`;
  gameBtn.setAttribute('aria-label', `${isFavorite(decodedName) ? 'Remove' : 'Add'} ${decodedName} ${isFavorite(decodedName) ? 'from' : 'to'} favorites`);
  gameBtn.setAttribute('aria-pressed', String(isFavorite(decodedName)));
}

function getEligibleGames() {
  const query = searchQuery.trim().toLowerCase();
  return allGames.filter(game => game && game.name)
    .filter(game => !query || game.name.toLowerCase().includes(query))
    .filter(game => selectedCategory === 'all' || getGameCategory(game) === selectedCategory);
}

function openGameWheel() {
  const dialog = document.getElementById('wheel-dialog');
  const wheel = document.getElementById('game-wheel');
  const track = document.getElementById('game-wheel-track');
  const result = document.getElementById('wheel-result');
  const playLink = document.getElementById('wheel-play');
  const spinButton = document.getElementById('wheel-spin');
  if (!dialog || !wheel || !track || !result || !playLink || !spinButton) return;

  if (wheelSpinTimer !== null) clearTimeout(wheelSpinTimer);
  if (wheelSpinAnimation) wheelSpinAnimation.cancel();
  wheelSpinTimer = null;
  wheelSpinAnimation = null;

  const eligibleGames = getEligibleGames();
  track.classList.remove('is-spinning');
  track.replaceChildren();
  track.style.removeProperty('--wheel-spin-offset');
  result.textContent = eligibleGames.length
    ? `${eligibleGames.length} game${eligibleGames.length === 1 ? '' : 's'} in your current browse results.`
    : 'No games match your current filters.';
  playLink.hidden = true;
  spinButton.disabled = eligibleGames.length === 0;
  dialog.showModal();
}

function spinGameWheel() {
  const wheel = document.getElementById('game-wheel');
  const track = document.getElementById('game-wheel-track');
  const result = document.getElementById('wheel-result');
  const playLink = document.getElementById('wheel-play');
  const spinButton = document.getElementById('wheel-spin');
  if (!wheel || !track || !result || !playLink || !spinButton || spinButton.disabled) return;

  const eligibleGames = getEligibleGames();
  if (!eligibleGames.length) {
    result.textContent = 'No games match your current filters.';
    spinButton.disabled = true;
    return;
  }

  const selectedGame = eligibleGames[Math.floor(Math.random() * eligibleGames.length)];
  const selectedIndex = 29;
  const wheelGames = Array.from({ length: 32 }, (_, index) => (
    index === selectedIndex
      ? selectedGame
      : eligibleGames[Math.floor(Math.random() * eligibleGames.length)]
  ));

  track.replaceChildren();
  wheelGames.forEach(game => {
    const label = document.createElement('span');
    label.className = 'wheel-segment';
    label.textContent = game.name;
    track.appendChild(label);
  });

  spinButton.disabled = true;
  playLink.hidden = true;
  result.textContent = 'Spinning...';
  const rowHeight = track.firstElementChild.getBoundingClientRect().height;
  const finalOffset = wheel.clientHeight / 2 - (selectedIndex + 0.5) * rowHeight;

  let spinFinished = false;
  const finishSpin = () => {
    if (spinFinished) return;
    spinFinished = true;
    if (wheelSpinTimer !== null) clearTimeout(wheelSpinTimer);
    wheelSpinTimer = null;
    wheelSpinAnimation = null;
    result.textContent = `Your pick: ${selectedGame.name}`;
    playLink.href = getGameUrl(selectedGame);
    playLink.hidden = false;
    spinButton.disabled = false;
  };
  wheelSpinTimer = setTimeout(finishSpin, 3750);
  wheelSpinAnimation = track.animate(
    [
      { transform: 'translateY(0)' },
      { transform: `translateY(${finalOffset}px)` },
    ],
    {
      duration: 3500,
      easing: 'cubic-bezier(0.12, 0.78, 0.15, 1)',
      fill: 'forwards',
    }
  );
  wheelSpinAnimation.onfinish = finishSpin;
}

function updateOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) indicator.hidden = navigator.onLine;
}

// =======================
// COOKIES (voor intro)
// =======================
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
}

function getCookie(name) {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function finishIntro() {
  const intro = document.getElementById('intro');
  if (intro) {
    intro.classList.add('fadeout');
    setTimeout(() => {
      intro.style.display = 'none';
      setCookie('playyyy_intro', '1', 30);
    }, 800);
  }
}

// =======================
// INIT
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(error => console.error('Could not register the offline app shell:', error));
  }

  const isHomePage = Boolean(document.getElementById('grid'));
  if (isHomePage) readBrowseUrl();

  updateOfflineIndicator();
  window.addEventListener('online', updateOfflineIndicator);
  window.addEventListener('offline', updateOfflineIndicator);

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    let hideBackToTopTimer = null;
    let scrollToTopFrame = null;
    const syncBackToTop = () => {
      if (window.scrollY >= 500) {
        if (hideBackToTopTimer !== null) clearTimeout(hideBackToTopTimer);
        hideBackToTopTimer = null;
        backToTop.hidden = false;
        backToTop.disabled = false;
        backToTop.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
          if (window.scrollY >= 500) backToTop.classList.add('is-visible');
        });
        return;
      }

      backToTop.classList.remove('is-visible');
      backToTop.disabled = true;
      backToTop.setAttribute('aria-hidden', 'true');
      if (hideBackToTopTimer !== null) clearTimeout(hideBackToTopTimer);
      hideBackToTopTimer = setTimeout(() => {
        if (window.scrollY < 500) backToTop.hidden = true;
        hideBackToTopTimer = null;
      }, 200);
    };
    syncBackToTop();
    window.addEventListener('scroll', syncBackToTop, { passive: true });
    backToTop.addEventListener('click', () => {
      if (scrollToTopFrame !== null) cancelAnimationFrame(scrollToTopFrame);
      const startPosition = window.scrollY;
      const startTime = performance.now();
      const duration = 800;
      const animateToTop = currentTime => {
        const progress = duration ? Math.min((currentTime - startTime) / duration, 1) : 1;
        const easedProgress = 1 - ((1 - progress) ** 3);
        window.scrollTo(0, Math.round(startPosition * (1 - easedProgress)));
        if (progress < 1) {
          scrollToTopFrame = requestAnimationFrame(animateToTop);
        } else {
          scrollToTopFrame = null;
        }
      };
      scrollToTopFrame = requestAnimationFrame(animateToTop);
    });
  }

  const hasSeenIntro = getCookie('playyyy_intro') === '1';

  // Intro animatie
  if (!hasSeenIntro) {
    let progress = 0;
    const duration = 1500;
    const start = performance.now();

    function animate() {
      const t = Math.min(1, (performance.now() - start) / duration);
      progress = Math.floor(t * 100);

      const fill = document.getElementById('fill');
      const status = document.getElementById('status');

      if (fill) fill.style.width = progress + '%';
      if (status) {
        if (progress < 30) status.textContent = 'Loading games...';
        else if (progress < 90) status.textContent = 'Almost ready...';
        else status.textContent = 'Ready!';
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        finishIntro();
      }
    }
    requestAnimationFrame(animate);
  } else {
    const loader = document.getElementById('loader');
    const status = document.getElementById('status');
    if (loader) loader.style.display = 'none';
    if (status) status.style.display = 'none';
    setTimeout(finishIntro, 500);
  }

  const menuToggle = document.getElementById('menu-toggle');
  const homeNavigation = document.getElementById('home-navigation');
  if (menuToggle && homeNavigation) {
    const setMenuOpen = isOpen => {
      homeNavigation.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    };

    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    homeNavigation.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('a, button')) setMenuOpen(false);
    });
    document.addEventListener('click', event => {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
      if (event.target instanceof Node && !homeNavigation.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  // ✅ LAAD GAMES EN RENDER DIRECT
  await loadGames();
  
  if (document.getElementById('grid')) {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const randomButton = document.getElementById('random-game-btn');
    const wheelDialog = document.getElementById('wheel-dialog');
    if (searchInput) searchInput.placeholder = `Search ${allGames.length} games...`;
    renderFeaturedGame();

    if (categoryFilter) {
      [...new Set(allGames.map(getGameCategory))].sort((a, b) => a.localeCompare(b)).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
      if (![...categoryFilter.options].some(option => option.value === selectedCategory)) {
        selectedCategory = 'all';
      }
      categoryFilter.addEventListener('change', event => {
        selectedCategory = event.target.value;
        updateBrowseUrl();
        renderHome();
      });
    }

    if (sortFilter) {
      sortFilter.value = selectedSort;
      sortFilter.addEventListener('change', event => {
        selectedSort = event.target.value;
        updateBrowseUrl();
        renderHome();
      });
    }

    if (searchInput) {
      searchInput.value = searchQuery;
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        updateBrowseUrl();
        renderHome();
      });
    }
    if (randomButton) {
      randomButton.addEventListener('click', openGameWheel);
    }

    document.getElementById('wheel-spin')?.addEventListener('click', spinGameWheel);
    document.getElementById('wheel-close')?.addEventListener('click', () => wheelDialog?.close());
    wheelDialog?.addEventListener('click', event => {
      if (event.target === wheelDialog) wheelDialog.close();
    });
    wheelDialog?.addEventListener('close', () => {
      if (wheelSpinTimer !== null) clearTimeout(wheelSpinTimer);
      if (wheelSpinAnimation) wheelSpinAnimation.cancel();
      wheelSpinTimer = null;
      wheelSpinAnimation = null;
    });

    window.addEventListener('popstate', () => {
      readBrowseUrl();
      if (![...categoryFilter.options].some(option => option.value === selectedCategory)) {
        selectedCategory = 'all';
      }
      syncBrowseControls();
      renderHome();
      window.addEventListener('pageshow', event => {
        if (event.persisted) renderHome();
      });
    });

    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[href*="/game/?"]') : null;
      if (!link) return;
      try {
        sessionStorage.setItem('playyyy-return-position', JSON.stringify({
          location: `${window.location.pathname}${window.location.search}`,
          scrollY: window.scrollY,
        }));
      } catch (error) {
        console.warn('Could not save the browse position:', error);
      }
    });

    document.addEventListener('keydown', event => {
      const target = event.target;
      const isEditable = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (event.key === '/' && !isEditable && !event.ctrlKey && !event.metaKey && searchInput) {
        event.preventDefault();
        searchInput.focus();
        return;
      }

      if (event.key === 'Escape' && searchInput && searchInput.value) {
        searchInput.value = '';
        searchQuery = '';
        updateBrowseUrl();
        renderHome();
        return;
      }

      if (event.key === 'Enter' && target instanceof HTMLElement && target.classList.contains('card')) {
        event.preventDefault();
        target.querySelector('a:not(.report-link)')?.click();
        return;
      }

      if (isEditable || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
      const cards = [...document.querySelectorAll('#recent-grid .card, #favorites-grid .card, #grid .card')]
        .filter(card => card.getClientRects().length > 0);
      if (!cards.length) return;

      const focusedCard = document.activeElement.closest?.('.card');
      const currentIndex = cards.indexOf(focusedCard);
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
      event.preventDefault();
      cards[nextIndex].focus();
    });

    renderHome();
    try {
      const savedPosition = JSON.parse(sessionStorage.getItem('playyyy-return-position') || 'null');
      if (savedPosition && savedPosition.location === `${window.location.pathname}${window.location.search}`) {
        sessionStorage.removeItem('playyyy-return-position');
        requestAnimationFrame(() => window.scrollTo(0, savedPosition.scrollY));
      }
    } catch (error) {
      console.warn('Could not restore the browse position:', error);
    }
  } else if (document.getElementById('game-iframe')) {
    renderGame();
    const iframe = document.getElementById('game-iframe');
    const fullscreenButton = document.getElementById('fullscreen-btn');
    if (iframe && fullscreenButton) {
      fullscreenButton.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await iframe.requestFullscreen();
          }
        } catch (error) {
          console.error('Could not change fullscreen mode:', error);
        }
      });
      document.addEventListener('fullscreenchange', () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        fullscreenButton.title = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
        fullscreenButton.dataset.fullscreen = String(isFullscreen);
      });
    }
  }
});
