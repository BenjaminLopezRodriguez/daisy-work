/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Keep the Next.js circle indicator away from sidebar footer + mobile bottom nav.
  devIndicators: {
    position: "bottom-right",
  },
};

export default config;
