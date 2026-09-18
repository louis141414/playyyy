(() => {
  const COOKIE = "captchaVerified";
  const MAX_AGE = 30 * 60; // 30 minutes
  const scriptUrl = document.currentScript
    ? new URL(document.currentScript.src, location.href)
    : new URL("/playyyy/verify/verify.js", location.origin);
  const verifyUrl = new URL("./", scriptUrl);
  const basePath = new URL("../", verifyUrl).pathname;
  const verifyPath = verifyUrl.pathname;

  window.PLAYYYY_BASE_PATH = basePath;
  window.PLAYYYY_VERIFY_PATH = verifyPath;

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="))
      ?.split("=")[1];
  }

  const verifiedAt = Number(getCookie(COOKIE)) || 0;
  const valid = verifiedAt && Date.now() - verifiedAt < MAX_AGE * 1000;

  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const currentVerifyPath = verifyPath.replace(/\/+$/, "") || "/";

  if (!valid && currentPath !== currentVerifyPath) {
    const returnTo =
      location.pathname + location.search + location.hash;

    location.replace(
      verifyPath + "?return=" + encodeURIComponent(returnTo)
    );

    return;
  }

  // Returning before 30 minutes resets the timer.
  if (valid) {
    document.cookie =
      `${COOKIE}=${Date.now()}; Max-Age=${MAX_AGE}; Path=${basePath}; SameSite=Lax`;
  }
})();
