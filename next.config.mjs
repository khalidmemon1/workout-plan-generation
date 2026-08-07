/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Lets the dev server (hot reload, etc.) be reached from your phone over
  // the LAN when testing — dev-only, has no effect on the production build.
  // This IP changes whenever the PC reconnects to WiFi; if the phone can't
  // reach it, re-check with `ipconfig` and update this list.
  allowedDevOrigins: ["192.168.1.132"],
}

export default nextConfig
