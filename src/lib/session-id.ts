const KEY = "elite:sid";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      (globalThis.crypto?.randomUUID?.() ??
        `sid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
