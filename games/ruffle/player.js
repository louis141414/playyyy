const loader = document.currentScript;
const params = new URLSearchParams(window.location.search);
const file = loader.dataset.file || params.get('file');
const title = loader.dataset.title || params.get('title') || 'Flash Game';
const container = document.getElementById('ruffle-container');
let status = document.getElementById('status');
let loadingScreen = document.getElementById('loading-screen');

document.title = `${title} | Playyyy`;
window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
  autoplay: 'on',
  backgroundColor: '#000000',
  letterbox: 'on',
  splashScreen: false
};

const createLoadingScreen = () => {
  loadingScreen = document.createElement('section');
  loadingScreen.id = 'loading-screen';
  loadingScreen.className = 'loading-screen';
  loadingScreen.setAttribute('aria-live', 'polite');

  const logo = document.createElement('img');
  logo.className = 'loading-logo';
  logo.src = new URL('../../new-logo.svg', loader.src).href;
  logo.alt = 'Playyyy logo';

  const brand = document.createElement('p');
  brand.className = 'loading-brand';
  brand.textContent = 'PLAYYYY';

  const spinner = document.createElement('span');
  spinner.className = 'loading-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  status ||= document.createElement('p');
  status.id = 'status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading game...';

  loadingScreen.append(logo, brand, spinner, status);
  container.replaceChildren(loadingScreen);
};

if (container && !loadingScreen) createLoadingScreen();

const showError = (message, error) => {
  if (status) {
    status.hidden = false;
    status.textContent = message;
    status.setAttribute('role', 'alert');
  }
  if (error) console.error(message, error);
};

const loadGame = async () => {
  try {
    if (!file || !container || !status || !loadingScreen) {
      throw new Error('The player page is missing its game file or container.');
    }

    const gameUrl = new URL(file, window.location.href);
    if (gameUrl.origin !== window.location.origin) {
      throw new Error('The game must be loaded from this site.');
    }

    const runtime = document.createElement('script');
    runtime.src = new URL('./ruffle.js', loader.src).href;
    const runtimeLoaded = new Promise((resolve, reject) => {
      runtime.addEventListener('load', resolve, { once: true });
      runtime.addEventListener('error', () => reject(new Error(`Could not load ${runtime.src}`)), { once: true });
    });
    document.head.appendChild(runtime);
    await runtimeLoaded;

    const player = window.RufflePlayer.newest().createPlayer();
    player.setAttribute('aria-label', title);
    container.appendChild(player);
    await player.ruffle().load(gameUrl.href);
    loadingScreen.hidden = true;
  } catch (error) {
    showError('The game could not be loaded. Make sure its files are available offline and try again.', error);
  }
};

loadGame();