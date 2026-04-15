const API_PORT = 3002;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();