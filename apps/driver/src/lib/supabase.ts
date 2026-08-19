import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { config } from "./config";

/**
 * Session storage that works on both native and web. Native uses expo-secure-
 * store, chunked because SecureStore caps values at ~2KB and a Supabase session
 * (access + refresh + user) can exceed that. Web falls back to localStorage
 * (SecureStore is unavailable there), which is what the Expo-web build uses.
 */
const CHUNK = 1800;

const nativeStorage: SupportedStorage = {
  async getItem(key) {
    const countRaw = await SecureStore.getItemAsync(`${key}.n`);
    if (countRaw == null) return await SecureStore.getItemAsync(key);
    const count = Number(countRaw);
    let out = "";
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part == null) return null;
      out += part;
    }
    return out;
  },
  async setItem(key, value) {
    if (value.length <= CHUNK) {
      await SecureStore.deleteItemAsync(`${key}.n`);
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK);
    await SecureStore.setItemAsync(`${key}.n`, String(count));
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },
  async removeItem(key) {
    const countRaw = await SecureStore.getItemAsync(`${key}.n`);
    if (countRaw != null) {
      const count = Number(countRaw);
      for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`);
      await SecureStore.deleteItemAsync(`${key}.n`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const webStorage: SupportedStorage = {
  getItem: (key) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
  setItem: (key, value) => {
    globalThis.localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    globalThis.localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
