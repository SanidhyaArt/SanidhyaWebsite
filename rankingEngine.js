(function () {
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  class RankingEngine {
    constructor(options = {}) {
      this.weights = {
        distance: 0.22,
        direction: 0.12,
        velocity: 0.08,
        cursor: 0.2,
        heatmap: 0.16,
        session: 0.16,
        base: 0.06,
        ...(options.weights || {}),
      };
    }

    normalizeBasePriority(value) {
      return clamp(typeof value === "number" ? value : 0.5);
    }

    getDirectionMatch(scrollState, viewportState) {
      if (!scrollState || !viewportState) {
        return 0.5;
      }

      if (viewportState.inViewport) {
        return 1;
      }

      if (scrollState.direction === "still") {
        return 0.65;
      }

      if (
        (scrollState.direction === "down" &&
          viewportState.relativePosition === "below") ||
        (scrollState.direction === "up" && viewportState.relativePosition === "above")
      ) {
        return 1;
      }

      return 0.08;
    }

    getVelocityFactor(scrollState) {
      const averageVelocity = scrollState?.averageVelocity || 0;

      if (averageVelocity <= 0.2) {
        return 1;
      }

      if (averageVelocity >= 1.5) {
        return 0;
      }

      // Low scroll velocity means the user is settling and likely to interact;
      // higher velocity means we should stop guessing aggressively.
      return clamp(1 - (averageVelocity - 0.2) / 1.3);
    }

    computeTargetScore(target, context) {
      const viewportDistanceScore = clamp(context.viewportDistanceScore || 0);
      const scrollDirectionMatch = this.getDirectionMatch(
        context.scrollState,
        context.viewportState
      );
      const scrollVelocityFactor = this.getVelocityFactor(context.scrollState);
      const cursorIntentScore = clamp(context.cursorIntentScore || 0);
      const historicalScore = clamp(context.historicalScore || 0);
      const sessionRelevance = clamp(context.sessionRelevance || 0);
      const basePriority = this.normalizeBasePriority(target.basePriority);

      const weights = this.weights;
      const score =
        weights.distance * viewportDistanceScore +
        weights.direction * scrollDirectionMatch +
        weights.velocity * scrollVelocityFactor +
        weights.cursor * cursorIntentScore +
        weights.heatmap * historicalScore +
        weights.session * sessionRelevance +
        weights.base * basePriority;

      return {
        score: clamp(score),
        features: {
          viewportDistanceScore,
          scrollDirectionMatch,
          scrollVelocityFactor,
          cursorIntentScore,
          historicalScore,
          sessionRelevance,
          basePriority,
        },
      };
    }

    rankTargets(targets = [], contextFactory) {
      return targets
        .map((target) => {
          const context = typeof contextFactory === "function" ? contextFactory(target) : {};
          const result = this.computeTargetScore(target, context);
          return {
            ...target,
            ...result,
          };
        })
        .sort((left, right) => right.score - left.score);
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.RankingEngine = RankingEngine;
})();
