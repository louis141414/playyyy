(() => {
    "use strict";

    const parameterNames = [
        "utm_source",
        "utm_medium",
        "utm_campaign"
    ];
    const storageKey = "playyyy.utm";
    const scriptUrl = new URL(document.currentScript.src, window.location.href);
    const basePath = scriptUrl.pathname.slice(0, scriptUrl.pathname.lastIndexOf("/") + 1);
    const query = new URLSearchParams(window.location.search);
    const hasIncomingCampaign = parameterNames.some(name => query.has(name));
    let campaign = {};

    if (hasIncomingCampaign) {
        for (const name of parameterNames) {
            const value = query.get(name);
            if (value) campaign[name] = value;
        }

        try {
            window.sessionStorage.setItem(storageKey, JSON.stringify(campaign));
        } catch {
            // Tracking still works for the current page when storage is unavailable.
        }
    } else {
        try {
            campaign = JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
        } catch {
            campaign = {};
        }
    }

    if (!parameterNames.some(name => campaign[name])) return;

    function addCampaignParams(anchor) {
        if (!anchor.hasAttribute("href")) return;

        const destination = new URL(anchor.href, window.location.href);
        const isInternalPage =
            destination.origin === window.location.origin &&
            destination.pathname.startsWith(basePath) &&
            !destination.pathname.startsWith(`${basePath}games/`) &&
            (/\/$/.test(destination.pathname) || /\.html?$/i.test(destination.pathname));

        if (!isInternalPage) return;

        for (const name of parameterNames) {
            if (campaign[name]) destination.searchParams.set(name, campaign[name]);
        }

        anchor.href = destination.href;
    }

    function updateLinks(root) {
        if (root instanceof HTMLAnchorElement) addCampaignParams(root);
        root.querySelectorAll?.("a[href]").forEach(addCampaignParams);
    }

    updateLinks(document);

    new MutationObserver(records => {
        for (const record of records) {
            if (record.type === "attributes") {
                addCampaignParams(record.target);
            } else {
                record.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) updateLinks(node);
                });
            }
        }
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["href"],
        childList: true,
        subtree: true
    });
})();