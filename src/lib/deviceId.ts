const KEY = "device_id";

// Stand-in for a real user id until auth is added. Lets the future
// supabaseProgressRepository scope rows per-device without a login flow.
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
