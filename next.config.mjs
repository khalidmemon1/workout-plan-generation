/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Lets the dev server (hot reload, etc.) be reached from your phone over
  // the LAN when testing at http://192.168.10.104:3000 — dev-only, has no
  // effect on the production build.
  allowedDevOrigins: ["192.168.10.104"],
}

export default nextConfig
