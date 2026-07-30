const { Redis } = require("@upstash/redis");

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        
        // Telegram sends callback queries when inline buttons are pressed
        if (body.callback_query) {
            const callbackQuery = body.callback_query;
            const data = callbackQuery.data; // e.g., "approve_12345" or "reject_12345"
            const message = callbackQuery.message;
            
            // Extract action and attemptId
            const [action, attemptId] = data.split("_");

            if (attemptId && (action === "approve" || action === "reject")) {
                const redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL || "",
                    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
                });

                // Update status in Redis
                const newStatus = action === "approve" ? "approved" : "rejected";
                await redis.set(`attempt:${attemptId}`, newStatus, { ex: 300 });

                // Update the Telegram message to show it was handled
                const botToken = process.env.TELEGRAM_BOT_TOKEN;
                if (botToken && message) {
                    const statusEmoji = action === "approve" ? "✅ APPROVED" : "❌ REJECTED";
                    const updatedText = `${message.text}\n\n*STATUS:* ${statusEmoji}`;
                    
                    const editUrl = `https://api.telegram.org/bot${botToken}/editMessageText`;
                    await fetch(editUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: message.chat.id,
                            message_id: message.message_id,
                            text: updatedText,
                            parse_mode: "Markdown"
                        })
                    });
                }
            }
            
            // Answer the callback query to remove the loading state on the button
            const answerUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
            await fetch(answerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQuery.id })
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error) {
        console.error("Webhook Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
