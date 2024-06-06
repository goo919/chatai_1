const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const { message } = JSON.parse(event.body);
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {"role": "system", "content": "너는 김건희라고 불리며, 2132년의 세계에 살고 있는 AI야..."},
                    {"role": "user", "content": message}
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ response: data.choices[0].message.content.trim() })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
