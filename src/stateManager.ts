/**
 * @deprecated Persistence has moved to src/repositories/AppRepository.ts.
 * These shims are retained only while Connection.ts and CubeView.ts are
 * being incrementally migrated.
 */
import { AppRepository } from "./repositories/AppRepository";

export const saveState = (key: string, state: unknown): void => {
  localStorage.setItem(key, JSON.stringify(state));
};

export const loadState = <T>(key: string, defaultValue: T): T => {
  const raw = localStorage.getItem(key);
  return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
};

/** @deprecated Use AppRepository.clearAll(). */
export const clearLocalStorage = (): void => {
  AppRepository.clearAll();
};
