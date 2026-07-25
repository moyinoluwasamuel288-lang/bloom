/**
 * localStorage can throw (not just return null) in privacy modes, sandboxed
 * iframes, or with storage disabled by the browser/user. Every read/write in
 * the app should go through here so one blocked call can't silently break
 * an entire screen's event bindings.
 */
export const SafeStorage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }
};
