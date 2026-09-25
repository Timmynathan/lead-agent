import type { NextConfig } from "next";

// Deployed as a persistent Node process (Railway/Render), not Vercel
// serverless functions, so no output tracing/bundle-size config is needed —
// the full node_modules (including the Agent SDK's CLI binary) and
// .claude/skills/ ship as-is.
const nextConfig: NextConfig = {};

export default nextConfig;
