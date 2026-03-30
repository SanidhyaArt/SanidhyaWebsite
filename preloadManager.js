(function () {
  const modules = window.PredictivePreloadModules || {};
  const BehaviorStore = modules.BehaviorStore;
  const SessionTracker = modules.SessionTracker;
  const ScrollTracker = modules.ScrollTracker;
  const CursorTracker = modules.CursorTracker;
  const ViewportPredictor = modules.ViewportPredictor;
  const RankingEngine = modules.RankingEngine;

  const DEBUG_STORAGE_KEY = "predictive-preload-debug";

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const requestIdle =
    window.requestIdleCallback ||
    function (callback) {
      return window.setTimeout(
        () =>
          callback({
            didTimeout: false,
            timeRemaining: () => 16,
          }),
        80
      );
    };

  const cancelIdle =
    window.cancelIdleCallback ||
    function (id) {
      window.clearTimeout(id);
    };

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

  const uniqueList = (items = []) =>
    Array.from(
      new Set(
        items
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );

  const guessAssetType = (value = "") => {
    if (/\.mp4($|\?)/i.test(value)) {
      return "video";
    }

    if (/\.(png|jpe?g|webp|avif|gif|svg)($|\?)/i.test(value)) {
      return "image";
    }

    return "fetch";
  };

  const normalizeAsset = (asset, target) => {
    if (!asset) {
      return null;
    }

    if (typeof asset === "string") {
      const type = guessAssetType(asset);
      return {
        type,
        url: asset,
        targetId: target.id,
        key: `${type}:${asset}`,
      };
    }

    if (typeof asset === "object" && asset.url) {
      return {
        type: asset.type || guessAssetType(asset.url),
        url: asset.url,
        as: asset.as || "",
        targetId: target.id,
        key: `${asset.type || guessAssetType(asset.url)}:${asset.url}`,
      };
    }

    return null;
  };

  class ManagedPreloadQueue {
    constructor(options = {}) {
      this.maxConcurrent = Math.max(1, options.maxConcurrent ?? 2);
      this.loadedAssets = new Set();
      this.activeTasks = new Map();
      this.queue = [];
      this.idleId = 0;
      this.onChange = options.onChange;
      this.currentPath = normalizePath(window.location.pathname);
      this.pauseNewTasks = false;
    }

    buildQueue(rankings = []) {
      const nextQueue = [];
      const seenTaskKeys = new Set();

      rankings.slice(0, 10).forEach((target, targetIndex) => {
        if (target.score < 0.18) {
          return;
        }

        if (target.href && normalizePath(target.href) !== this.currentPath) {
          const routePath = normalizePath(target.href);
          const documentTask = {
            key: `fetch:${routePath}`,
            type: "fetch",
            url: target.href,
            targetId: target.id,
            score: clamp(target.score + 0.08),
            targetLabel: target.debugLabel,
          };

          if (!this.loadedAssets.has(documentTask.key) && !seenTaskKeys.has(documentTask.key)) {
            nextQueue.push(documentTask);
            seenTaskKeys.add(documentTask.key);
          }
        }

        (target.assets || [])
          .map((asset) => normalizeAsset(asset, target))
          .filter(Boolean)
          .forEach((asset, assetIndex) => {
            const task = {
              ...asset,
              score: clamp(target.score - assetIndex * 0.04 - targetIndex * 0.01),
              targetLabel: target.debugLabel,
            };

            if (this.loadedAssets.has(task.key) || seenTaskKeys.has(task.key)) {
              return;
            }

            nextQueue.push(task);
            seenTaskKeys.add(task.key);
          });
      });

      nextQueue.sort((left, right) => right.score - left.score);
      return nextQueue;
    }

    updateRankings(rankings, options = {}) {
      this.pauseNewTasks = Boolean(options.pauseNewTasks);
      this.queue = this.buildQueue(rankings);
      this.cancelStaleTasks(rankings);
      this.schedulePump();
      this.emitChange();
    }

    schedulePump() {
      cancelIdle(this.idleId);
      this.idleId = requestIdle(() => {
        this.pump();
      });
    }

    pump() {
      if (this.pauseNewTasks) {
        return;
      }

      while (
        this.activeTasks.size < this.maxConcurrent &&
        this.queue.length
      ) {
        const nextTask = this.queue.shift();

        if (!nextTask || this.loadedAssets.has(nextTask.key) || this.activeTasks.has(nextTask.key)) {
          continue;
        }

        this.startTask(nextTask);
      }
    }

    startTask(task) {
      const entry = {
        ...task,
        startedAt: performance.now(),
        cancel: null,
      };

      this.activeTasks.set(task.key, entry);
      this.emitChange();

      if (task.type === "fetch") {
        this.startFetchTask(entry);
        return;
      }

      if (task.type === "video") {
        this.startVideoTask(entry);
        return;
      }

      this.startImageTask(entry);
    }

    finishTask(taskKey, loaded = true) {
      const task = this.activeTasks.get(taskKey);

      if (!task) {
        return;
      }

      this.activeTasks.delete(taskKey);

      if (loaded) {
        this.loadedAssets.add(taskKey);
      }

      this.emitChange();
      this.schedulePump();
    }

    startFetchTask(task) {
      const controller = new AbortController();
      task.cancel = () => controller.abort();

      fetch(task.url, {
        signal: controller.signal,
        credentials: "same-origin",
        cache: "force-cache",
        headers: {
          Accept: "text/html,application/json;q=0.9,*/*;q=0.1",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to preload ${task.url}`);
          }

          return response.text();
        })
        .then(() => {
          this.finishTask(task.key, true);
        })
        .catch((error) => {
          this.finishTask(task.key, error?.name !== "AbortError");
        });
    }

    startImageTask(task) {
      const image = new Image();
      let finished = false;

      const finalize = (loaded) => {
        if (finished) {
          return;
        }

        finished = true;
        image.onload = null;
        image.onerror = null;
        this.finishTask(task.key, loaded);
      };

      task.cancel = () => {
        image.onload = null;
        image.onerror = null;
        image.src = "";
        finalize(false);
      };

      image.decoding = "async";
      image.fetchPriority = task.score > 0.7 ? "high" : "low";
      image.onload = () => finalize(true);
      image.onerror = () => finalize(false);
      image.src = task.url;

      if (image.complete) {
        finalize(true);
      }
    }

    startVideoTask(task) {
      const video = document.createElement("video");
      let finished = false;

      const finalize = (loaded) => {
        if (finished) {
          return;
        }

        finished = true;
        video.onloadedmetadata = null;
        video.onerror = null;
        this.finishTask(task.key, loaded);
      };

      task.cancel = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
        video.pause();
        video.removeAttribute("src");
        video.load();
        finalize(false);
      };

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => finalize(true);
      video.onerror = () => finalize(false);
      video.src = task.url;
      video.load();
    }

    cancelStaleTasks(rankings = []) {
      const scoreLookup = new Map(rankings.map((target) => [target.id, target.score]));
      const highestScore = rankings[0]?.score || 0;

      this.activeTasks.forEach((task) => {
        const nextTargetScore = scoreLookup.get(task.targetId) ?? task.score;
        const shouldCancel =
          this.pauseNewTasks ||
          highestScore - nextTargetScore > 0.34 ||
          nextTargetScore < 0.2;

        if (shouldCancel && typeof task.cancel === "function") {
          task.cancel();
        }
      });
    }

    cancelBelowScore(minScore = 0.55) {
      this.activeTasks.forEach((task) => {
        if (task.score < minScore && typeof task.cancel === "function") {
          task.cancel();
        }
      });
    }

    emitChange() {
      if (typeof this.onChange === "function") {
        this.onChange({
          queue: this.queue.slice(0, 6),
          activeTasks: this.getActiveTasks(),
          loadedAssets: Array.from(this.loadedAssets),
        });
      }
    }

    getActiveTasks() {
      return Array.from(this.activeTasks.values()).map((task) => ({
        key: task.key,
        type: task.type,
        url: task.url,
        score: task.score,
        targetLabel: task.targetLabel,
      }));
    }
  }

  class PredictivePreloadSystem {
    constructor(options = {}) {
      if (
        !BehaviorStore ||
        !SessionTracker ||
        !ScrollTracker ||
        !CursorTracker ||
        !ViewportPredictor ||
        !RankingEngine
      ) {
        throw new Error("Predictive preload modules are not ready.");
      }

      this.options = options;
      this.targets = new Map();
      this.behaviorStore = new BehaviorStore({
        decayFactor: 0.85,
      });
      this.sessionTracker = new SessionTracker({
        behaviorStore: this.behaviorStore,
        currentPath: window.location.pathname,
      });
      this.scrollTracker = new ScrollTracker({
        sampleSize: 8,
      });
      this.cursorTracker = new CursorTracker({
        sampleSize: 6,
        dwellMs: 160,
      });
      this.viewportPredictor = new ViewportPredictor({
        rootMargin: "640px 0px",
        viewportRewardDelay: 900,
      });
      this.rankingEngine = new RankingEngine({
        weights: options.weights,
      });
      this.performanceProfile = this.buildPerformanceProfile();
      this.preloadQueue = new ManagedPreloadQueue({
        maxConcurrent: this.performanceProfile.maxConcurrent,
        onChange: () => this.updateDebugOverlay(),
      });
      this.latestRankings = [];
      this.scrollState = this.scrollTracker.getState();
      this.cursorState = this.cursorTracker.getState();
      this.debugEnabled = this.shouldEnableDebug();
      this.debugPanel = null;
      this.debugBody = null;
      this.evaluateFrame = 0;
      this.debugToggleKey = "P";

      this.scrollTracker.subscribe((state) => {
        this.scrollState = state;
        this.scheduleEvaluate("scroll");
      });

      this.cursorTracker.subscribe((state) => {
        this.cursorState = state;
        this.scheduleEvaluate("cursor");
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.preloadQueue.cancelBelowScore(1);
          return;
        }

        this.scheduleEvaluate("visibility");
      });

      window.addEventListener("pageshow", () => {
        this.scheduleEvaluate("pageshow");
      });

      this.bindDebugToggle();
      this.renderDebugOverlay();
    }

    buildPerformanceProfile() {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection ||
        null;
      const effectiveType = connection?.effectiveType || "";
      const saveData = Boolean(connection?.saveData);
      const lowMemory = Number(navigator.deviceMemory || 4) <= 2;
      const slowNetwork = /(^2g$|slow-2g|3g)/i.test(effectiveType);
      const reducedMode = slowNetwork || saveData || lowMemory;

      return {
        reducedMode,
        maxConcurrent: reducedMode ? 1 : 3,
      };
    }

    shouldEnableDebug() {
      try {
        if (new URLSearchParams(window.location.search).get("preloadDebug") === "1") {
          window.localStorage.setItem(DEBUG_STORAGE_KEY, "true");
          return true;
        }

        return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "true";
      } catch (error) {
        return false;
      }
    }

    bindDebugToggle() {
      document.addEventListener("keydown", (event) => {
        if (!event.shiftKey || event.key.toUpperCase() !== this.debugToggleKey) {
          return;
        }

        this.debugEnabled = !this.debugEnabled;

        try {
          window.localStorage.setItem(DEBUG_STORAGE_KEY, String(this.debugEnabled));
        } catch (error) {
          // Ignore storage failures.
        }

        this.renderDebugOverlay();
      });
    }

    renderDebugOverlay() {
      if (this.debugPanel) {
        this.debugPanel.remove();
        this.debugPanel = null;
        this.debugBody = null;
      }

      if (!this.debugEnabled) {
        return;
      }

      const panel = document.createElement("aside");
      panel.className = "predictive-debug-panel";
      panel.innerHTML = `
        <div class="predictive-debug-header">
          <strong>Predictive preload</strong>
          <span>Shift+P</span>
        </div>
        <div class="predictive-debug-body"></div>
      `;

      document.body.append(panel);
      this.debugPanel = panel;
      this.debugBody = panel.querySelector(".predictive-debug-body");
      this.updateDebugOverlay();
    }

    updateDebugOverlay() {
      if (!this.debugEnabled || !this.debugBody) {
        return;
      }

      const topTargets = this.latestRankings.slice(0, 5);
      const activeTasks = this.preloadQueue.getActiveTasks();
      const queuedTasks = this.preloadQueue.queue.slice(0, 4);
      const sessionPath = this.sessionTracker.getPath();

      this.debugBody.innerHTML = `
        <section>
          <p><strong>Scroll</strong> ${this.scrollState.direction} · ${this.scrollState.averageVelocity.toFixed(2)} px/ms</p>
          <p><strong>Cursor</strong> ${this.cursorState.averageSpeed?.toFixed(2) || "0.00"} px/ms</p>
          <p><strong>Mode</strong> ${this.performanceProfile.reducedMode ? "reduced" : "full"}</p>
        </section>
        <section>
          <p><strong>Predicted targets</strong></p>
          <ul class="predictive-debug-list">
            ${
              topTargets.length
                ? topTargets
                    .map(
                      (target) => `
                        <li>
                          <span>${target.debugLabel}</span>
                          <span>${target.score.toFixed(2)}</span>
                        </li>
                      `
                    )
                    .join("")
                : "<li><span>No targets yet</span><span>0.00</span></li>"
            }
          </ul>
        </section>
        <section>
          <p><strong>Active preloads</strong></p>
          <ul class="predictive-debug-list">
            ${
              activeTasks.length
                ? activeTasks
                    .map(
                      (task) => `
                        <li>
                          <span>${task.type} → ${task.targetLabel}</span>
                          <span>${task.score.toFixed(2)}</span>
                        </li>
                      `
                    )
                    .join("")
                : "<li><span>Idle</span><span>0</span></li>"
            }
          </ul>
        </section>
        <section>
          <p><strong>Queued</strong></p>
          <ul class="predictive-debug-list">
            ${
              queuedTasks.length
                ? queuedTasks
                    .map(
                      (task) => `
                        <li>
                          <span>${task.type} → ${task.targetLabel}</span>
                          <span>${task.score.toFixed(2)}</span>
                        </li>
                      `
                    )
                    .join("")
                : "<li><span>None</span><span>0</span></li>"
            }
          </ul>
        </section>
        <section>
          <p><strong>Session path</strong></p>
          <div class="predictive-debug-path">${sessionPath.join(" → ") || "/"}</div>
        </section>
      `;
    }

    scheduleEvaluate() {
      window.cancelAnimationFrame(this.evaluateFrame);
      this.evaluateFrame = window.requestAnimationFrame(() => {
        this.evaluate();
      });
    }

    registerPreloadTarget(element, options = {}) {
      if (!element || !options.id) {
        return;
      }

      const normalizedTarget = {
        id: options.id,
        element,
        href: options.href || element.getAttribute?.("href") || "",
        routePath: normalizePath(options.href || element.getAttribute?.("href") || ""),
        assets: Array.isArray(options.assets) ? options.assets : [],
        category: options.category || "",
        tags: uniqueList(options.tags || []),
        basePriority: clamp(options.basePriority ?? 0.5),
        debugLabel:
          options.debugLabel ||
          element.getAttribute?.("aria-label") ||
          element.textContent?.trim() ||
          options.id,
      };

      this.targets.set(element, normalizedTarget);
      this.behaviorStore.rememberMeta(normalizedTarget.id, normalizedTarget);

      this.cursorTracker.registerElement(element, {
        id: normalizedTarget.id,
        onHoverDwell: () => {
          this.behaviorStore.recordInteraction(
            normalizedTarget.id,
            2,
            "hover",
            normalizedTarget
          );
          this.sessionTracker.recordInteraction(normalizedTarget.id, normalizedTarget);
          this.scheduleEvaluate();
        },
      });

      this.viewportPredictor.registerTarget(element, {
        id: normalizedTarget.id,
        onViewportReward: () => {
          this.behaviorStore.recordInteraction(
            normalizedTarget.id,
            3,
            "viewport",
            normalizedTarget
          );
          this.scheduleEvaluate();
        },
      });

      element.addEventListener("click", () => {
        this.behaviorStore.recordInteraction(
          normalizedTarget.id,
          5,
          "click",
          normalizedTarget
        );
        this.sessionTracker.recordInteraction(normalizedTarget.id, normalizedTarget);

        if (
          normalizedTarget.routePath &&
          normalizedTarget.routePath !== this.sessionTracker.currentPath
        ) {
          this.behaviorStore.recordTransition(
            this.sessionTracker.currentPath,
            normalizedTarget.routePath,
            1.25
          );
        }
      });

      this.scheduleEvaluate();
    }

    buildTargetContext(target) {
      const viewportState = this.viewportPredictor.getViewportState(target.element);
      const historicalScore = this.behaviorStore.getHistoricalScore(target.id);
      const similarityScore = this.behaviorStore.getSimilarityScore(target);
      const sessionRelevance = clamp(
        Math.max(this.sessionTracker.getSessionRelevance(target), similarityScore * 0.9)
      );

      return {
        viewportDistanceScore: viewportState.distanceScore,
        viewportState,
        scrollState: this.scrollState,
        cursorIntentScore: this.cursorTracker.getIntentScore(target.element),
        historicalScore,
        sessionRelevance,
      };
    }

    evaluate() {
      const targetList = Array.from(this.targets.values()).filter(
        (target) => target.element?.isConnected
      );

      if (!targetList.length) {
        return;
      }

      this.latestRankings = this.rankingEngine.rankTargets(
        targetList,
        this.buildTargetContext.bind(this)
      );

      const fastScroll = this.scrollState.averageVelocity > 1.5;
      const veryFastScroll = this.scrollState.averageVelocity > 2.2;

      if (veryFastScroll) {
        this.preloadQueue.cancelBelowScore(0.75);
      }

      this.preloadQueue.updateRankings(this.latestRankings, {
        pauseNewTasks: fastScroll,
      });
      this.updateDebugOverlay();
    }

    snapshot() {
      return {
        scroll: this.scrollState,
        cursor: this.cursorState,
        rankings: this.latestRankings,
        behavior: this.behaviorStore.snapshot(),
        session: this.sessionTracker.snapshot(),
        activePreloads: this.preloadQueue.getActiveTasks(),
      };
    }
  }

  window.createPredictivePreloadingSystem = function (options = {}) {
    return new PredictivePreloadSystem(options);
  };
})();
