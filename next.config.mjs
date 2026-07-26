/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://10.36.120.154:5050/api/v1';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
