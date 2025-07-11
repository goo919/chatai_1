document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    const chatBox = document.getElementById('chat-box');

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user';
    userMessageDiv.innerHTML = `<span class="text">You: ${userMessage}</span>`;
    chatBox.appendChild(userMessageDiv);

    userInput.value = ''; // Clear input field

    let GPTMSG = '...김건희는 아무 말도 하지 않았어.';
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-proj-TAhllvE1obUwSCoWieawT3BlbkFJkLHwyYAXN6Xwg9aVkAW'
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
                        "content": userMessage
                    }
                ],
                max_tokens: 150
            })
        });

        if (response.ok) {
            const data = await response.json();
            GPTMSG = data.choices[0].message.content.trim();
        } else {
            GPTMSG = '...응답이 오지 않았어.';
        }
    } catch (error) {
        console.error(error);
        GPTMSG = '...에러가 났어. 나중에 다시 시도해줘.';
    }

    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message ai';
    aiMessageDiv.innerHTML = `
        <img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희">
        <span class="text">김건희: ${GPTMSG}</span>
    `;
    chatBox.appendChild(aiMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
