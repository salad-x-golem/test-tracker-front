const ADMIN_KEY_STORAGE_KEY = "admin_key";

export function getAdminKey(): string {
  return window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) ?? "";
}

export function setAdminKey(key: string): void {
  if (key) {
    window.localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
  } else {
    window.localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
  }
}
