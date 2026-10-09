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
const GAME_CACHE_NAME = 'playyyy-games-v1';

function getAppBasePath() {
  return new URL('.', document.baseURI).pathname;
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
  if (document.getElementById('game-favorite-btn')) updateGameFavoriteButton();
}


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

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(error => console.error('Could not register the offline app shell:', error));
  }

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

});
