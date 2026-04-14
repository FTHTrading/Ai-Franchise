/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aaos/ui'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

module.exports = nextConfig;
