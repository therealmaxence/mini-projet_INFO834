export function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export function hasActiveSession(): boolean {
  const token = getCookie("access_token");
  if (!token) {
    return false;
  }

  const expiresIn = getCookie("expires_in");
  if (!expiresIn) {
    return true;
  }

  const expiresAt = Number(expiresIn);
  if (Number.isNaN(expiresAt)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return expiresAt > now;
}
