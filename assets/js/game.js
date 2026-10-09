// =======================
function getGamesHomeUrl(from) {
  const requestedReturn = new URLSearchParams(String(from || '').replace(/^\?/, ''));
  const returnParams = new URLSearchParams();
  for (const key of ['q', 'category', 'sort']) {
    const value = requestedReturn.get(key);
    if (value) returnParams.set(key, value);
  }
  return `${getAppBasePath()}${returnParams.size ? `?${returnParams}` : ''}#all-games`;
}

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


document.addEventListener('DOMContentLoaded', () => {
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
});
