(function () {
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const normalizeVector = (x, y) => {
    const magnitude = Math.hypot(x, y) || 1;
    return {
      x: x / magnitude,
      y: y / magnitude,
    };
  };

  class CursorTracker {
    constructor(options = {}) {
      this.sampleSize = Math.max(4, options.sampleSize ?? 6);
      this.dwellMs = Math.max(100, options.dwellMs ?? 160);
      this.listeners = new Set();
      this.samples = [];
      this.registrations = new WeakMap();
      this.state = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        dx: 0,
        dy: 0,
        speed: 0,
        averageSpeed: 0,
      };
      this.lastTime = performance.now();
      this.lastPoint = {
        x: this.state.x,
        y: this.state.y,
      };
      this.pointerAvailable =
        window.matchMedia?.("(pointer: fine)").matches ??
        !("ontouchstart" in window);

      if (!this.pointerAvailable) {
        return;
      }

      this.handleMove = this.handleMove.bind(this);
      this.handleLeave = this.handleLeave.bind(this);

      window.addEventListener("mousemove", this.handleMove, { passive: true });
      window.addEventListener("mouseleave", this.handleLeave, { passive: true });
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

    handleMove(event) {
      const now = performance.now();
      const deltaTime = Math.max(16, now - this.lastTime);
      const dx = event.clientX - this.lastPoint.x;
      const dy = event.clientY - this.lastPoint.y;
      const speed = Math.hypot(dx, dy) / deltaTime;

      this.samples.push(speed);

      if (this.samples.length > this.sampleSize) {
        this.samples.shift();
      }

      const averageSpeed =
        this.samples.reduce((total, sample) => total + sample, 0) /
        Math.max(1, this.samples.length);

      this.state = {
        x: event.clientX,
        y: event.clientY,
        dx,
        dy,
        speed,
        averageSpeed,
      };
      this.lastTime = now;
      this.lastPoint = {
        x: event.clientX,
        y: event.clientY,
      };
      this.emit();
    }

    handleLeave() {
      this.state = {
        ...this.state,
        dx: 0,
        dy: 0,
        speed: 0,
        averageSpeed: 0,
      };
      this.emit();
    }

    registerElement(element, options = {}) {
      if (!element || !this.pointerAvailable) {
        return;
      }

      const registration = {
        id: options.id || "",
        onHoverDwell: options.onHoverDwell,
        timer: 0,
        dwellFired: false,
      };

      const onEnter = () => {
        registration.dwellFired = false;
        window.clearTimeout(registration.timer);
        registration.timer = window.setTimeout(() => {
          if (registration.dwellFired) {
            return;
          }

          registration.dwellFired = true;

          if (typeof registration.onHoverDwell === "function") {
            registration.onHoverDwell(registration.id);
          }
        }, this.dwellMs);
      };

      const onLeave = () => {
        registration.dwellFired = false;
        window.clearTimeout(registration.timer);
      };

      registration.cleanup = () => {
        window.clearTimeout(registration.timer);
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("mouseleave", onLeave);
      };

      element.addEventListener("mouseenter", onEnter, { passive: true });
      element.addEventListener("mouseleave", onLeave, { passive: true });

      this.registrations.set(element, registration);
    }

    getIntentScore(element) {
      if (!element || !this.pointerAvailable) {
        return 0;
      }

      const rect = element.getBoundingClientRect();
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const toElement = {
        x: elementCenter.x - this.state.x,
        y: elementCenter.y - this.state.y,
      };
      const distance = Math.hypot(toElement.x, toElement.y);

      if (distance < 6) {
        return 1;
      }

      const cursorVector = normalizeVector(this.state.dx || 1, this.state.dy || 0);
      const targetVector = normalizeVector(toElement.x, toElement.y);
      const alignment =
        cursorVector.x * targetVector.x + cursorVector.y * targetVector.y;
      const angleScore = clamp((alignment - 0.35) / 0.65);
      const proximityScore = clamp(
        1 - distance / Math.max(window.innerWidth, window.innerHeight, 1)
      );
      const slowCursorBonus = clamp(1 - this.state.averageSpeed / 1.2);

      // Cursor intent is deliberately conservative: it only spikes when the
      // pointer is moving toward a target while slowing down near it.
      return clamp(
        (angleScore * 0.62 + proximityScore * 0.38) *
          Math.max(0.2, slowCursorBonus)
      );
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
      return { ...this.state, pointerAvailable: this.pointerAvailable };
    }
  }

  window.PredictivePreloadModules = window.PredictivePreloadModules || {};
  window.PredictivePreloadModules.CursorTracker = CursorTracker;
})();
