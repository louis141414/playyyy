(() => {
  const COOKIE = "captchaVerified";
  const MAX_AGE = 30 * 60; // 30 minutes

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="))
      ?.split("=")[1];
  }

  const verifiedAt = Number(getCookie(COOKIE)) || 0;
  const valid = verifiedAt && Date.now() - verifiedAt < MAX_AGE * 1000;

  if (!valid && location.pathname !== "/verify") {
    const returnTo =
      location.pathname + location.search + location.hash;

    location.replace(
      "/verify?return=" + encodeURIComponent(returnTo)
    );

    return;
  }

  // Returning before 30 minutes resets the timer.
  if (valid) {
    document.cookie =
      `${COOKIE}=${Date.now()}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  }
})();
