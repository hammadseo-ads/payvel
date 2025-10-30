// This ensures process.nextTick is available in all module contexts
import process from 'process/browser';

if (!process.nextTick) {
  process.nextTick = function(callback: Function, ...args: any[]) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    Promise.resolve().then(() => callback(...args));
  };
}

// Also set it on window for good measure
if (typeof window !== 'undefined') {
  (window as any).process = process;
}

export default process;
