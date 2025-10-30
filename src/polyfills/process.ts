// This ensures process.nextTick is available in all module contexts
import process from 'process/browser';

// Define nextTick implementation
const nextTickImpl = function(callback: Function, ...args: any[]) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }
  Promise.resolve().then(() => callback(...args));
};

// Ensure process has nextTick
if (!process.nextTick) {
  process.nextTick = nextTickImpl;
}

// Also set it on window and globalThis for good measure
if (typeof window !== 'undefined') {
  (window as any).process = process;
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).process = process;
}

// Make nextTick immutable on the process object itself
Object.defineProperty(process, 'nextTick', {
  value: nextTickImpl,
  writable: false,
  configurable: false,
  enumerable: true
});

export default process;
