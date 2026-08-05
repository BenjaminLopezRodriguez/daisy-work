import "server-only";

import { eq } from "drizzle-orm";

import { escapeHtml } from "@/lib/escape-html";
import { db } from "@/server/db";
import { notifications, users } from "@/server/db/schema";
import { env } from "@/env";

export type NotifyInput = {
  /** Recipient. Skipped silently when it is the actor themselves. */
  userId: string;
  title: string;
  body?: string;
  /** App-relative path the notification links to. */
  href: string;
};

function baseUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

// ponytail: one fetch instead of the resend SDK. Swap it in if we ever need
// batching, attachments, or webhooks.
async function sendEmail(to: string, title: string, body: string, url: string) {
  if (!env.RESEND_API_KEY || !env.RESEND_EMAIL_DOMAIN) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Daisy.work <notifications@${env.RESEND_EMAIL_DOMAIN}>`,
      to,
      subject: title,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">
  <h2 style="margin:0 0 8px;font-size:18px">${escapeHtml(title)}</h2>
  ${body ? `<p style="margin:0 0 16px;color:#444">${escapeHtml(body)}</p>` : ""}
  <p style="margin:0"><a href="${url}" style="color:#111">Open in Daisy.work</a></p>
</div>`,
      text: `${title}\n\n${body}\n\n${url}`,
    }),
  });

  if (!res.ok) {
    console.error("[notify] resend failed", res.status, await res.text());
  }
}

/**
 * Record a notification and email it. Never throws — a failed notification must
 * not roll back the action that produced it.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const body = input.body ?? "";
  try {
    await db.insert(notifications).values({
      userId: input.userId,
      title: input.title,
      body,
      href: input.href,
    });

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (user?.email) {
      await sendEmail(
        user.email,
        input.title,
        body,
        `${baseUrl()}${input.href}`,
      );
    }
  } catch (error) {
    console.error("[notify] failed", error);
  }
}
