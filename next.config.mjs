/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['html5-qrcode'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'html-to-image',
      'framer-motion',
      'papaparse',
      '@supabase/supabase-js',
      'qrcode.react',
      'exceljs'
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
