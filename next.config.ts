import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark these packages as external for server components
  // This prevents Next.js from trying to bundle them for server-side rendering
  serverExternalPackages: ['dictionary-de', 'dictionary-en', 'nspell'],
  
  // Turbopack configuration (replaces webpack config in Next.js 16)
  turbopack: {
    // Resolve aliases for browser environment
    // These Node.js built-ins should not be bundled for client-side code
    resolveAlias: {
      // Alias Node.js built-ins to empty module for browser
      fs: { browser: './app/empty-module.ts' },
      path: { browser: './app/empty-module.ts' },
      crypto: { browser: './app/empty-module.ts' },
      stream: { browser: './app/empty-module.ts' },
      util: { browser: './app/empty-module.ts' },
      buffer: { browser: './app/empty-module.ts' },
    },
  },
};

export default nextConfig;
