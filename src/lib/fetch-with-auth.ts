import { getAdminKey } from "@/lib/admin-key";

export function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return fetch(input, init);
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${adminKey}`);

  return fetch(input, { ...init, headers });
}
