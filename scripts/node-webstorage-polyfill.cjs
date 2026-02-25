/*
 * Node >=25 exposes a global `localStorage` accessor backed by an
 * experimental implementation that can be uninitialized (no getItem).
 * Some tooling (incl. Next dev overlay) may probe `localStorage` in a
 * non-browser context and crash with `localStorage.getItem is not a function`.
 *
 * This preload installs a small in-memory Storage-compatible polyfill
 * when the host-provided `localStorage` is missing or unusable.
 */

function createMemoryStorage() {
  const store = new Map();

  return {
    get length() {
      return store.size;
    },
    key(index) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    getItem(key) {
      const k = String(key);
      return store.has(k) ? store.get(k) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
}

function shouldPolyfill(name) {
  const desc = Object.getOwnPropertyDescriptor(globalThis, name);
  if (!desc) return false;

  // Avoid triggering Node's accessor getter (can warn / be uninitialized).
  if (typeof desc.get === 'function') return true;

  const value = desc.value;
  return !value || typeof value.getItem !== 'function' || typeof value.setItem !== 'function';
}

function install(name) {
  if (!shouldPolyfill(name)) return;

  try {
    // Ensure any accessor is removed first.
    delete globalThis[name];
  } catch {
    // ignore
  }

  try {
    Object.defineProperty(globalThis, name, {
      value: createMemoryStorage(),
      enumerable: true,
      configurable: true,
      writable: false,
    });
  } catch {
    // ignore
  }
}

install('localStorage');
