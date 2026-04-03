import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const storage = {
  async get(key) {
    if (isNative) {
      const result = await Preferences.get({ key });
      return result.value;
    }
    return localStorage.getItem(key);
  },

  async set(key, value) {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async remove(key) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear() {
    if (isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }
};

export default storage;
