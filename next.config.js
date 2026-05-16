/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2', '@prisma/client', 'prisma'],
  },
}
module.exports = nextConfig
