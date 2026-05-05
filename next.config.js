/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  webpack: (config, { webpack }) => {
    // yahoo-finance2 v2.14 is ESM-only and its createYahooFinance.js imports
    // Deno/test-only deps (fetchCache.js) that don't exist in a Node/webpack build.
    // IgnorePlugin resolves them to an empty module so the bundle succeeds.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /fetchCache/,
        contextRegExp: /yahoo-finance2/,
      })
    )
    return config
  },
}
module.exports = nextConfig
