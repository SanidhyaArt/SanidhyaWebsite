(function () {
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  class ViewportPredictor {
    constructor(options = {}) {
      this.rootMargin = options.rootMargin || "600px 0px";
      this.viewportRewardDelay = Math.max(400, options.viewportRewardDelay ?? 900);
      this.targets = new Map();
      this.observer =
        "IntersectionObserver" in window
          ? new IntersectionObserver(this.handleEntries.bind(this), {
              root: null,
              rootMargin: this.rootMargin,
              threshold: [0, 0.15, 0.4, 0.8],
            })
          : null;
    }

    handleEntries(entries) {
      entries.forEach((entry) => {
        const target = this.targets.get(entry.target);

        if (!target) {
          return;
        }

        target.entry = entry;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
          this.startViewportReward(target);
        } else {
          this.clearViewportReward(target);
        }
      });
    }

    startViewportReward(target) {
      if (!target || target.rewardedInSession) {
        return;
      }

      window.clearTimeout(target.rewardTimer);
      target.rewardTimer = window.setTimeout(() => {
        target.rewardedInSession = true;

        if (typeof target.onViewportReward === "function") {
          target.onViewportReward(target.id);
        }
      }, this.viewportRewardDelay);
    }

    clearViewportReward(target) {
      if (!target) {
        return;
      }

      window.clearTimeout(target.rewardTimer);
    }

    registerTarget(element, options = {}) {
      if (!element) {
        return;
      }

      const target = {
        id: options.id || "",
        onViewportReward: options.onViewportReward,
        entry: null,
        rewardTimer: 0,
        rewardedInSession: false,
      };

      this.targets.set(element, target);

      if (this.observer) {
        this.observer.observe(element);
      }
    }

    unregisterTarget(element) {
      const target = this.targets.get(element);

      if (!target) {
        return;
      }

      this.clearViewportReward(target);

      if (this.observer) {
        this.observer.unobserve(element);
      }

      this.targets.delete(element);
    }

    getViewportState(element) {
      if (!element) {
        return {
          distanceScore: 0,
          relativePosition: "unknown",
          intersectionRatio: 0,
          inViewport: false,
        };
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const extendedDistance = 800;
      let relativePosition = "in";
      let distance = 0;

      if (rect.bottom < 0) {
        relativePosition = "above";
        distance = Math.abs(rect.bottom);
      } else if (rect.top > viewportHeight) {
        relativePosition = "below";
        distance = rect.top - viewportHeight;
      }

      return {
        distanceScore: clamp(1 - distance / extendedDistance),
        relativePosition,
        intersectionRatio: this.targets.get(element)?.entry?.intersectionRatio || 0,
        inViewport: rect.top < viewportHeight && rect.bottom > 0,
      };
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.ViewportPredictor = ViewportPredictor;
})();
