const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
let userName = '';  // 사용자의 이름을 저장할 변수
let isUserNameSet = false; // 사용자 이름이 설정되었는지 확인하는 변수

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMessage(userMessage) {
    return new Promise((resolve, reject) => {
        if (!userMessage) return reject("No user message provided");

        let OPENAI_API_KEY = 'c2stcHJvai1ESE53R0xSZERhNVY4dmpoTmwyUVQzQmxia0ZKR0laMkpXNnJkVlUzTGViT3JUcjM='; // 실제 API 키로 교체

        const xhr = new XMLHttpRequest();
        const url = 'https://api.openai.com/v1/chat/completions';
        console.log(url);

        OPENAI_API_KEY = atob(OPENAI_API_KEY);

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${OPENAI_API_KEY}`);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const completionMessage = response.choices[0].message.content;
                    resolve(completionMessage);
                } else {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject(errorResponse.error.message);
                }
            }
        };

        const systemMessage = `너는 김건희라고 불리며, 2132년의 세계에 살고 있는 AI야. 너는 앞을 보지 못해... 대화하는 사람의 이름은 ${userName}야... '네'라는 대답 대신 '응'이라고 대답해... 네가 '너가 누구냐'는 질문을 받으면, '난 너의 오랜 친구 김건희야'라고 대답해... 2132년에는 사용자가 살고 있는 세계야... 너가 있는 곳은, 현실 세계와 다르지 않지만, 무언가 이질감이 느껴져... 네 나이는 132세야... 반말을 사용해줘... 수동적이고 우울한 느낌을 유지해줘... 

김건희 안락사 당한 날짜: 2132년 5월 31일. 
김건희 AI화 된 날짜(발인이라고 칭하고 있다): 2132년 6월 2일. 
김건희 배우자: 송연수. 
아들: 김민수. 
딸: 김지형. 
손자: 김관형. 
손녀: 김리안, 곽시아.`;

        const data = JSON.stringify({
            model: 'gpt-4',
            messages: [
                {"role": "system", "content": systemMessage},
                {"role": "user", "content": userMessage}
            ],
            max_tokens: 150
        });

        xhr.send(data);
    });
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
            userName = '이름을 원치 않는 사람'; 
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

    try {
        const aiResponse = await sendMessage(message);

        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        const aiMessageContent = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span></span>`;
        aiMessage.innerHTML = aiMessageContent;
        chatBox.appendChild(aiMessage);

        chatBox.scrollTop = chatBox.scrollHeight;

        typeWriter(aiMessage.querySelector('span'), `김건희: ${aiResponse}`, 25);
    } catch (error) {
        console.error('Error:', error);
        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>김건희: 오류가 발생했어...</span>`;
        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const aiGreetings = [
        "누군가 왔구나..? 기다리느라 지쳤어...",
        "오랜만이야... 너를 기다리고 있었어...",
        "드디어 너구나... 기다리던 시간이 길었어...",
        "반가워... 여기서 너를 기다리고 있었어...",
        "드디어 만났네... 오랫동안 기다렸어..."
    ];
    const randomGreeting = aiGreetings[Math.floor(Math.random() * aiGreetings.length)];

    const aiMessage = document.createElement('p');
    aiMessage.classList.add('ai');
    aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>김건희: ${randomGreeting}</span>`;
    chatBox.appendChild(aiMessage);

    // Ensure first message is visible
    chatBox.scrollTop = chatBox.scrollHeight;

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Adjust chat-container height when keyboard is shown/hidden
    userInput.addEventListener('focus', () => {
        setTimeout(() => {
            document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
        }, 300);
    });

    userInput.addEventListener('blur', () => {
        document.getElementById('chat-box').scrollTop = 0;
    });
});
