(function () {
  const STORAGE_KEY = "predictive-preload-store:v1";
  const SESSION_KEY = "predictive-preload-session-id";
  const STORE_VERSION = 1;

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

  const createDefaultStore = () => ({
    version: STORE_VERSION,
    lastDecaySessionId: null,
    scores: {},
    transitions: {},
    recentTargets: [],
    targetMeta: {},
  });

  const normalizeStore = (rawStore) => {
    const base = createDefaultStore();
    const store = rawStore && typeof rawStore === "object" ? rawStore : {};

    return {
      ...base,
      ...store,
      scores: store.scores && typeof store.scores === "object" ? store.scores : {},
      transitions:
        store.transitions && typeof store.transitions === "object"
          ? store.transitions
          : {},
      recentTargets: Array.isArray(store.recentTargets) ? store.recentTargets : [],
      targetMeta:
        store.targetMeta && typeof store.targetMeta === "object"
          ? store.targetMeta
          : {},
    };
  };

  const getSessionId = () => {
    try {
      let sessionId = window.sessionStorage.getItem(SESSION_KEY);

      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        window.sessionStorage.setItem(SESSION_KEY, sessionId);
      }

      return sessionId;
    } catch (error) {
      return `session-${Date.now()}`;
    }
  };

  class BehaviorStore {
    constructor(options = {}) {
      this.decayFactor = clamp(options.decayFactor ?? 0.86, 0.7, 0.95);
      this.maxRecentTargets = Math.max(4, options.maxRecentTargets ?? 10);
      this.sessionId = getSessionId();
      this.store = normalizeStore(
        safeParse(window.localStorage?.getItem(STORAGE_KEY), createDefaultStore())
      );

      this.applySessionDecay();
    }

    save() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      } catch (error) {
        return;
      }
    }

    applySessionDecay() {
      if (this.store.lastDecaySessionId === this.sessionId) {
        return;
      }

      Object.keys(this.store.scores).forEach((id) => {
        const entry = this.store.scores[id];

        if (!entry || typeof entry.score !== "number") {
          delete this.store.scores[id];
          return;
        }

        entry.score = Number((entry.score * this.decayFactor).toFixed(3));

        if (entry.score < 0.15) {
          delete this.store.scores[id];
        }
      });

      Object.keys(this.store.transitions).forEach((fromPath) => {
        const bucket = this.store.transitions[fromPath];

        if (!bucket || typeof bucket !== "object") {
          delete this.store.transitions[fromPath];
          return;
        }

        Object.keys(bucket).forEach((toPath) => {
          bucket[toPath] = Number((bucket[toPath] * this.decayFactor).toFixed(3));

          if (bucket[toPath] < 0.15) {
            delete bucket[toPath];
          }
        });

        if (!Object.keys(bucket).length) {
          delete this.store.transitions[fromPath];
        }
      });

      this.store.lastDecaySessionId = this.sessionId;
      this.save();
    }

    rememberMeta(id, meta = {}) {
      if (!id) {
        return;
      }

      const existing = this.store.targetMeta[id] || {};

      this.store.targetMeta[id] = {
        ...existing,
        category: meta.category || existing.category || "",
        href: meta.href || existing.href || "",
        tags: uniqueList([...(existing.tags || []), ...(meta.tags || [])]),
      };
    }

    getEntry(id) {
      if (!id) {
        return null;
      }

      if (!this.store.scores[id]) {
        this.store.scores[id] = {
          score: 0,
          clicks: 0,
          hovers: 0,
          viewportRewards: 0,
          lastInteractionAt: 0,
        };
      }

      return this.store.scores[id];
    }

    pushRecentTarget(id, meta = {}) {
      if (!id) {
        return;
      }

      const timestamp = Date.now();
      const recentTargets = this.store.recentTargets.filter((item) => item.id !== id);

      recentTargets.unshift({
        id,
        timestamp,
        category: meta.category || this.store.targetMeta[id]?.category || "",
        href: meta.href || this.store.targetMeta[id]?.href || "",
        tags: uniqueList(meta.tags || this.store.targetMeta[id]?.tags || []),
      });

      this.store.recentTargets = recentTargets.slice(0, this.maxRecentTargets);
    }

    recordInteraction(id, delta, type = "generic", meta = {}) {
      if (!id || !Number.isFinite(delta)) {
        return;
      }

      this.rememberMeta(id, meta);

      const entry = this.getEntry(id);
      entry.score = Number((entry.score + Math.max(0, delta)).toFixed(3));
      entry.lastInteractionAt = Date.now();

      if (type === "click") {
        entry.clicks += 1;
      } else if (type === "hover") {
        entry.hovers += 1;
      } else if (type === "viewport") {
        entry.viewportRewards += 1;
      }

      this.pushRecentTarget(id, meta);
      this.save();
    }

    recordTransition(fromPath, toPath, weight = 1) {
      if (!fromPath || !toPath || fromPath === toPath) {
        return;
      }

      if (!this.store.transitions[fromPath]) {
        this.store.transitions[fromPath] = {};
      }

      const bucket = this.store.transitions[fromPath];
      bucket[toPath] = Number(((bucket[toPath] || 0) + Math.max(0.2, weight)).toFixed(3));
      this.save();
    }

    getHistoricalScore(id) {
      const rawScore = this.store.scores[id]?.score || 0;

      // Exponential easing keeps scores bounded and makes learned behavior
      // useful without allowing older sessions to dominate forever.
      return clamp(1 - Math.exp(-rawScore / 14));
    }

    getTransitionScore(fromPath, toPath) {
      if (!fromPath || !toPath) {
        return 0;
      }

      const bucket = this.store.transitions[fromPath];

      if (!bucket) {
        return 0;
      }

      const targetScore = bucket[toPath] || 0;
      const maxScore = Math.max(1, ...Object.values(bucket));

      return clamp(targetScore / maxScore);
    }

    getRecentTargets(limit = 6) {
      return this.store.recentTargets.slice(0, limit);
    }

    getTargetMeta(id) {
      return this.store.targetMeta[id] || {};
    }

    getSimilarityScore(target = {}) {
      const targetCategory = String(target.category || "").trim();
      const targetTags = uniqueList(target.tags || []);

      if (!targetCategory && !targetTags.length) {
        return 0;
      }

      const recentTargets = this.getRecentTargets(6);

      if (!recentTargets.length) {
        return 0;
      }

      const similarityScores = recentTargets.map((recentTarget, index) => {
        const recencyWeight = 1 - index / Math.max(1, recentTargets.length);
        const categoryMatch =
          targetCategory &&
          recentTarget.category &&
          targetCategory === recentTarget.category
            ? 1
            : 0;

        const recentTags = uniqueList(recentTarget.tags || []);
        const sharedTags = targetTags.filter((tag) => recentTags.includes(tag));
        const tagScore =
          targetTags.length && recentTags.length
            ? sharedTags.length / Math.max(targetTags.length, recentTags.length)
            : 0;

        const recentHistoricalScore = this.getHistoricalScore(recentTarget.id);

        return clamp(
          (categoryMatch * 0.58 + tagScore * 0.42) *
            (0.62 + recencyWeight * 0.38) *
            Math.max(0.45, recentHistoricalScore)
        );
      });

      return clamp(Math.max(0, ...similarityScores));
    }

    snapshot() {
      return {
        sessionId: this.sessionId,
        scores: this.store.scores,
        transitions: this.store.transitions,
        recentTargets: this.store.recentTargets,
        targetMeta: this.store.targetMeta,
      };
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.BehaviorStore = BehaviorStore;
})();
