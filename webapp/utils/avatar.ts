// utils/avatar.ts

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateAvatar(seed: string, size = 120): string {
  const h = hashStr(seed || "user");
  const rand = seededRand(h);

  const palette = [
    ["#0d6efd", "#6ea8fe", "#cfe2ff"],
    ["#00a884", "#25d366", "#d9fdd3"],
    ["#6f42c1", "#a98eda", "#e9d8fd"],
    ["#fd7e14", "#feb272", "#ffe5d0"],
    ["#d63384", "#f08bbc", "#fce4f0"],
    ["#20c997", "#79dfc8", "#d2f4ea"],
  ][Math.floor(rand() * 6)];

  const bg = palette[2];
  const mid = palette[0];
  const acc = palette[1];
  const cx = size / 2;
  const cy = size / 2;

  const polygon = (n: number, r: number, ox: number, oy: number, rot: number) => {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rot;
      return `${(ox + Math.cos(a) * r).toFixed(1)},${(oy + Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
  };

  const r1 = 30 + rand() * 20;
  const r2 = 18 + rand() * 15;
  const r3 = 10 + rand() * 10;
  const n1 = Math.floor(rand() * 3) + 3;
  const n2 = Math.floor(rand() * 3) + 4;
  const rot1 = rand() * Math.PI;
  const rot2 = rand() * Math.PI;
  const ox2 = cx + (rand() - 0.5) * 20;
  const oy2 = cy + (rand() - 0.5) * 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>
    <polygon points="${polygon(n1, r1, cx, cy, rot1)}" fill="${mid}" opacity="0.85"/>
    <polygon points="${polygon(n2, r2, ox2, oy2, rot2)}" fill="${acc}" opacity="0.9"/>
    <circle cx="${cx + (rand() - 0.5) * 24}" cy="${cy + (rand() - 0.5) * 24}" r="${r3}" fill="${mid}" opacity="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="${r3 * 0.55}" fill="white" opacity="0.5"/>
  </svg>`;
}

export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}