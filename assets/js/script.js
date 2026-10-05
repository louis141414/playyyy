function loadStatcounter() {
  if (window.sc_project) return;

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
  const params = new URLSearchParams({ game: game.name });
  const browseQuery = getBrowseParams().toString();
  if (browseQuery) params.set('from', `?${browseQuery}`);
  return `play.html?${params}`;
}

function getGamesHomeUrl(from) {
  const requestedReturn = new URLSearchParams(String(from || '').replace(/^\?/, ''));
  const returnParams = new URLSearchParams();
  for (const key of ['q', 'category', 'sort']) {
    const value = requestedReturn.get(key);
    if (value) returnParams.set(key, value);
  }
  return `index.html${returnParams.size ? `?${returnParams}` : ''}#all-games`;
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
  return Object.entries(CATEGORY_GAME_NAMES).find(([, names]) => names.includes(game.name))?.[0] || 'Other';
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
    chip.textContent = `${filter.label} ×`;
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
  const cardTag = titleContainer.querySelector('.card-tag');
  if (cardTag) cardTag.remove();
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
  if (name === 'Appel') {
    return [
      'games/appel/assets/5ca72b0c06b2764b850d4a40848e9fb1.png',
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
function createGameCard(game) {
  if (!game || !game.name) {
    return document.createElement('div');
  }

  const card = document.createElement('div');
  card.className = 'card glass';
  card.tabIndex = 0;
  card.setAttribute('aria-label', game.name);

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

  if (game.tag) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = game.tag;
    titleContainer.appendChild(tag);
  }

  const favoriteBtn = document.createElement('button');
  favoriteBtn.type = 'button';
  favoriteBtn.className = `favorite-btn ${isFavorite(game.name) ? 'active' : ''}`;
  favoriteBtn.textContent = isFavorite(game.name) ? '★' : '☆';
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
function renderGameGrid(container, games, emptyMessage, emptySuggestion) {
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

  games.forEach(game => {
    if (game) {
      container.appendChild(createGameCard(game));
    }
  });
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
    filteredGames.length === 0 ? 'Try another search or choose a different category.' : ''
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
    return Array.isArray(recent) ? recent.filter(name => typeof name === 'string').slice(0, 8) : [];
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
    body: `The game "${gameName}" appears to be broken.\n\nPage: ${window.location.origin}/play.html?game=${encodeURIComponent(gameName)}\n\nWhat happened?`,
  });
  return `https://github.com/louis141414/playyyy/issues/new?${params}`;
}

function applyTheme(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = selectedTheme;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = selectedTheme === 'light' ? '#edf3ef' : '#070707';
  try {
    localStorage.setItem('playyyy-theme', selectedTheme);
  } catch (error) {
    console.warn('Could not save theme preference:', error);
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = selectedTheme === 'dark' ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-label', `Switch to ${selectedTheme === 'dark' ? 'light' : 'dark'} mode`);
  }
}

// =======================
// RENDER GAME PAGE
// =======================
async function renderGame() {
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  const decodedName = gameName ? decodeURIComponent(gameName) : null;
  const homeLink = document.getElementById('game-home-link');
  if (homeLink) homeLink.href = getGamesHomeUrl(params.get('from'));

  const titleEl = document.getElementById('game-title');
  if (titleEl) {
    titleEl.textContent = decodedName || 'No game selected';
  }

  if (!decodedName) return;

  // Set favicon
  const safeName = normalizeName(decodedName);
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `./games/${safeName}/favicon.png`;

  // ✅ ZORG DAT GAMES GELADEN ZIJN
  if (allGames.length === 0) {
    await loadGames();
  }

  const game = allGames.find(g => g && g.name === decodedName);
  if (!game) {
    if (titleEl) titleEl.textContent = 'Game not found';
    return;
  }

  if (titleEl) titleEl.textContent = game.name;
  document.title = `${game.name} | Playyyy`;
  addRecentlyPlayed(game.name);
  loadStatcounter();

  const iframe = document.getElementById('game-iframe');
  if (iframe) {
    iframe.src = game.url;
  }

  const description = document.getElementById('description');
  if (description) {
    description.innerHTML = `
      <div class="game-meta">
        <div>
          Enjoy playing <strong>${game.name}</strong>!<br>
          <small>Full screen recommended (F11)</small>
        </div>
        <button id="game-favorite-btn" class="favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}" type="button">
          ${isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites'}
        </button>
        <a class="report-link report-link-large" href="${reportIssueUrl(game.name)}" target="_blank" rel="noopener noreferrer">Report broken game</a>
      </div>
    `;

    const favBtn = document.getElementById('game-favorite-btn');
    if (favBtn) {
      favBtn.onclick = () => {
        toggleFavorite(game.name);
        favBtn.textContent = isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites';
        favBtn.className = `favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}`;
      };
    }
  }
}

function updateGameFavoriteButton() {
  const gameBtn = document.getElementById('game-favorite-btn');
  if (!gameBtn) return;

  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  if (!gameName) return;

  const decodedName = decodeURIComponent(gameName);
  gameBtn.textContent = isFavorite(decodedName) ? '★ Favorite' : '☆ Add to favorites';
  gameBtn.className = `favorite-btn favorite-btn-large ${isFavorite(decodedName) ? 'active' : ''}`;
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

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('playyyy-theme') === 'light' ? 'light' : 'dark';
  } catch {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
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
      const link = event.target instanceof Element ? event.target.closest('a[href*="play.html?game="]') : null;
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
  }
});
