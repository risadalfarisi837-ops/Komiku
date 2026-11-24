import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Tidak mengirim source map asli ke publik: kode di browser tetap bisa dibaca (itu wajar untuk web),
  // tapi tidak ada peta yang memudahkan orang membaca ulang file/baris kode sumber aslinya.
  productionBrowserSourceMaps: false,
  // Buang semua console.log dari kode produksi (console.error/warn tetap ada untuk error asli).
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Sembunyikan header "X-Powered-By: Next.js" supaya tidak membocorkan info framework.
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'komikindo.tv',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'komikindo.ch',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploads.mangadex.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      }
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
