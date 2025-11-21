// utils/slack.ts
import axios from "axios";

type Blocks = any;

/**
 * sendSlackMessage(text, blocks, webhookOrEnvKey)
 *
 * webhookOrEnvKey:
 *  - if it's a full URL (starts with "https://") it's used directly
 *  - otherwise it's treated as an env key (e.g. "SLACK_WEBHOOK_URL_HR") and resolved from process.env
 *  - if omitted, falls back to process.env.SLACK_WEBHOOK_URL_ACC
 */
export async function sendSlackMessage(
  text: string,
  blocks?: Blocks,
  webhookOrEnvKey?: string
): Promise<boolean> {
  // pick webhook
  let webhook = "";

  if (webhookOrEnvKey) {
    if (typeof webhookOrEnvKey === "string" && webhookOrEnvKey.startsWith("https://")) {
      webhook = webhookOrEnvKey;
    } else {
      webhook = process.env[webhookOrEnvKey as string] || "";
    }
  }

  if (!webhook) {
    // fallback
    webhook = process.env.SLACK_WEBHOOK_URL_ACC || "";
  }

  if (!webhook) {
    console.error("No Slack webhook URL available. Provide SLACK_WEBHOOK_URL_ACC or pass a webhook key.");
    return false;
  }

  const payload: any = { text };
  if (blocks) payload.blocks = blocks;

  try {
    await axios.post(webhook, payload, { headers: { "Content-Type": "application/json" } });
    return true;
  } catch (err: any) {
    console.error("Error sending Slack message:", err?.response?.data ?? err.message ?? err);
    return false;
  }
}
