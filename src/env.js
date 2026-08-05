import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    DATABASE_URL_UNPOOLED: z.string().url().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    DEEPSEEK_BASE_URL: z.string().url().optional(),
    DEEPSEEK_MODEL: z.string().optional(),
    UPLOADTHING_TOKEN: z.string().min(1),
    UPLOADTHING_APP_ID: z.string().optional(),
    /** Both unset = notifications stay in-app only. */
    RESEND_API_KEY: z.string().optional(),
    RESEND_EMAIL_DOMAIN: z.string().optional(),
    /** Payments are optional at build time; the router refuses at call time. */
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    /** Platform cut in basis points. 1000 = 10%. Unset falls back to 10%. */
    PLATFORM_FEE_BPS: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_DOMAIN: process.env.RESEND_EMAIL_DOMAIN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    PLATFORM_FEE_BPS: process.env.PLATFORM_FEE_BPS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
