/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.100.17', '192.168.1.47', '10.36.120.223'],

  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://117.2.126.123:5050/api/v1';
    const productionHost = { type: 'host', value: 'apagfe\\.vercel\\.app' };
    return [
      {
        source: '/api/v1/:path*',
        has: [productionHost],
        destination: 'https://apag-be-da4e.onrender.com/api/v1/:path*',
      },
      {
        source: '/api/v1/:path*',
        missing: [productionHost],
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
