/*src/lib/image-placeholder.ts*/
export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#111827" offset="20%" />
      <stop stop-color="#1f2937" offset="50%" />
      <stop stop-color="#111827" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#111827" />
  <rect width="${w}" height="${h}" fill="url(#g)" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export const shimmerDataUrl = (w: number, h: number) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;