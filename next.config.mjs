/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "sonotradesdemo.wearedev.team",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://sonotradesdemo.wearedev.team/api/:path*',
      },
      {
        source: '/freeipapi/:path*',
        destination: 'https://freeipapi.com/:path*',
      },
    ];
  },
  // <<< ADD THIS

};

export default nextConfig;
