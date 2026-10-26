function readTokenCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("elevatex_csrf="))
    ?.slice("elevatex_csrf=".length);
  return value ? decodeURIComponent(value) : undefined;
}

export async function csrfHeaders(): Promise<Record<string, string>> {
  let token = readTokenCookie();
  if (!token) {
    const response = await fetch("/api/v1/auth/csrf", { credentials: "include" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.token !== "string") {
      throw new Error("Could not establish a CSRF token. Refresh and try again.");
    }
    token = result.token;
  }
  if (!token) throw new Error("CSRF token is unavailable; refresh and try again.");
  return { "X-CSRF-Token": token };
}
