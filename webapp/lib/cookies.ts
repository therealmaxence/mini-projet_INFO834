type SameSite = "Strict" | "Lax" | "None";

type CookieOptions = {
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  sameSite?: SameSite;
};

const DEFAULT_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "Strict",
};

function shouldUseSecureCookies(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") {
    return;
  }

  const merged = {
    ...DEFAULT_OPTIONS,
    secure: shouldUseSecureCookies(),
    ...options,
  };
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (merged.path) {
    parts.push(`path=${merged.path}`);
  }

  if (merged.expires) {
    parts.push(`expires=${merged.expires.toUTCString()}`);
  }

  if (typeof merged.maxAge === "number") {
    parts.push(`Max-Age=${merged.maxAge}`);
  }

  if (merged.secure) {
    parts.push("Secure");
  }

  if (merged.sameSite) {
    parts.push(`SameSite=${merged.sameSite}`);
  }

  document.cookie = parts.join("; ");
}

export function clearCookie(name: string): void {
  setCookie(name, "", {
    expires: new Date(0),
    maxAge: 0,
  });
}

export function setAuthCookies(accessToken: string, expiresIn: number): void {
  const expirationDate = new Date(expiresIn * 1000);

  setCookie("access_token", accessToken, { expires: expirationDate });
  setCookie("expires_in", String(expiresIn), { expires: expirationDate });
}

export function getAccessToken(): string | null {
  return getCookie("access_token");
}