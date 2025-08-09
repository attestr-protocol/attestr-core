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
  
  // Security headers including CSP
  async headers() {
    // Always check if we're in development mode - even if NODE_ENV is not set
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    console.log(`[CSP] Environment: ${process.env.NODE_ENV || 'undefined'}, isDevelopment: ${isDevelopment}`);
    
    // Build script sources - always allow unsafe-eval for Web3 libraries that need it
    const scriptSrcParts = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for ThirdWeb, Arweave, and other Web3 SDKs
      "https://cdn.jsdelivr.net",
      "https://unpkg.com", 
      "https://verify.walletconnect.com",
      "https://registry.walletconnect.com",
      "https://*.thirdweb.com",
      // Add specific domains for Web3 libraries
      "https://gateway.thirdweb.com",
      "https://pay.thirdweb.com"
    ];

    const connectSrcParts = [
      "'self'",
      "https:",
      "wss:",
      "ws:",
      "https://*.thirdweb.com",
      "https://*.walletconnect.com",
      "https://*.walletconnect.org", 
      "https://*.infura.io",
      "https://*.alchemy.com",
      "https://*.ar.io",
      "https://arweave.net",
      "https://gateway.thirdweb.com",
      "https://pay.thirdweb.com",
      // Add RPC endpoints
      "https://polygon-amoy.g.alchemy.com",
      "https://polygon-mumbai.g.alchemy.com"
    ];

    return [
      {
        // Apply CSP to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrcParts.join(' ')}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              `connect-src ${connectSrcParts.join(' ')}`,
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              isDevelopment ? "" : "upgrade-insecure-requests"
            ].filter(Boolean).join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
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
