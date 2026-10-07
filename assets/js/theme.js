(() => {
  const storageKey = 'playyyy-theme';

  const getSavedTheme = () => {
    try {
      return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark';
    } catch (error) {
      console.warn('Could not read theme preference:', error);
      return 'dark';
    }
  };

  const applyTheme = (theme, persist = true) => {
    const selectedTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = selectedTheme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = selectedTheme === 'light' ? '#edf3ef' : '#070707';

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.textContent = selectedTheme === 'dark' ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', `Switch to ${selectedTheme === 'dark' ? 'light' : 'dark'} mode`);
    });

    if (persist) {
      try {
        localStorage.setItem(storageKey, selectedTheme);
      } catch (error) {
        console.warn('Could not save theme preference:', error);
      }
    }
  };

  applyTheme(getSavedTheme());
  document.addEventListener('DOMContentLoaded', () => applyTheme(document.documentElement.dataset.theme));

  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('[data-theme-toggle]') : null;
    if (!button) return;
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  window.addEventListener('storage', event => {
    if (event.key === storageKey) applyTheme(event.newValue, false);
  });
})();
