window.CATALOG_ANALYTICS = (() => {
  const analyticsConfig = (window.CATALOG_DATA && window.CATALOG_DATA.analytics) || {};
  const measurementId = String(analyticsConfig.ga4MeasurementId || "").trim();
  const appName = "Thien Quang Catalog";
  let initialized = false;

  function cleanParams(params = {}) {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
  }

  function ensureInit() {
    if (initialized) return Boolean(measurementId);
    initialized = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    if (!measurementId) return false;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      debug_mode: Boolean(analyticsConfig.debugMode)
    });

    return true;
  }

  function track(eventName, params = {}) {
    if (!ensureInit()) return false;
    window.gtag("event", eventName, cleanParams(params));
    return true;
  }

  function trackScreen(screenName, params = {}) {
    return track("screen_view", {
      app_name: appName,
      screen_name: screenName,
      ...params
    });
  }

  return {
    ensureInit,
    isEnabled() {
      return Boolean(measurementId);
    },
    measurementId,
    track,
    trackScreen
  };
})();
