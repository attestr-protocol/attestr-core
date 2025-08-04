/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. Only enable this if you're sure!
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
  },
  
  // Experimental features
  experimental: {
    // Enable app directory (if planning to migrate to App Router in future)
    // appDir: false,
    
    // Optimize bundle size
    optimizeCss: true,
  },
};

export default nextConfig;
