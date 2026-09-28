(() => {
  "use strict";

  const COOKIE_NAME = "captchaVerified";
  const MAX_AGE = 30 * 60; // 30 minutes

  /*
   * Find this script's URL.
   *
   * Expected location:
   * /playyyy/verify/verify.js
   */
  const scriptUrl = document.currentScript
      ? new URL(document.currentScript.src, window.location.href)
      : new URL("/playyyy/verify/verify.js", window.location.origin);

  /*
   * Expected verification page:
   * /playyyy/verify/
   */
  const verifyUrl = new URL("./", scriptUrl);

  /*
   * Expected protected area:
   * /playyyy/
   */
  const basePath = new URL("../", verifyUrl).pathname;

  const verifyPath = verifyUrl.pathname;

  window.PLAYYYY_BASE_PATH = basePath;
  window.PLAYYYY_VERIFY_PATH = verifyPath;

  function getCookie(name) {
      const row = document.cookie
          .split("; ")
          .find(cookie => cookie.startsWith(`${name}=`));

      if (!row) {
          return null;
      }

      return decodeURIComponent(
          row.split("=").slice(1).join("=")
      );
  }

  function setCookie(name, value, maxAge, path) {
      const secureFlag =
          window.location.protocol === "https:"
              ? "; Secure"
              : "";

      document.cookie =
          `${name}=${encodeURIComponent(value)}; ` +
          `Max-Age=${maxAge}; ` +
          `Path=${path}; ` +
          "SameSite=Lax" +
          secureFlag;
  }

  function normalizePath(path) {
      const normalized = path.replace(/\/+$/, "");
      return normalized || "/";
  }

  const verifiedAt = Number(getCookie(COOKIE_NAME)) || 0;

  const valid =
      verifiedAt > 0 &&
      Date.now() - verifiedAt < MAX_AGE * 1000;

  const currentPath = normalizePath(window.location.pathname);
  const currentVerifyPath = normalizePath(verifyPath);

  /*
   * If the cookie is invalid and the user is not already
   * on the verification page, redirect them to the gate.
   */
  if (!valid && currentPath !== currentVerifyPath) {
      const returnTo =
          window.location.pathname +
          window.location.search +
          window.location.hash;

      const redirectUrl = new URL(verifyPath, window.location.origin);

      redirectUrl.searchParams.set("return", returnTo);

      window.location.replace(redirectUrl.href);
      return;
  }

  /*
   * Refresh the timestamp whenever the user visits a protected page.
   * This keeps the verification active for another 30 minutes.
   */
  if (valid) {
      setCookie(
          COOKIE_NAME,
          Date.now(),
          MAX_AGE,
          basePath
      );
  }
})();
