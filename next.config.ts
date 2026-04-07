/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'instagram.com',
      },
      {
        protocol: 'https',
        hostname: 'cdninstagram.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/static/picture/logo_jg2.png',
        destination: '/logo.png',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
