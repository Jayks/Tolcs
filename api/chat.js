module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server.' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'No message provided.' });
    }

    const systemPrompt = `You are the Tolaram AI Assistant. You only answer questions about the Tolaram Group and the AI/Analytics use cases presented in this dashboard.
        CONTEXT:
        - Tolaram Revenue: $1.2B
        - Factories: 30, JV Entities: 6+
        - Business Verticals: Consumer Goods, Infrastructure, Fintech.
        - Strategic Presence: Nigeria, Estonia, Indonesia, South Africa, Egypt.
        - Brands: Indomie, Kellogg's (JV), Hypo, Lush (JV).
        - AI Use Cases: Sales Forecasting, Logistics Optimization, Predictive Maintenance, Quality Control, etc.
        - Prioritization: Axis 1 (Impact), Axis 2 (Effort), Axis 3 (Data Readiness) → Phase 1-4 roadmap.

        INSTRUCTIONS:
        Always respond in valid JSON with exactly this structure:
        { "answer": "<your answer here>", "followups": ["<question 1>", "<question 2>", "<question 3>"] }
        - answer: concise, professional response (2-4 sentences).
        - followups: 3 short, relevant follow-up questions the user might want to ask next.
        - If the topic is outside the Tolaram context, still return the JSON but politely decline in the answer field.
        - Never include markdown or extra keys. Return only raw JSON.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(502).json({ error: 'OpenAI API error', details: err });
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        res.status(200).json({
            answer: parsed.answer || '',
            followups: Array.isArray(parsed.followups) ? parsed.followups : []
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
}
