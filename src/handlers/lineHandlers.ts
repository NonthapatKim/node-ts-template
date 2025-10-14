import * as line from "@line/bot-sdk";
import { MessageEvent, WebhookEvent } from "@line/bot-sdk";
import { client } from "../config/line";

import { handleFAQCommand, handleFAQReply } from "./faqHandler";

async function handleMessage(event: MessageEvent) {
  if (event.message.type === "text") {
    const text = event.message.text.trim();
    console.log("📩 User sent text:", event.message.text);

    if (text === "COSCI-FAQ") {
      await handleFAQCommand(event.replyToken);
      return;
    } else if (text.startsWith("COSCI-FAQ >")) {
      const query = text.replace("COSCI-FAQ >", "").trim();
      await handleFAQReply(event.replyToken, query);
    }
  }
}

// handler หลัก
export async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case "message":
      return handleMessage(event);
    case "follow":
      console.log("🙌 User followed the bot:", event.source.userId);
      break;
    case "unfollow":
      console.log("👋 User unfollowed the bot:", event.source.userId);
      break;
    default:
      console.log("⚠️ Unhandled event type:", event.type);
  }
}
