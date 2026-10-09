
let searchQuery = '';
let selectedCategory = 'all';
let selectedSort = 'recent';
let wheelSpinTimer = null;
let wheelSpinAnimation = null;
const GAME_CARD_BATCH_SIZE = 24;
let loadMoreCatalogGames = null;

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
  if (container.id === 'grid') loadMoreCatalogGames = null;

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
  const loadMoreStatus = document.createElement('p');
  loadMoreStatus.className = 'load-more-games';
  loadMoreStatus.setAttribute('role', 'status');
  const loadNextBatch = () => {
    if (renderedCount >= games.length) return;
    const nextCount = Math.min(renderedCount + batchSize, games.length);
    appendGames(renderedCount, nextCount, loadMoreStatus);
    renderedCount = nextCount;
    if (renderedCount < games.length) {
      loadMoreStatus.textContent = 'Scroll to the bottom to load more games';
    } else {
      loadMoreStatus.textContent = 'All games loaded';
      loadMoreCatalogGames = null;
    }
  };
  const firstCount = Math.min(batchSize, games.length);
  appendGames(0, firstCount);
  renderedCount = firstCount;
  loadMoreStatus.textContent = 'Scroll to the bottom to load more games';
  if (container.id === 'grid') loadMoreCatalogGames = loadNextBatch;
  container.appendChild(loadMoreStatus);
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


document.addEventListener('DOMContentLoaded', async () => {
  await loadGames();
  readBrowseUrl();
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
    window.addEventListener('scroll', () => {
      if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 1) return;
      loadMoreCatalogGames?.();
    }, { passive: true });
    try {
      const savedPosition = JSON.parse(sessionStorage.getItem('playyyy-return-position') || 'null');
      if (savedPosition && savedPosition.location === `${window.location.pathname}${window.location.search}`) {
        sessionStorage.removeItem('playyyy-return-position');
        requestAnimationFrame(() => window.scrollTo(0, savedPosition.scrollY));
      }
    } catch (error) {
      console.warn('Could not restore the browse position:', error);
    }
});
