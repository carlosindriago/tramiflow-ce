import type { NextConfig } from "next";

const cspHeader = `
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https://*.supabase.co;
font-src 'self' data:;
object-src 'none';
base-uri 'none';
form-action 'self' https://*.supabase.co https://accounts.google.com;
frame-ancestors 'none';
connect-src 'self' https://*.supabase.co https://api.resend.com;
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: cspHeader },
]

const nextConfig: NextConfig = {
  transpilePackages: ['@carlosindriago/ui', '@carlosindriago/core', '@carlosindriago/database', '@carlosindriago/pdf-kit'],
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
