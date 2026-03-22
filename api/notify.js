module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        return res.status(500).json({ error: 'Telegram credentials not configured on server.' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'No message provided.' });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(502).json({ error: 'Telegram API error', details: err });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
}
