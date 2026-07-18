const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navigationMenu = document.querySelector("[data-navigation-menu]");
const reducedMotionPreference = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

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
