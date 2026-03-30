document.documentElement.classList.add("js");

document.querySelectorAll(".brand-name").forEach((brandName) => {
  brandName.textContent = "Sanidhya Singh";
});

const localeStorageKey = "locale";
const localeSuggestionDismissKey = "locale-suggestion-dismissed";
const pageLocale = document.documentElement.dataset.pageLocale || "en";

const getStoredLocale = () => {
  try {
    return window.localStorage.getItem(localeStorageKey);
  } catch (error) {
    return null;
  }
};

const setStoredLocale = (locale) => {
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch (error) {
    return;
  }
};

const getSuggestionDismissed = () => {
  try {
    return window.sessionStorage.getItem(localeSuggestionDismissKey) === "true";
  } catch (error) {
    return false;
  }
};

const setSuggestionDismissed = () => {
  try {
    window.sessionStorage.setItem(localeSuggestionDismissKey, "true");
  } catch (error) {
    return;
  }
};

const getTranslation = async (locale) => {
  const normalizedLocale = locale === "hi" ? "hi" : "en";

  try {
    const response = await fetch(`/locales/${normalizedLocale}.json`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Unable to load locale ${normalizedLocale}`);
    }

    return response.json();
  } catch (error) {
    if (normalizedLocale !== "en") {
      return getTranslation("en");
    }

    return null;
  }
};

const applyTranslations = (translations) => {
  if (!translations) {
    return;
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (!key || !(key in translations)) {
      return;
    }

    element.textContent = translations[key];
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;

    if (!key || !(key in translations)) {
      return;
    }

    element.innerHTML = translations[key];
  });

  const titleElement = document.querySelector("title[data-i18n-title]");
  if (titleElement) {
    const key = titleElement.dataset.i18nTitle;
    if (key && key in translations) {
      document.title = translations[key];
    }
  }

  const metaDescription = document.querySelector(
    'meta[name="description"][data-i18n-meta]'
  );
  if (metaDescription) {
    const key = metaDescription.dataset.i18nMeta;
    if (key && key in translations) {
      metaDescription.setAttribute("content", translations[key]);
    }
  }
};

const initializePageTranslation = async () => {
  if (pageLocale === "hi" && !getStoredLocale()) {
    setStoredLocale("hi");
  }

  if (!document.querySelector("[data-i18n], [data-i18n-html], title[data-i18n-title]")) {
    return;
  }

  const translations = await getTranslation(pageLocale);
  applyTranslations(translations);
};

const removeLanguageSuggestion = () => {
  document.querySelector(".language-suggestion")?.remove();
};

const renderLanguageSuggestion = () => {
  if (document.querySelector(".language-suggestion")) {
    return;
  }

  const suggestion = document.createElement("aside");
  suggestion.className = "language-suggestion";
  suggestion.setAttribute("role", "dialog");
  suggestion.setAttribute("aria-live", "polite");
  suggestion.setAttribute("aria-label", "Language suggestion");

  suggestion.innerHTML = `
    <button class="language-suggestion-close" type="button" aria-label="Dismiss language suggestion">×</button>
    <p class="language-suggestion-title">Language</p>
    <p class="language-suggestion-text">We noticed you're in India 🇮🇳 — would you like to view this site in Hindi?</p>
    <div class="language-suggestion-actions">
      <button class="language-suggestion-button is-primary" type="button" data-language-choice="hi">Switch to Hindi</button>
      <button class="language-suggestion-button is-secondary" type="button" data-language-choice="en">Stay in English</button>
    </div>
  `;

  suggestion
    .querySelector('[data-language-choice="hi"]')
    ?.addEventListener("click", () => {
      setStoredLocale("hi");
      removeLanguageSuggestion();
      window.location.href = "/hi";
    });

  suggestion
    .querySelector('[data-language-choice="en"]')
    ?.addEventListener("click", () => {
      setStoredLocale("en");
      removeLanguageSuggestion();
    });

  suggestion
    .querySelector(".language-suggestion-close")
    ?.addEventListener("click", () => {
      setSuggestionDismissed();
      removeLanguageSuggestion();
    });

  document.body.append(suggestion);
};

const initializeLanguageSuggestion = async () => {
  if (pageLocale === "hi" || getStoredLocale() || getSuggestionDismissed()) {
    return;
  }

  try {
    const response = await fetch("/api/country", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const { country } = await response.json();

    if (country === "IN") {
      renderLanguageSuggestion();
    }
  } catch (error) {
    return;
  }
};

void initializePageTranslation();
void initializeLanguageSuggestion();

const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const headerContact = document.querySelector(".header-contact");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenuBreakpoint = 860;

if (siteHeader && siteNav && headerContact && menuToggle) {
  siteNav.id = siteNav.id || "primary-nav";
  menuToggle.setAttribute("aria-controls", siteNav.id);

  const setMenuState = (open) => {
    siteHeader.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("menu-open", open);
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu"
    );
  };

  const closeMenu = () => {
    setMenuState(false);
  };

  menuToggle.addEventListener("click", () => {
    setMenuState(!siteHeader.classList.contains("is-menu-open"));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      window.innerWidth > mobileMenuBreakpoint ||
      !siteHeader.classList.contains("is-menu-open") ||
      siteHeader.contains(event.target)
    ) {
      return;
    }

    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > mobileMenuBreakpoint) {
      closeMenu();
    }
  });
}

const cards = document.querySelectorAll(".service-card");
const serviceListItems = document.querySelectorAll(".service-list-item");

const revealCards = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealCards.unobserve(entry.target);
      }
    }
  },
  {
    threshold: 0.18,
  }
);

cards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 70}ms`;
  revealCards.observe(card);
});

serviceListItems.forEach((item) => {
  let jiggleTimer = 0;

  item.addEventListener(
    "touchstart",
    () => {
      item.classList.remove("is-jiggling");
      void item.offsetWidth;
      item.classList.add("is-jiggling");

      window.clearTimeout(jiggleTimer);
      jiggleTimer = window.setTimeout(() => {
        item.classList.remove("is-jiggling");
      }, 380);
    },
    { passive: true }
  );
});

const compareSliders = document.querySelectorAll("[data-compare-slider]");

compareSliders.forEach((slider) => {
  const range = slider.querySelector(".work-compare-range");
  const beforeImage = slider.querySelector(".work-compare-image--before");
  const afterImage = slider.querySelector(".work-compare-image--after");

  if (!range || !beforeImage || !afterImage) {
    return;
  }

  const setPosition = (value) => {
    slider.style.setProperty("--compare-position", `${value}%`);
  };

  const loadImageWithFallback = (image) => {
    const primary = image.dataset.primary;
    const fallback = image.dataset.fallback;

    if (!primary && !fallback) {
      return;
    }

    let hasTriedFallback = false;

    image.addEventListener("error", () => {
      if (!fallback || hasTriedFallback || image.src.endsWith(fallback)) {
        return;
      }

      hasTriedFallback = true;
      image.src = fallback;
    });

    image.src = primary || fallback;
  };

  const syncAspectRatio = () => {
    const sourceImage = afterImage.naturalWidth ? afterImage : beforeImage;

    if (!sourceImage.naturalWidth || !sourceImage.naturalHeight) {
      return;
    }

    slider.style.setProperty(
      "--compare-aspect",
      `${sourceImage.naturalWidth} / ${sourceImage.naturalHeight}`
    );
    slider.classList.toggle(
      "is-portrait",
      sourceImage.naturalHeight > sourceImage.naturalWidth
    );
  };

  setPosition(range.value || slider.dataset.compareStart || 50);
  range.addEventListener("input", () => {
    setPosition(range.value);
  });

  [beforeImage, afterImage].forEach((image) => {
    loadImageWithFallback(image);

    if (image.complete) {
      syncAspectRatio();
    } else {
      image.addEventListener("load", syncAspectRatio);
    }
  });
});

const offeringGrids = document.querySelectorAll(".offerings-grid");
const revealTimers = new WeakMap();

const rebalanceOfferingGrid = (grid) => {
  const mobile = window.innerWidth <= 980;
  const existingColumns = Array.from(
    grid.querySelectorAll(":scope > .offerings-column")
  );

  const sections = existingColumns.length
    ? existingColumns.flatMap((column) => Array.from(column.children))
    : Array.from(grid.querySelectorAll(":scope > .offering-group"));

  if (mobile) {
    if (existingColumns.length) {
      grid.replaceChildren(...sections);
    }
    return;
  }

  const leftColumn = document.createElement("div");
  leftColumn.className = "offerings-column";

  const rightColumn = document.createElement("div");
  rightColumn.className = "offerings-column";

  sections.forEach((section, index) => {
    if (index % 2 === 0) {
      leftColumn.appendChild(section);
    } else {
      rightColumn.appendChild(section);
    }
  });

  grid.replaceChildren(leftColumn, rightColumn);
};

const clearRevealTimers = (section) => {
  const timers = revealTimers.get(section) || [];

  timers.forEach((timer) => {
    window.clearTimeout(timer);
  });

  revealTimers.delete(section);
};

const resetSectionItems = (section) => {
  clearRevealTimers(section);

  section.querySelectorAll("li").forEach((item) => {
    item.classList.remove("is-revealed");
  });
};

const revealSectionItems = (section) => {
  resetSectionItems(section);

  const timers = [];

  section.querySelectorAll("li").forEach((item, index) => {
    const timer = window.setTimeout(() => {
      item.classList.add("is-revealed");
    }, 40 + index * 45);

    timers.push(timer);
  });

  revealTimers.set(section, timers);
};

offeringGrids.forEach((grid) => {
  rebalanceOfferingGrid(grid);

  const sections = grid.querySelectorAll(".offering-group");

  sections.forEach((section) => {
    if (section.open) {
      revealSectionItems(section);
    } else {
      resetSectionItems(section);
    }
  });

  sections.forEach((section) => {
    const summary = section.querySelector("summary");

    if (!summary) {
      return;
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      const willOpen = !section.open;

      sections.forEach((item) => {
        if (item !== section) {
          item.open = false;
          resetSectionItems(item);
        }
      });

      section.open = willOpen;

      if (willOpen) {
        revealSectionItems(section);
      } else {
        resetSectionItems(section);
      }
    });
  });
});

window.addEventListener("resize", () => {
  offeringGrids.forEach((grid) => {
    rebalanceOfferingGrid(grid);
  });
});

const inquiryMessageField = document.querySelector("#inquiry-message");
const inquiryServiceLabel = document.querySelector("#inquiry-service-label");
const contactEmailLink = document.querySelector("#contact-email-link");

if (inquiryMessageField && inquiryServiceLabel && contactEmailLink) {
  const localizedServiceTemplates = {
    en: {
      "brand-identity": "Brand Identity & Visual Systems",
      "campaign-design": "Campaign Design & Marketing Visuals",
      illustration: "Illustration & Visual Development",
      "game-art": "Game Art & Interactive Visual Design",
      "motion-design": "Motion Design & Animated Content",
      "three-d-visualization": "3D Design & Product Visualization",
      "architectural-visualization": "Architectural & Spatial Visualization",
      retouching: "Retouching & Image Refinement",
    },
    hi: {
      "brand-identity": "ब्रांड आइडेंटिटी और विज़ुअल सिस्टम्स",
      "campaign-design": "कैंपेन डिज़ाइन और मार्केटिंग विज़ुअल्स",
      illustration: "इलस्ट्रेशन और विज़ुअल डेवलपमेंट",
      "game-art": "गेम आर्ट और इंटरैक्टिव विज़ुअल डिज़ाइन",
      "motion-design": "मोशन डिज़ाइन और ऐनिमेटेड कंटेंट",
      "three-d-visualization": "3D डिज़ाइन और प्रोडक्ट विज़ुअलाइज़ेशन",
      "architectural-visualization": "आर्किटेक्चरल और स्पैशियल विज़ुअलाइज़ेशन",
      retouching: "रिटचिंग और इमेज रिफाइनमेंट",
    },
  };

  const contactCopy = {
    en: {
      generalInquiryLabel: "General inquiry",
      genericMessage: `Hello Sanidhya,

I would love to discuss a potential project.

Brand / project:
Scope:
Timeline:
Budget range:
References:

Please let me know the next steps.`,
      projectMessage: (serviceName) => `Hello Sanidhya,

I would love to discuss ${serviceName} for an upcoming project.

Brand / project:
Scope:
Timeline:
Budget range:
References:

Please let me know the next steps.`,
      inquirySubject: "Project Inquiry",
      serviceSubject: (serviceName) => `Inquiry - ${serviceName}`,
    },
    hi: {
      generalInquiryLabel: "सामान्य पूछताछ",
      genericMessage: `Hello Sanidhya,

मैं एक संभावित प्रोजेक्ट पर बात करना चाहता/चाहती हूँ।

Brand / project:
Scope:
Timeline:
Budget range:
References:

कृपया अगले steps बताइए।`,
      projectMessage: (serviceName) => `Hello Sanidhya,

मैं ${serviceName} से जुड़े एक संभावित प्रोजेक्ट पर बात करना चाहता/चाहती हूँ।

Brand / project:
Scope:
Timeline:
Budget range:
References:

कृपया अगले steps बताइए।`,
      inquirySubject: "Project Inquiry",
      serviceSubject: (serviceName) => `Inquiry - ${serviceName}`,
    },
  };

  const searchParams = new URLSearchParams(window.location.search);
  const serviceSlug = searchParams.get("service");
  const activeLocale = pageLocale === "hi" ? "hi" : "en";
  const serviceTemplates = localizedServiceTemplates[activeLocale];
  const serviceName = serviceTemplates[serviceSlug];
  const copy = contactCopy[activeLocale];
  const defaultMessage = serviceName
    ? copy.projectMessage(serviceName)
    : copy.genericMessage;

  inquiryServiceLabel.textContent = serviceName || copy.generalInquiryLabel;
  inquiryMessageField.value = defaultMessage;

  const updateEmailLink = () => {
    const subject = serviceName
      ? copy.serviceSubject(serviceName)
      : copy.inquirySubject;
    const body = inquiryMessageField.value.trim() || defaultMessage;

    contactEmailLink.href = `mailto:singhsanidhya13@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  updateEmailLink();
  inquiryMessageField.addEventListener("input", updateEmailLink);
}

const freebiesForm = document.querySelector("#freebies-unlock");
const freebiesPasswordInput = document.querySelector("#freebies-password");
const freebiesStatus = document.querySelector("#freebies-status");
const freebiesAccessKey = "sanidhya-freebies-unlocked";
const hiddenPage = document.querySelector(".hidden-page-body");

if (freebiesForm && freebiesPasswordInput && freebiesStatus) {
  const unlockPassword = (freebiesForm.dataset.password || "").trim().toLowerCase();

  freebiesForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submittedPassword = freebiesPasswordInput.value.trim().toLowerCase();
    const unlocked = unlockPassword && submittedPassword === unlockPassword;

    freebiesStatus.classList.remove("is-success", "is-error");

    if (!unlocked) {
      freebiesStatus.textContent = "That password does not match.";
      freebiesStatus.classList.add("is-error");
      freebiesPasswordInput.focus();
      freebiesPasswordInput.select();
      return;
    }

    window.sessionStorage.setItem(freebiesAccessKey, "true");
    freebiesStatus.textContent = "Access granted. Redirecting...";
    freebiesStatus.classList.add("is-success");
    freebiesPasswordInput.value = "";
    window.location.href = "./hidden";
  });
}

if (hiddenPage && window.sessionStorage.getItem(freebiesAccessKey) !== "true") {
  window.location.replace("./freebies");
}

const workTitleRail = document.querySelector("#work-title-rail");
const workTitleItems = Array.from(document.querySelectorAll(".work-title-item"));
const workTitleDisplay = document.querySelector("#work-title-display");
const workFeatureStack = document.querySelector("#work-feature-stack");
const workScrollHost = document.querySelector(".work-page-content");
const workShowcase = document.querySelector(".work-showcase");

if (
  workTitleRail &&
  workTitleItems.length &&
  workTitleDisplay &&
  workFeatureStack &&
  workScrollHost
) {
  const workFeatureCards = workTitleItems.map((item, index) => {
    const card = document.createElement("a");
    const label = item.textContent.trim();

    card.className = "work-feature-card";
    card.href = item.dataset.href || "./work";
    card.dataset.preview = item.dataset.preview || "";
    card.dataset.index = String(index);
    card.setAttribute("aria-label", label);
    card.innerHTML = '<div class="work-feature-media" aria-hidden="true"></div>';

    workFeatureStack.append(card);
    return card;
  });

  let activeWorkIndex = 0;
  let titleSyncLocked = false;
  let titleScrollFrame = 0;
  let workResizeFrame = 0;
  let touchStartY = null;
  let touchStartX = null;

  const setActiveWorkIndex = (index) => {
    const changed = index !== activeWorkIndex;

    if (!changed) {
      return;
    }

    activeWorkIndex = index;

    workTitleItems.forEach((entry, entryIndex) => {
      entry.classList.toggle("is-active", entryIndex === index);
    });

    workTitleDisplay.textContent = workTitleItems[index].textContent.trim();

    workFeatureCards.forEach((card, cardIndex) => {
      const stackOrder =
        (cardIndex - index + workFeatureCards.length) % workFeatureCards.length;

      let translate = 560;
      let scale = 0.52;
      let opacity = 0;

      if (stackOrder === 0) {
        translate = 0;
        scale = 1;
        opacity = 1;
      } else if (stackOrder === 1) {
        translate = 188;
        scale = 0.88;
        opacity = 0.78;
      } else if (stackOrder === 2) {
        translate = 314;
        scale = 0.76;
        opacity = 0.54;
      } else if (stackOrder === 3) {
        translate = 406;
        scale = 0.66;
        opacity = 0.3;
      }

      card.style.setProperty("--stack-order", String(stackOrder));
      card.style.setProperty("--stack-translate", `${translate}px`);
      card.style.setProperty("--stack-scale", String(scale));
      card.style.setProperty("--stack-opacity", String(opacity));
      card.classList.toggle("is-active", stackOrder === 0);
      card.tabIndex = stackOrder === 0 ? 0 : -1;
      card.setAttribute("aria-hidden", stackOrder === 0 ? "false" : "true");
    });
  };

  const nearestItemIndex = () => {
    const frameHeight =
      workTitleItems[0]?.offsetHeight || workTitleRail.clientHeight || 1;

    return Math.max(
      0,
      Math.min(
        workTitleItems.length - 1,
        Math.round(workTitleRail.scrollTop / frameHeight)
      )
    );
  };

  const scrollTitleRailToIndex = (index, behavior = "smooth") => {
    const frameHeight =
      workTitleItems[index]?.offsetHeight ||
      workTitleItems[0]?.offsetHeight ||
      workTitleRail.clientHeight ||
      1;
    const top = frameHeight * index;

    if (typeof workTitleRail.scrollTo === "function") {
      workTitleRail.scrollTo({
        top,
        behavior,
      });
      return;
    }

    workTitleRail.scrollTop = top;
  };

  const unlockTitleSync = () => {
    window.setTimeout(() => {
      titleSyncLocked = false;
    }, 260);
  };

  const activateWorkIndex = (index, source = "manual") => {
    if (index < 0 || index >= workTitleItems.length) {
      return;
    }

    setActiveWorkIndex(index);

    if (source !== "titles") {
      titleSyncLocked = true;
      scrollTitleRailToIndex(index);
      unlockTitleSync();
    }
  };

  const syncFromTitleRail = () => {
    if (titleSyncLocked) {
      return;
    }

    window.cancelAnimationFrame(titleScrollFrame);
    titleScrollFrame = window.requestAnimationFrame(() => {
      const index = nearestItemIndex();

      activateWorkIndex(index, "titles");
    });
  };

  const realignActiveWorkTitle = () => {
    window.cancelAnimationFrame(workResizeFrame);
    workResizeFrame = window.requestAnimationFrame(() => {
      const activeItem = workTitleItems[activeWorkIndex];

      if (!activeItem) {
        return;
      }

      titleSyncLocked = true;
      scrollTitleRailToIndex(activeWorkIndex, "auto");
      unlockTitleSync();
    });
  };

  const applyWorkScrollDelta = (deltaY) => {
    const nextScrollTop = workTitleRail.scrollTop + deltaY;
    const maxScrollTop = workTitleRail.scrollHeight - workTitleRail.clientHeight;
    const canScrollDown = deltaY > 0 && workTitleRail.scrollTop < maxScrollTop - 1;
    const canScrollUp = deltaY < 0 && workTitleRail.scrollTop > 1;

    if (!canScrollDown && !canScrollUp) {
      return false;
    }

    workTitleRail.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
    return true;
  };

  activeWorkIndex = -1;
  setActiveWorkIndex(0);
  workTitleRail.addEventListener("scroll", syncFromTitleRail);
  window.addEventListener("resize", realignActiveWorkTitle);

  workScrollHost.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      if (!applyWorkScrollDelta(event.deltaY)) {
        return;
      }

      event.preventDefault();
    },
    { passive: false }
  );

  if (workShowcase) {
    workShowcase.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) {
          touchStartY = null;
          touchStartX = null;
          return;
        }

        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );

    workShowcase.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 1 || touchStartY === null || touchStartX === null) {
          return;
        }

        const currentY = event.touches[0].clientY;
        const currentX = event.touches[0].clientX;
        const deltaY = touchStartY - currentY;
        const deltaX = touchStartX - currentX;

        if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 6) {
          return;
        }

        if (applyWorkScrollDelta(deltaY)) {
          event.preventDefault();
          touchStartY = currentY;
          touchStartX = currentX;
        }
      },
      { passive: false }
    );

    const resetTouchTracking = () => {
      touchStartY = null;
      touchStartX = null;
    };

    workShowcase.addEventListener("touchend", resetTouchTracking, { passive: true });
    workShowcase.addEventListener("touchcancel", resetTouchTracking, { passive: true });
  }

  workTitleItems.forEach((item, index) => {
    item.tabIndex = -1;

    item.addEventListener("click", () => {
      activateWorkIndex(index);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateWorkIndex(index);
      }
    });
  });
}
