// Simple process polyfill with nextTick
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

// Simple global assignments
if (typeof window !== 'undefined') {
  (window as any).process = process;
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).process = process;
}

export default process;
