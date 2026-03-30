(function () {
  const STORAGE_KEY = "predictive-preload-session:v1";

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const uniqueList = (items = []) =>
    Array.from(
      new Set(
        items
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );

  const normalizePath = (value = "") => {
    if (!value) {
      return "/";
    }

    try {
      const url = new URL(value, window.location.origin);
      let pathname = url.pathname || "/";

      pathname = pathname.replace(/\/index(?:\.html)?$/i, "/");
      pathname = pathname.replace(/\.html$/i, "");

      if (pathname.startsWith("/hi")) {
        pathname = pathname.slice(3) || "/";
      }

      if (pathname.length > 1) {
        pathname = pathname.replace(/\/+$/, "");
      }

      return pathname || "/";
    } catch (error) {
      return "/";
    }
  };

  const safeParse = (value, fallback) => {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  };

  class SessionTracker {
    constructor(options = {}) {
      this.behaviorStore = options.behaviorStore;
      this.maxPathLength = Math.max(4, options.maxPathLength ?? 12);
      this.currentPath = normalizePath(options.currentPath || window.location.pathname);
      this.state = safeParse(window.sessionStorage?.getItem(STORAGE_KEY), {
        path: [],
        interactions: {},
        lastInteractedId: "",
      });

      this.registerPageVisit(this.currentPath);
    }

    save() {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (error) {
        return;
      }
    }

    registerPageVisit(pathname) {
      const normalizedPath = normalizePath(pathname);
      const previousPath = this.state.path[this.state.path.length - 1] || "";

      if (previousPath !== normalizedPath) {
        if (previousPath && this.behaviorStore) {
          this.behaviorStore.recordTransition(previousPath, normalizedPath, 0.8);
        }

        this.state.path.push(normalizedPath);
        this.state.path = this.state.path.slice(-this.maxPathLength);
      }

      this.currentPath = normalizedPath;
      this.save();
    }

    recordInteraction(id, meta = {}) {
      if (!id) {
        return;
      }

      const existing = this.state.interactions[id] || {
        count: 0,
        href: "",
        category: "",
        tags: [],
        lastAt: 0,
      };

      this.state.interactions[id] = {
        ...existing,
        count: existing.count + 1,
        href: meta.href || existing.href || "",
        category: meta.category || existing.category || "",
        tags: uniqueList([...(existing.tags || []), ...(meta.tags || [])]),
        lastAt: Date.now(),
      };
      this.state.lastInteractedId = id;
      this.save();
    }

    getPath() {
      return [...this.state.path];
    }

    getRecentInteractions(limit = 6) {
      return Object.entries(this.state.interactions)
        .map(([id, value]) => ({ id, ...value }))
        .sort((left, right) => (right.lastAt || 0) - (left.lastAt || 0))
        .slice(0, limit);
    }

    getSessionRelevance(target = {}) {
      const targetPath = normalizePath(target.href || "");
      const transitionScore =
        targetPath && this.behaviorStore
          ? this.behaviorStore.getTransitionScore(this.currentPath, targetPath)
          : 0;

      const recentInteractions = this.getRecentInteractions(4);
      const targetTags = uniqueList(target.tags || []);
      const targetCategory = String(target.category || "").trim();

      const interactionSimilarity = recentInteractions.reduce((bestScore, item, index) => {
        const recencyWeight = 1 - index / Math.max(1, recentInteractions.length);
        const categoryMatch =
          targetCategory &&
          item.category &&
          targetCategory === item.category
            ? 1
            : 0;
        const sharedTags = targetTags.filter((tag) => (item.tags || []).includes(tag));
        const tagScore =
          targetTags.length && item.tags?.length
            ? sharedTags.length / Math.max(targetTags.length, item.tags.length)
            : 0;

        return Math.max(
          bestScore,
          clamp((categoryMatch * 0.55 + tagScore * 0.45) * recencyWeight)
        );
      }, 0);

      const pathHistory = this.getPath();
      const revisitScore =
        targetPath && pathHistory.includes(targetPath)
          ? clamp(0.24 + 0.12 * pathHistory.filter((path) => path === targetPath).length)
          : 0;

      // Session relevance blends explicit journey history, learned page
      // transitions, and similarity to the most recent session interactions.
      return clamp(
        transitionScore * 0.5 + interactionSimilarity * 0.35 + revisitScore * 0.15
      );
    }

    snapshot() {
      return {
        currentPath: this.currentPath,
        path: this.getPath(),
        interactions: this.state.interactions,
        lastInteractedId: this.state.lastInteractedId,
      };
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.SessionTracker = SessionTracker;
})();
