import axios from "axios";
import { dbChat } from "../config/database";

const LINE_ACCESS_TOKEN = process.env.LINE_CH_ACCESS_TOKEN;
const SERVER_BASE_URL = process.env.SERVER_BASE_URL;

export async function handleFAQCommand(replyToken: string) {
  try {
    const [rows]: any = await dbChat.query(`
      SELECT 
        faq.faq_id,
        faq.faq_category_id,
        faq_cate.name_thai AS faq_category_name_thai,
        faq.word
      FROM data_keyword faq
      INNER JOIN faq_categories faq_cate
        ON faq.faq_category_id = faq_cate.faq_category_id
      ORDER BY faq.faq_category_id, faq.faq_id;
    `);

    // Group by category
    const categories = rows.reduce((acc: any, faq: any) => {
      if (!acc[faq.faq_category_id]) {
        acc[faq.faq_category_id] = {
          name: faq.faq_category_name_thai,
          items: [],
        };
      }
      acc[faq.faq_category_id].items.push(faq);
      return acc;
    }, {});

    // แบ่งคำถามเป็นหลาย bubble ต่อหมวด (เช่น bubble ละ 5 คำถาม)
    const bubbles: any[] = [];
    Object.values(categories).forEach((cate: any, index) => {
      const chunkSize = 5; // 5 คำถามต่อ bubble
      for (let i = 0; i < cate.items.length; i += chunkSize) {
        bubbles.push({
          type: "bubble",
          hero: {
            type: "image",
            url: `https://cosci-assi-server.nonkim.site/public/images/${index + 1}.png`,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: cate.name,
                weight: "bold",
                size: "xl",
                wrap: true,
              },
              {
                type: "box",
                layout: "vertical",
                contents: cate.items
                  .slice(i, i + chunkSize)
                  .map((faq: any) => ({
                    type: "text",
                    text: faq.word,
                    margin: "md",
                    wrap: true,
                    color: "#42659A",
                    action: {
                      type: "message",
                      label: faq.word,
                      text: `COSCI-FAQ > ${faq.word}`,
                    },
                  })),
              },
            ],
          },
        });
      }
    });

    const carousel = {
      type: "carousel",
      contents: bubbles,
    };

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken,
        messages: [
          {
            type: "flex",
            altText: "คำถามที่พบบ่อย",
            contents: carousel,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        },
      }
    );
  } catch (err) {
    console.error("❌ handleFAQCommand error:", err);
    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken,
          messages: [
            {
              type: "text",
              text: "เกิดข้อผิดพลาดในการโหลดข้อมูล FAQ 😢",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          },
        }
      );
    } catch (error) {
      console.error("❌ Failed to send error message:", error);
    }
  }
}

export async function handleFAQReply(replyToken: string, userMessage: string) {
  try {
    const [rows]: any = await dbChat.query(
      `
      SELECT 
        ans_text1, ans_text2, ans_text3, ans_text4, ans_text5,
        ans_img1, ans_img2, ans_img3, ans_img4, ans_img5
      FROM data_keyword
      WHERE word = ?
      LIMIT 1
    `,
      [userMessage]
    );

    if (!rows || rows.length === 0) {
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken,
          messages: [
            {
              type: "text",
              text: "ขอโทษครับ ไม่พบคำตอบสำหรับคำถามนี้ 😢",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          },
        }
      );
      return;
    }

    const ans = rows[0];
    const messages: any[] = [];

    for (let i = 1; i <= 5; i++) {
      const textKey = `ans_text${i}`;
      const imgKey = `ans_img${i}`;

      if (ans[textKey]) {
        messages.push({
          type: "text",
          text: ans[textKey],
        });
      }

      if (ans[imgKey]) {
        const fullImageUrl = `${SERVER_BASE_URL}${ans[imgKey]}`;
        
        console.log(`[DEBUG] Constructed Full Image URL: ${fullImageUrl}`);

        messages.push({
          type: "image",
          originalContentUrl: fullImageUrl,
          previewImageUrl: fullImageUrl,
        });
      }
    }

    if (messages.length === 0) {
      messages.push({
        type: "text",
        text: "ขอโทษครับ คำตอบยังไม่ถูกบันทึก 😢",
      });
    }

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken,
        messages: messages.slice(0, 5),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        },
      }
    );
  } catch (err) {
    console.error("❌ handleFAQReply error:", err);
    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken,
          messages: [
            {
              type: "text",
              text: "เกิดข้อผิดพลาดในการดึงคำตอบ 😢",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          },
        }
      );
    } catch (error) {
      console.error("❌ Failed to send error message:", error);
    }
  }
}