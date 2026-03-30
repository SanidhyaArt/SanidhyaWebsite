(function () {
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  class ScrollTracker {
    constructor(options = {}) {
      this.sampleSize = Math.max(5, options.sampleSize ?? 8);
      this.listeners = new Set();
      this.samples = [];
      this.lastY = window.scrollY;
      this.lastTime = performance.now();
      this.idleTimer = 0;
      this.frameId = 0;
      this.state = {
        y: window.scrollY,
        deltaY: 0,
        direction: "still",
        velocity: 0,
        averageVelocity: 0,
      };

      this.handleScroll = this.handleScroll.bind(this);
      this.resetIdle = this.resetIdle.bind(this);

      window.addEventListener("scroll", this.handleScroll, { passive: true });
      window.addEventListener("resize", this.handleScroll, { passive: true });
    }

    emit() {
      this.listeners.forEach((listener) => {
        try {
          listener(this.getState());
        } catch (error) {
          return;
        }
      });
    }

    setIdleState() {
      this.state.velocity = 0;
      this.state.averageVelocity = 0;
      this.state.deltaY = 0;
      this.state.direction = "still";
      this.emit();
    }

    resetIdle() {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = window.setTimeout(() => {
        this.setIdleState();
      }, 140);
    }

    update(now = performance.now()) {
      const nextY = window.scrollY;
      const deltaY = nextY - this.lastY;
      const deltaTime = Math.max(16, now - this.lastTime);
      const velocity = Math.abs(deltaY) / deltaTime;

      this.lastY = nextY;
      this.lastTime = now;

      this.samples.push(velocity);

      if (this.samples.length > this.sampleSize) {
        this.samples.shift();
      }

      const averageVelocity =
        this.samples.reduce((total, sample) => total + sample, 0) /
        Math.max(1, this.samples.length);

      this.state = {
        y: nextY,
        deltaY,
        direction:
          deltaY > 0 ? "down" : deltaY < 0 ? "up" : this.state.direction || "still",
        velocity: clamp(velocity, 0, 10),
        averageVelocity: clamp(averageVelocity, 0, 10),
      };

      this.emit();
      this.resetIdle();
    }

    handleScroll() {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = window.requestAnimationFrame((timestamp) => {
        this.update(timestamp);
      });
    }

    subscribe(listener) {
      if (typeof listener !== "function") {
        return () => {};
      }

      this.listeners.add(listener);
      listener(this.getState());

      return () => {
        this.listeners.delete(listener);
      };
    }

    getState() {
      return { ...this.state };
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.ScrollTracker = ScrollTracker;
})();
