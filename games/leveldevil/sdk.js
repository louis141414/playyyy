// POKI sdk.js (V6.2.1)
(() => {
    "use strict";

    const CONFIG = {
        adUnits: {
            rewarded: '/21849154601,22866254644/Ad.Plus-Rewarded'
        },
        fallbackVideosUrl: [],
        loadingGifUrl: '../../scripts/ads/thumb_anim.gif',
        adTimeout: 8000,
        minLoadingTime: 800
    };

    let isAdActive = false;
    let fallbackVideos = [];
    let lastIndex = -1;
    let freezeTimer = null;
    let currentVideoElement = null;
    let gptSlot = null;
    let loadingOverlay = null;
    let loadingStartTime = 0;

    function injectStyles() {
        if (document.getElementById('sdk-v6-styles')) return;
        const css = `
            #poki-gameplay-freeze { position: fixed; inset: 0; z-index: 999999998; pointer-events: all; background: rgba(0,0,0,0.01); }
            .sdk-video-overlay { position: fixed; inset: 0; background: #000; z-index: 999999999; display: flex; align-items: center; justify-content: center; }
            .sdk-loading-overlay {
                position: fixed; inset: 0; background: #000; z-index: 999999999;
                display: flex; align-items: center; justify-content: center;
            }
            .sdk-loading-spinner { width: 120px; height: 120px; }
            .sdk-cta-button {
                position: absolute; top: 36px; right: 16px;
                padding: 16px; background: #FFFFFF; color: #597ed5;
                font-family: sans-serif; font-size: 18px; font-weight: bold;
                border: 1px solid #b2b2b2; border-radius: 6px;
                text-decoration: none; z-index: 1000000002;
                transition: transform 0.2s;
                cursor: pointer;
            }
            .sdk-cta-button:hover { transform: scale(1.04); }
            .sdk-pause-container {
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.3);
                z-index: 1000000001;
                cursor: pointer;
            }
            .sdk-play-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90px;
                height: 90px;
                background: rgba(0,0,0,0.3);
                border: 2px solid #fff;
                border-radius: 50px;
            }
            .sdk-play-icon::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 55%;
                transform: translate(-50%, -50%);
                border-style: solid;
                border-width: 15px 0 15px 25px;
                border-color: transparent transparent transparent #fff;
            }
            .sdk-pulse { animation: sdk-pulse-anim 1.5s infinite; }
            @keyframes sdk-pulse-anim {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
            }
            .sdk-progress-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 6px;
                background: rgba(255,255,255,0.3);
                z-index: 1000000003;
            }
            .sdk-progress-inner {
                width: 0%;
                height: 100%;
                background: #FFDC00;
            }
        `;
        const style = document.createElement('style');
        style.id = 'sdk-v6-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function initGPT() {
        window.googletag = window.googletag || { cmd: [] };

        if (!document.querySelector('script[src*="gpt.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        window.googletag.cmd.push(() => {
            window.googletag.pubads().enableSingleRequest();
            window.googletag.enableServices();
            console.log('[PokiSDK] GPT Core Initialized');
        });
    }

    function showLoadingIndicator() {
        if (loadingOverlay) return;
        loadingStartTime = Date.now();
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'sdk-loading-overlay';
        const spinner = document.createElement('img');
        spinner.src = CONFIG.loadingGifUrl;
        spinner.className = 'sdk-loading-spinner';
        loadingOverlay.appendChild(spinner);
        document.body.appendChild(loadingOverlay);
    }

    async function hideLoadingIndicator() {
        if (!loadingOverlay) return;
        const elapsed = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, CONFIG.minLoadingTime - elapsed);
        if (remainingTime > 0) await new Promise(r => setTimeout(r, remainingTime));
        if (loadingOverlay && loadingOverlay.parentNode) loadingOverlay.remove();
        loadingOverlay = null;
    }

    async function loadFallbackList() {
        try {
            const res = await fetch(CONFIG.fallbackVideosUrl, { cache: "no-store" });
            fallbackVideos = await res.json();
            console.log("[PokiSDK] Fallback list loaded");
        } catch (e) {
            console.warn("[PokiSDK] Fallback load failed");
        }
    }

    function playFallbackVideo() {
        return new Promise((resolve) => {
            if (!fallbackVideos || !fallbackVideos.length) {
                unfreezeGame();
                return resolve();
            }

            if (freezeTimer) {
                clearTimeout(freezeTimer);
                freezeTimer = null;
            }

            let index;
            do {
                index = Math.floor(Math.random() * fallbackVideos.length);
            } while (index === lastIndex && fallbackVideos.length > 1);
            lastIndex = index;
            const videoData = fallbackVideos[index];

            const overlay = document.createElement("div");
            overlay.className = "sdk-video-overlay";

            const video = document.createElement("video");
            video.src = videoData.src;
            video.autoplay = true;
            video.playsInline = true;
            video.style.cssText = "width:100%; height:100%; object-fit:contain; cursor:pointer;";
            currentVideoElement = video;

            const pauseLayer = document.createElement("div");
            pauseLayer.className = "sdk-pause-container";
            pauseLayer.innerHTML = `
                <div class="sdk-play-icon"></div>
                <div class="sdk-play-icon sdk-pulse"></div>
            `;

            const cta = document.createElement("a");
            cta.className = "sdk-cta-button";
            cta.innerText = "Play Now!";
            cta.href = videoData.link;
            cta.target = "_blank";
            cta.onclick = (e) => {
                e.stopPropagation();
                if (!video.paused) {
                    video.pause();
                    pauseLayer.style.display = "block";
                }
            };

            const pb = document.createElement("div");
            pb.className = "sdk-progress-bar";
            const pbi = document.createElement("div");
            pbi.className = "sdk-progress-inner";
            pb.appendChild(pbi);

            overlay.appendChild(video);
            overlay.appendChild(pauseLayer);
            overlay.appendChild(cta);
            document.body.appendChild(overlay);
            document.body.appendChild(pb);

            video.onclick = (e) => {
                e.stopPropagation();
                video.pause();
                pauseLayer.style.display = "block";
            };

            pauseLayer.onclick = (e) => {
                e.stopPropagation();
                video.play();
                pauseLayer.style.display = "none";
            };

            const updateProgressBar = () => {
                if (video.duration) {
                    pbi.style.width = (video.currentTime / video.duration) * 100 + "%";
                }
                if (!video.paused && !video.ended) {
                    requestAnimationFrame(updateProgressBar);
                }
            };

            video.addEventListener('play', () => {
                requestAnimationFrame(updateProgressBar);
            });

            requestAnimationFrame(updateProgressBar);

            const onVideoEnd = () => {
                unfreezeGame();
                resolve();
            };
            video.onended = onVideoEnd;
            video.onerror = onVideoEnd;
        });
    }

    function showGPTRewardedAd() {
        return new Promise((resolve, reject) => {
            window.googletag.cmd.push(() => {
                let adStarted = false;
                let timeoutId;
                let listeners = [];

                const cleanup = () => {
                    clearTimeout(timeoutId);
                    listeners.forEach(l => window.googletag.pubads().removeEventListener(l.name, l.fn));
                    if (gptSlot) {
                        window.googletag.destroySlots([gptSlot]);
                        gptSlot = null;
                    }
                };

                gptSlot = window.googletag.defineOutOfPageSlot(
                    CONFIG.adUnits.rewarded,
                    window.googletag.enums.OutOfPageFormat.REWARDED
                );

                if (!gptSlot) return reject(new Error('no_slot'));
                gptSlot.addService(window.googletag.pubads());

                const addL = (name, fn) => {
                    window.googletag.pubads().addEventListener(name, fn);
                    listeners.push({ name, fn });
                };

                addL('slotRenderEnded', (event) => {
                    if (event.slot === gptSlot && event.isEmpty) {
                        console.log('[PokiSDK] GPT: No fill');
                        cleanup();
                        reject(new Error('no_fill'));
                    }
                });

                addL('rewardedSlotReady', (event) => {
                    if (event.slot === gptSlot) {
                        console.log('[PokiSDK] GPT: Ad ready');
                        adStarted = true;
                        clearTimeout(timeoutId);
                        hideLoadingIndicator().then(() => event.makeRewardedVisible());
                    }
                });

                addL('rewardedSlotClosed', (event) => {
                    if (event.slot === gptSlot) {
                        console.log('[PokiSDK] GPT: Ad closed');
                        cleanup();
                        resolve();
                    }
                });

                addL('rewardedSlotGranted', (event) => {
                    if (event.slot === gptSlot) {
                        console.log('[PokiSDK] GPT: Reward granted 🎁');
                    }
                });

                timeoutId = setTimeout(() => {
                    if (!adStarted) {
                        console.warn('[PokiSDK] GPT: Timeout');
                        cleanup();
                        reject(new Error('timeout'));
                    }
                }, CONFIG.adTimeout);

                window.googletag.display(gptSlot);
            });
        });
    }

    function freezeGame() {
        if (document.getElementById('poki-gameplay-freeze')) return;
        const overlay = document.createElement('div');
        overlay.id = 'poki-gameplay-freeze';
        document.body.appendChild(overlay);

        if (freezeTimer) clearTimeout(freezeTimer);
        freezeTimer = setTimeout(() => unfreezeGame(), 180000);

        document.querySelectorAll('audio, video').forEach(el => {
            try { el.muted = true; } catch(e){}
        });
        try {
            if (window.audioContext) window.audioContext.suspend();
        } catch (e) {}
    }

    function unfreezeGame() {
        if (freezeTimer) clearTimeout(freezeTimer);
        freezeTimer = null;

        ['#poki-gameplay-freeze', '.sdk-video-overlay', '.sdk-progress-bar', '.sdk-loading-overlay'].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.remove());
        });

        document.querySelectorAll('audio, video').forEach(el => {
            try { el.muted = false; } catch(e){}
        });
        try {
            if (window.audioContext) window.audioContext.resume();
        } catch (e) {}

        isAdActive = false;
        currentVideoElement = null;
    }

    async function showRewardedAd() {
        if (isAdActive) return true;

        isAdActive = true;
        console.log('[PokiSDK] Starting rewarded ad...');
        freezeGame();
        showLoadingIndicator();

        try {
            console.log('[PokiSDK] Strategy: Direct GPT');
            await showGPTRewardedAd();
            console.log('[PokiSDK] ✅ GPT ad completed');
            await hideLoadingIndicator();
            unfreezeGame();
        } catch (error) {
            console.warn('[PokiSDK] GPT failed, using fallback:', error.message);
            await hideLoadingIndicator();
            await playFallbackVideo();
        }

        isAdActive = false;
        console.log('[PokiSDK] Rewarding user');

        return true;
    }

    const noop = () => {};
    const promiseTrue = () => Promise.resolve(true);
    const promiseEmpty = () => Promise.resolve([]);
    const promiseEmptyObj = () => Promise.resolve({});

    window.PokiSDK = {
        init: promiseTrue,
        initWithVideoHB: promiseTrue,
        commercialBreak: promiseTrue,
        rewardedBreak: showRewardedAd,
        displayAd: noop,
        destroyAd: noop,
        movePill: noop,
        showPill: noop,
        isAdBlocked: () => false,
        muteAd: noop,
        setDebug: noop,
        setLogging: noop,
        setPlayerAge: noop,
        enableEventTracking: noop,
        playtestSetCanvas: noop,
        playtestCaptureHtmlOnce: noop,
        playtestCaptureHtmlOn: noop,
        playtestCaptureHtmlOff: noop,
        measure: noop,
        captureError: noop,
        logError: noop,
        customEvent: () => ({ doNothing: noop }),
        gameLoadingStart: noop,
        gameLoadingProgress: noop,
        gameLoadingFinished: noop,
        gameInteractive: () => unfreezeGame(),
        gameplayStart: () => unfreezeGame(),
        gameplayStop: noop,
        happyTime: noop,
        roundStart: noop,
        roundEnd: noop,
        sendHighscore: noop,
        setDebugTouchOverlayController: noop,
        setPlaytestCanvas: noop,

        getLeaderboard: promiseEmpty,
        showLeaderboard: (id) => {
            console.info('[PokiSDK] showLeaderboard:', id);
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'pokiMessageShowLeaderboard',
                    content: { data: { id: id || -1 } }
                }, '*');
            }
        },

        getLanguage: () => navigator.language.split('-')[0] || 'en',
        getIsoLanguage: () => new URLSearchParams(window.location.search).get('iso_lang') || undefined,
        getURLParam: (p) => {
            const params = new URLSearchParams(window.location.search);
            return params.get(`gd${p}`) || params.get(p) || "";
        },

        getUser: promiseEmptyObj,
        getToken: () => Promise.resolve(null),
        login: () => Promise.reject(new Error('Login not supported')),

        openExternalLink: (url) => {
            console.info('[PokiSDK] openExternalLink:', url);
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'pokiMessageOpenExternalLink',
                    content: { params: { url } }
                }, '*');
            } else {
                window.open(url, '_blank');
            }
        },

        shareableURL: () => Promise.resolve({ url: window.location.href }),
        generateScreenshot: () => Promise.resolve(null)
    };

    injectStyles();
    loadFallbackList();
    initGPT();

    console.log("%c PokiSDK V6.2.1 Ready ", "background: #222; color: #fbff00; padding: 5px; border-radius: 3px;");
})();

