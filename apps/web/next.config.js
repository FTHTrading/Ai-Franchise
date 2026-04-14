/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aaos/ui', '@aaos/types'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

module.exports = nextConfig;
