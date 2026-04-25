import "@testing-library/jest-dom/vitest";

// jsdom does not implement ResizeObserver, which @radix-ui/react-slider
// uses internally. A minimal noop polyfill is enough for unit tests.
class ResizeObserverPolyfill {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

// jsdom does not implement Element.prototype.hasPointerCapture, which Radix
// primitives may call. Provide a noop so it doesn't throw on render.
if (typeof Element.prototype.hasPointerCapture !== "function") {
  Element.prototype.hasPointerCapture = () => false;
}
if (typeof Element.prototype.setPointerCapture !== "function") {
  Element.prototype.setPointerCapture = () => undefined;
}
if (typeof Element.prototype.releasePointerCapture !== "function") {
  Element.prototype.releasePointerCapture = () => undefined;
}
