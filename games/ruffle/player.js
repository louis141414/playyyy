const loader = document.currentScript;
const { file, title } = loader.dataset;
const container = document.getElementById('ruffle-container');
const status = document.getElementById('status');

document.title = `${title} | Playyyy`;
window.RufflePlayer = window.RufflePlayer || {};

const script = document.createElement('script');
script.src = 'https://unpkg.com/@ruffle-rs/ruffle';
script.onload = () => {
  const player = window.RufflePlayer.newest().createPlayer();
  player.style.width = '100%';
  player.style.height = '100%';
  container.replaceChildren(player);
  player.load(new URL(file, window.location.href).href).catch(() => {
    status.textContent = 'The game could not be loaded.';
    container.replaceChildren(status);
  });
};
script.onerror = () => {
  status.textContent = 'Ruffle could not be loaded. Check your internet connection and try again.';
};
document.head.appendChild(script);