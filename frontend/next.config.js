/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async rewrites() {
    return process.env.NODE_ENV === 'production' ? [] : [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:5001/api/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig
