// Minimal process polyfill - let Vite handle the rest
import process from 'process/browser';

// Add nextTick if missing
if (!process.nextTick) {
  process.nextTick = function(callback: Function, ...args: any[]) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    Promise.resolve().then(() => callback(...args));
  };
}

export default process;
