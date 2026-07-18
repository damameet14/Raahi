const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navigationMenu = document.querySelector("[data-navigation-menu]");
const reducedMotionPreference = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const sitePreloader = document.querySelector("[data-site-preloader]");
const preloaderProgressElement = document.querySelector(
  "[data-preloader-progress]",
);
const preloaderMinimumDuration = 1600;
const preloaderFinishDuration = 260;
const preloaderProgressBeforePageReady = 0.92;
const preloaderExitFallbackDuration = 720;
let preloaderAnimationStartTime;
let preloaderFinishStartTime;
let lastRenderedLoadingPercentage = -1;
let isPageReady = document.readyState === "complete";

function removeSitePreloader() {
  document.body.classList.remove("is-preloading");
  sitePreloader?.remove();
}

function renderSitePreloaderProgress(loadingProgress) {
  const loadingPercentage = Math.round(loadingProgress * 100);
  const wavePosition = 220 - loadingProgress * 330;

  sitePreloader.style.setProperty(
    "--preloader-wave-position",
    `${wavePosition.toFixed(1)}px`,
  );

  if (loadingPercentage !== lastRenderedLoadingPercentage) {
    lastRenderedLoadingPercentage = loadingPercentage;
    sitePreloader.setAttribute("aria-valuenow", String(loadingPercentage));
    preloaderProgressElement.textContent = `${loadingPercentage}%`;
  }
}

function completeSitePreloader() {
  if (!sitePreloader) {
    document.body.classList.remove("is-preloading");
    return;
  }

  sitePreloader.style.setProperty("--preloader-wave-position", "-110px");
  sitePreloader.setAttribute("aria-valuenow", "100");
  preloaderProgressElement.textContent = "100%";
  sitePreloader.classList.add("is-complete");

  function handlePreloaderExitAnimation(event) {
    if (
      event.target === sitePreloader &&
      event.animationName === "preloader-exit"
    ) {
      sitePreloader.removeEventListener(
        "animationend",
        handlePreloaderExitAnimation,
      );
      removeSitePreloader();
    }
  }

  sitePreloader.addEventListener("animationend", handlePreloaderExitAnimation);
  window.setTimeout(removeSitePreloader, preloaderExitFallbackDuration);
}

function calculateSitePreloaderProgress(currentTime) {
  const elapsedTime = currentTime - preloaderAnimationStartTime;
  const stagedProgress =
    Math.min(elapsedTime / preloaderMinimumDuration, 1) *
    preloaderProgressBeforePageReady;

  if (!isPageReady || elapsedTime < preloaderMinimumDuration) {
    return stagedProgress;
  }

  preloaderFinishStartTime ??= currentTime;
  const finishProgress = Math.min(
    (currentTime - preloaderFinishStartTime) / preloaderFinishDuration,
    1,
  );

  return (
    preloaderProgressBeforePageReady +
    finishProgress * (1 - preloaderProgressBeforePageReady)
  );
}

function updateSitePreloader(currentTime) {
  preloaderAnimationStartTime ??= currentTime;
  const loadingProgress = calculateSitePreloaderProgress(currentTime);
  renderSitePreloaderProgress(loadingProgress);

  if (loadingProgress < 1) {
    window.requestAnimationFrame(updateSitePreloader);
  } else {
    completeSitePreloader();
  }
}

function startSitePreloader() {
  if (!sitePreloader || !preloaderProgressElement) {
    document.body.classList.remove("is-preloading");
    return;
  }

  if (reducedMotionPreference.matches) {
    preloaderProgressElement.textContent = "100%";
    sitePreloader.setAttribute("aria-valuenow", "100");
    document.body.classList.remove("is-preloading");
    removeSitePreloader();
    return;
  }

  if (!isPageReady) {
    window.addEventListener(
      "load",
      () => {
        isPageReady = true;
      },
      { once: true },
    );
  }

  window.requestAnimationFrame(updateSitePreloader);
}

startSitePreloader();

function updateHeaderScrollState() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 40);
}

function setMobileMenuState(isOpen) {
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  navigationMenu?.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMobileMenuState(!isOpen);
});

navigationMenu?.querySelectorAll("a").forEach((navigationLink) => {
  navigationLink.addEventListener("click", () => setMobileMenuState(false));
});

window.addEventListener("scroll", updateHeaderScrollState, { passive: true });
updateHeaderScrollState();

const revealElements = document.querySelectorAll(".reveal");
const statisticsSection = document.querySelector("[data-statistics-section]");
const statisticValueElements = document.querySelectorAll(
  "[data-statistic-value]",
);
const impactWordElements = document.querySelectorAll("[data-impact-preview]");
const impactPreviewCardElements = document.querySelectorAll(
  "[data-impact-preview-card]",
);
const footerWordmark = document.querySelector(".footer-wordmark");
let footerWordmarkAnimationFrame;

function animateStatisticValue(statisticValueElement) {
  const finalValue = Number(statisticValueElement.dataset.statisticValue);
  const animationDuration = 900;
  let animationStartTime;

  function updateStatisticValue(currentTime) {
    animationStartTime ??= currentTime;
    const elapsedTime = currentTime - animationStartTime;
    const progress = Math.min(elapsedTime / animationDuration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    statisticValueElement.textContent = String(
      Math.round(finalValue * easedProgress),
    );

    if (progress < 1) {
      window.requestAnimationFrame(updateStatisticValue);
    }
  }

  statisticValueElement.textContent = "0";
  window.requestAnimationFrame(updateStatisticValue);
}

function setActiveImpactPreview(previewName) {
  impactWordElements.forEach((impactWordElement) => {
    impactWordElement.classList.toggle(
      "is-active",
      impactWordElement.dataset.impactPreview === previewName,
    );
  });

  impactPreviewCardElements.forEach((impactPreviewCardElement) => {
    impactPreviewCardElement.classList.toggle(
      "is-active",
      impactPreviewCardElement.dataset.impactPreviewCard === previewName,
    );
  });
}

function updateFooterWordmarkScrollStretch() {
  footerWordmarkAnimationFrame = undefined;

  if (!footerWordmark) {
    return;
  }

  if (reducedMotionPreference.matches) {
    footerWordmark.style.setProperty("--footer-wordmark-stretch", "1");
    return;
  }

  const footerWordmarkTop = footerWordmark.getBoundingClientRect().top;
  const animationStartPosition = window.innerHeight;
  const maximumScrollPosition =
    document.documentElement.scrollHeight - window.innerHeight;
  const footerWordmarkDocumentTop = footerWordmarkTop + window.scrollY;
  const footerWordmarkTopAtPageEnd =
    footerWordmarkDocumentTop - maximumScrollPosition;
  const animationEndPosition = Math.max(
    window.innerHeight * 0.22,
    footerWordmarkTopAtPageEnd,
  );
  const scrollProgress = Math.min(
    Math.max(
      (animationStartPosition - footerWordmarkTop) /
        (animationStartPosition - animationEndPosition),
      0,
    ),
      1,
  );
  const verticalStretch = 0.1 + scrollProgress * 0.9;

  footerWordmark.style.setProperty(
    "--footer-wordmark-stretch",
    verticalStretch.toFixed(3),
  );
}

function requestFooterWordmarkScrollUpdate() {
  if (footerWordmarkAnimationFrame !== undefined) {
    return;
  }

  footerWordmarkAnimationFrame = window.requestAnimationFrame(
    updateFooterWordmarkScrollStretch,
  );
}

impactWordElements.forEach((impactWordElement) => {
  impactWordElement.addEventListener("pointerenter", () => {
    setActiveImpactPreview(impactWordElement.dataset.impactPreview);
  });

  impactWordElement.addEventListener("pointerleave", () => {
    if (document.activeElement !== impactWordElement) {
      setActiveImpactPreview();
    }
  });

  impactWordElement.addEventListener("focus", () => {
    setActiveImpactPreview(impactWordElement.dataset.impactPreview);
  });

  impactWordElement.addEventListener("blur", () => {
    setActiveImpactPreview();
  });
});

window.addEventListener("scroll", requestFooterWordmarkScrollUpdate, {
  passive: true,
});
window.addEventListener("resize", requestFooterWordmarkScrollUpdate);
updateFooterWordmarkScrollStretch();

if (reducedMotionPreference.matches) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

if (!reducedMotionPreference.matches && statisticsSection) {
  const statisticsObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        statisticValueElements.forEach(animateStatisticValue);
        statisticsObserver.disconnect();
      }
    },
    { threshold: 0.4 },
  );

  statisticsObserver.observe(statisticsSection);
}
