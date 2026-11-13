// Görsel optimizasyonuna izin verilen alan adları (virgülle ayrılmış).
// Listede olmayan adreslerdeki görseller optimize edilmeden, olduğu gibi gösterilir;
// böylece görsel sunucumuz herkesin her adresi için açık bir proxy'ye dönüşmez.
export const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'images.unsplash.com')
  .split(',').map((h) => h.trim()).filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https', hostname })),
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
