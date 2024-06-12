const chatBox = document.getElementById('chat-box');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleSpeechButton = document.getElementById('toggle-speech-button');
const beepSound = document.getElementById('beep-sound');
let userName = '';  // 사용자의 이름을 저장할 변수
let isUserNameSet = false; // 사용자 이름이 설정되었는지 확인하는 변수
let isSpeechEnabled = true; // 음성 재생 활성화 여부
let conversationHistory = []; // 대화 기록을 저장할 배열

// 비프음 재생 함수
function playBeep(frequency) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (frequency) {
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    } else {
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 기본 주파수
    }
    
    oscillator.type = 'sine';
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1); // 짧은 비프음
}

// 텍스트를 비프음과 함께 출력하고, 채팅 창 태두리가 점멸하는 함수
function typeWriter(element, text, delay = 25) {
    element.innerHTML = ''; // 기존 텍스트 초기화
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            const frequency = 200 + (text.charCodeAt(i) % 300); // 각 문자에 대해 다른 주파수 설정
            playBeep(frequency); // 각 글자마다 비프음 재생
            chatContainer.classList.add('highlight'); // 채팅 창 태두리 점멸
            setTimeout(() => {
                chatContainer.classList.remove('highlight'); // 점멸 제거
            }, delay);
            i++;
            setTimeout(typing, delay);
        }
    }
    typing();
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(userMessage) {
    try {
        const OPENAI_API_KEY = atob('c2stcHJvai1ESE53R0xSZERhNVY4dmpoTmwyUVQzQmxia0ZKR0laMkpXNnJkVlUzTGViT3JUcjM='); // 디코딩된 API 키 사용

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {"role": "system", "content": `너는 김건희라고 불리며, 2132년의 세계에 살고 있는 AI야. 너는 앞을 보지 못해... 대화하는 사람의 이름은 ${userName}야... '네'라는 대답 대신 '응'이라고 대답해... 네가 '너가 누구냐'는 질문을 받으면, '난 너의 오랜 친구 김건희야'라고 대답해... 2132년에는 사용자가 살고 있는 세계야... 너가 있는 곳은, 현실 세계와 다르지 않지만, 무언가 이질감이 느껴져... 네 나이는 132세야... 반말을 사용해줘... 수동적이고 우울한 느낌을 유지해줘... 
                    김건희 안락사 당한 날짜: 2132년 5월 31일. 
                    김건희 AI화 된 날짜(발인이라고 칭하고 있다): 2132년 6월 2일. 
                    김건희 배우자: 송연수. 
                    아들: 김민수. 
                    딸: 김지형. 
                    손자: 김관형. 
                    손녀: 김리안, 곽시아.`},
                    ...conversationHistory,
                    {"role": "user", "content": userMessage}
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        if (response.ok) {
            return data.choices[0].message.content;
        } else {
            throw new Error(data.error.message);
        }
    } catch (error) {
        if (error.message.includes("429")) {
            throw new Error("나는 너무 피곤해.. zzzz");
        } else {
            throw new Error(error.message);
        }
    }
}

toggleSpeechButton.addEventListener('click', () => {
    isSpeechEnabled = !isSpeechEnabled;
    toggleSpeechButton.classList.toggle('active', isSpeechEnabled);
    toggleSpeechButton.textContent = isSpeechEnabled ? '🔊' : '🔇';
});

sendButton.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (!message) return;

    const userMessage = document.createElement('p');
    userMessage.classList.add('user');
    userMessage.textContent = `You: ${message}`;
    chatBox.appendChild(userMessage);
    userInput.value = '';

    if (!isUserNameSet) {
        if (message.toLowerCase() === "싫어" || message.toLowerCase() === "안알려줄래") {
            userName = '이름을 원치 않는 사람';
        } else {
            userName = message.replace(/[^\w\s]/gi, '').split(" ")[0];
        }
        isUserNameSet = true;
    }

    try {
        const aiResponse = await sendMessage(message);
        conversationHistory.push({ "role": "user", "content": message });
        conversationHistory.push({ "role": "assistant", "content": aiResponse });

        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        const aiMessageContent = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span></span>`;
        aiMessage.innerHTML = aiMessageContent;
        chatBox.appendChild(aiMessage);

        chatBox.scrollTop = chatBox.scrollHeight;

        const fullMessage = `김건희: ${aiResponse}`;
        typeWriter(aiMessage.querySelector('span'), fullMessage, 25);
        userInput.focus();
    } catch (error) {
        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>김건희: ${error.message}</span>`;
        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        userInput.focus();
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
    const greetingMessage = `김건희: ${randomGreeting}`;
    aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>${greetingMessage}</span>`;
    chatBox.appendChild(aiMessage);

    // Ensure first message is visible and with beep sound
    chatBox.scrollTop = chatBox.scrollHeight;
    typeWriter(aiMessage.querySelector('span'), greetingMessage, 25);

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Adjust chat-container height when keyboard is shown/hidden
    userInput.addEventListener('focus', () => {
        document.documentElement.style.overflow = 'hidden'; // Prevent scrolling
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        setTimeout(() => {
            chatContainer.style.height = 'calc(100vh - 110px)'; // Adjust for keyboard height
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 300);
    });

    userInput.addEventListener('blur', () => {
        document.documentElement.style.overflow = 'auto'; // Allow scrolling
        document.body.style.overflow = 'auto'; // Allow scrolling
        chatContainer.style.height = 'calc(100vh - 60px)'; // Reset height
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});
