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

// AGGRESSIVELY inject into window and globalThis with non-writable descriptors
// This ensures all bundles (including Web3Auth) use the same process instance
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'process', {
      value: process,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    // If already defined, use fallback assignment
    (window as any).process = process;
  }
}

if (typeof globalThis !== 'undefined') {
  try {
    Object.defineProperty(globalThis, 'process', {
      value: process,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    // If already defined, use fallback assignment
    (globalThis as any).process = process;
  }
}

// Only make nextTick immutable if it's configurable or doesn't exist yet
const descriptor = Object.getOwnPropertyDescriptor(process, 'nextTick');
if (!descriptor || descriptor.configurable) {
  try {
    Object.defineProperty(process, 'nextTick', {
      value: process.nextTick || nextTickImpl,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    // If we can't make it immutable, that's okay - it's already there
    console.debug('process.nextTick already defined and non-configurable');
  }
}

export default process;
