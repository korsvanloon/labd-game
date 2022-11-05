/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    appDir: true,
    swcMinify: true,
  },
  images: {
    domains: ['labdigital.nl'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

module.exports = config
