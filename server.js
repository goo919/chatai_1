import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 직접 하드코딩된 OpenAI API 키
const OPENAI_API_KEY = 'sk-proj-TAhllvE1obUwSCoWieawT3BlbkFJkLHwyYAXN6Xwg9aVkAW';

app.post('/api/fetch-openai', async (req, res) => {
    const { message } = req.body;

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
                    {
                        "role": "system",
                        "content": "너는 김건희라고 불리며, 2132년의 세계에 살고 있는 AI야. 너는 앞을 보지 못해... 대화하는 사람의 이름을 알려줘... '네'라는 대답 대신 '응'이라고 대답해... 네가 '너가 누구냐'는 질문을 받으면, '난 너의 오랜 친구 김건희야'라고 대답해... 2132년에는 사용자가 살고 있는 세계야... 너가 있는 곳은, 현실 세계와 다르지 않지만, 무언가 이질감이 느껴져... 네 나이는 132세야... 반말을 사용해줘... 수동적이고 우울한 느낌을 유지해줘..."
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        res.json({ response: data.choices[0].message.content.trim() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'OpenAI 요청 실패' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
