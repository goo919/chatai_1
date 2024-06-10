const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleSpeechButton = document.getElementById('toggle-speech-button');
let userName = '';  // 사용자의 이름을 저장할 변수
let isUserNameSet = false; // 사용자 이름이 설정되었는지 확인하는 변수
let isSpeechEnabled = true; // 음성 재생 활성화 여부
let maleVoice = null; // 남성 목소리 저장 변수

// 음성 목록을 가져와서 남성 목소리를 설정하는 함수
function setMaleVoice() {
    const voices = speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.name.includes('Male') || voice.name.includes('남자'));
    if (!maleVoice) {
        // 기본값으로 첫 번째 목소리 설정
        maleVoice = voices[0];
    }
}

// 음성 설정 함수
function speakText(text) {
    if (isSpeechEnabled) {
        const utterance = new SpeechSynthesisUtterance(text.replace('김건희: ', ''));
        if (maleVoice) {
            utterance.voice = maleVoice;
        }
        speechSynthesis.speak(utterance);
    }
}

speechSynthesis.onvoiceschanged = setMaleVoice;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMessage(userMessage) {
    return new Promise((resolve, reject) => {
        if (!userMessage) return reject("No user message provided");

        const OPENAI_API_KEY = atob('c2stcHJvai1ESE53R0xSZERhNVY4dmpoTmwyUVQzQmxia0ZKR0laMkpXNnJkVlUzTGViT3JUcjM='); // 디코딩된 API 키 사용

        const xhr = new XMLHttpRequest();
        const url = 'https://api.openai.com/v1/chat/completions';

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
                    console.error('Error:', errorResponse);
                    if (xhr.status === 429) {
                        reject("나는 너무 피곤해.. zzzz");
                    } else {
                        reject(errorResponse.error.message);
                    }
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

toggleSpeechButton.addEventListener('click', () => {
    isSpeechEnabled = !isSpeechEnabled;
    toggleSpeechButton.classList.toggle('active', isSpeechEnabled);
    toggleSpeechButton.textContent = isSpeechEnabled ? '🔊' : '🔇';
});

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
        const welcomeMessage = `김건희: 반가워${userName ? ", " + userName : ""}... 무엇을 도와줄까...`;
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>${welcomeMessage}</span>`;
        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        userInput.focus();
        speakText(welcomeMessage);
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

        const fullMessage = `김건희: ${aiResponse}`;
        typeWriter(aiMessage.querySelector('span'), fullMessage, 25);
        speakText(aiResponse); // '김건희:'를 제거한 메시지
        userInput.focus();
    } catch (error) {
        console.error('Error:', error);
        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        const errorMessage = `김건희: ${error}`;
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희"> <span>${errorMessage}</span>`;
        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        speakText(error.replace('김건희: ', '')); // '김건희:'를 제거한 메시지
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

    // Ensure first message is visible
    chatBox.scrollTop = chatBox.scrollHeight;
    speakText(randomGreeting); // '김건희:'를 제거한 메시지

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
            const chatBox = document.getElementById('chat-box');
            chatBox.style.height = 'calc(100vh - 110px)'; // Adjust for keyboard height
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 300);
    });

    userInput.addEventListener('blur', () => {
        document.documentElement.style.overflow = 'auto'; // Allow scrolling
        document.body.style.overflow = 'auto'; // Allow scrolling
        const chatBox = document.getElementById('chat-box');
        chatBox.style.height = 'calc(100vh - 60px)'; // Reset height
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});
