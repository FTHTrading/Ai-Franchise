/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aaos/ui', '@aaos/types'],
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3002'],
    },
  },
};

module.exports = nextConfig;
