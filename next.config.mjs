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
        hostname: "upload.wikimedia.org",  // Add this line
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",  // Add this line
      },
      {
        protocol: "http",
        hostname: "localhost",  // Add this line
        port: "3001",
      },
      {
        protocol:"https",
        hostname: "sonotradesdemo.wearedev.team",
      }
    ],
  },
  // Fix for camelcase module resolution in @pythnetwork/client
  transpilePackages: ['@pythnetwork/client', '@coral-xyz/anchor'],
  webpack: (config, { isServer }) => {
    // Add alias for camelcase to help webpack resolve it
    config.resolve.alias = {
      ...config.resolve.alias,
      'camelcase': 'camelcase',
    };
    
    // Handle Node.js modules in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "zlib": false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
