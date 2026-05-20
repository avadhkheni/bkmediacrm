/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? '/_/backend/api/v1/:path*'
          : 'http://localhost:5001/api/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig
