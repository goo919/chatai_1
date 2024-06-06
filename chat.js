const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
let userName = '';  // 사용자의 이름을 저장할 변수
let isUserNameSet = false; // 사용자 이름이 설정되었는지 확인하는 변수

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(message, retries = 5, delay = 5000) {
    console.log('Sending message:', message);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch('/api/fetch-openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                console.error('HTTP error! status:', response.status);
                if (response.status === 429 && attempt < retries) {
                    console.log(`Retrying after ${delay}ms... (attempt ${attempt} of ${retries})`);
                    await sleep(delay);
                    delay *= 2; // 지수적 백오프: 지연 시간을 두 배로 증가
                    continue;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);
            return data.response;
        } catch (error) {
            if (attempt === retries) {
                console.error('Error during fetch:', error);
                return 'Error: Could not get response from AI.';
            }
        }
    }
}

function typeWriter(element, text, delay = 25) {
    element.innerHTML = ''; // 기존 텍스트 초기화
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, delay);
        }
    }
    typing();
}

sendButton.addEventListener('click', async () => {
    const message = userInput.value;
    console.log('User clicked send with message:', message);
    if (message.trim() === "") return;

    const userMessage = document.createElement('p');
    userMessage.classList.add('user');
    userMessage.textContent = `You: ${message}`;
    chatBox.appendChild(userMessage);
    userInput.value = '';

    if (!isUserNameSet) {
        if (message.trim().toLowerCase() === "싫어" || message.trim().toLowerCase() === "안알려줄래") {
            userName = ''; 
            isUserNameSet = true; 
        } else {
            userName = message.replace(/[^\w\s]/gi, '').split(" ")[0]; 
            isUserNameSet = true;
        }
        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>김건희: 반가워${userName ? ", " + userName : ""}... 무엇을 도와줄까...</span>`;
        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    const aiResponse = await sendMessage(message);

    const aiMessage = document.createElement('p');
    aiMessage.classList.add('ai');
    const aiMessageContent = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span></span>`;
    aiMessage.innerHTML = aiMessageContent;
    chatBox.appendChild(aiMessage);

    chatBox.scrollTop = chatBox.scrollHeight;

    typeWriter(aiMessage.querySelector('span'), `김건희: ${aiResponse}`, 25);
});

document.addEventListener('DOMContentLoaded', () => {
    const aiMessage = document.createElement('p');
    aiMessage.classList.add('ai');
    aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>김건희: 안녕... 나는 앞을 보지 못해... 너의 이름을 알려줄 수 있니...</span>`;
    chatBox.appendChild(aiMessage);
});
