const chatBox = document.getElementById('chat-box');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleSpeechButton = document.getElementById('toggle-speech-button');
const guestbookModal = document.getElementById('guestbook-modal');
const guestbookNameInput = document.getElementById('guestbook-name');
const submitGuestbookButton = document.getElementById('submit-guestbook');
const nameModal = document.getElementById('name-modal');
const storedNamesContainer = document.getElementById('stored-names');
const closeNameModalButton = document.getElementById('close-name-modal');
const showNameButton = document.getElementById('show-name-button');
const beepSound = document.getElementById('beep-sound');
let userName = '';  // 사용자의 이름을 저장할 변수
let isUserNameSet = false; // 사용자 이름이 설정되었는지 확인하는 변수
let isSpeechEnabled = true; // 음성 재생 활성화 여부
let conversationHistory = []; // 대화 기록을 저장할 배열

// 국화 꽃잎 생성 함수
function createFlower() {
    const flower = document.createElement('div');
    flower.className = 'flower';
    flower.style.left = `${Math.random() * 100}vw`;
    flower.style.animationDuration = `${5 + Math.random() * 5}s`; // 5초에서 10초 사이의 애니메이션 지속 시간
    document.querySelector('.falling-flowers').appendChild(flower);

    // 꽃잎 제거
    setTimeout(() => {
        flower.remove();
    }, 10000);
}

// 일정 시간마다 꽃잎 생성
setInterval(createFlower, 500);

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

function typeWriter(element, text, delay = 25) {
    element.innerHTML = ''; // 기존 텍스트 초기화
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            const frequency = 200 + (text.charCodeAt(i) % 300); // 각 문자에 대해 다른 주파수 설정
            playBeep(frequency); // 각 글자마다 비프음 재생
            chatContainer.classList.add('highlight'); // 채팅 창 배경 점멸
            setTimeout(() => {
                chatContainer.classList.remove('highlight'); // 점멸 제거
            }, delay);
            i++;
            setTimeout(typing, delay);
        }
    }
    typing();
}

function splitAndTypeWriter(element, text, maxLength = 150, delay = 25) {
    const textParts = [];
    let part = '';
    let partLength = 0;

    for (const word of text.split(' ')) {
        if (partLength + word.length + 1 > maxLength) {
            textParts.push(part);
            part = '';
            partLength = 0;
        }
        part += (part.length ? ' ' : '') + word;
        partLength += word.length + 1;
    }

    if (part.length) {
        textParts.push(part);
    }

    async function typeParts() {
        for (const part of textParts) {
            await new Promise(resolve => {
                typeWriter(element, part, delay);
                setTimeout(resolve, part.length * delay);
            });
        }
    }

    typeParts();
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
        saveName(userName); // 이름 저장
    }

    // 로딩 표시 추가
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading');
    loadingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBox.appendChild(loadingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const aiResponse = await sendMessage(message);
        conversationHistory.push({ "role": "user", "content": message });
        conversationHistory.push({ "role": "assistant", "content": aiResponse });

        chatBox.removeChild(loadingIndicator); // 로딩 표시 제거

        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        const aiMessageContent = `<img src="https://i.pinimg.com/originals/1e/9e/a6/1e9ea645b698b680c8977ac3bcefc687.png" alt="김건희"> <span></span>`;
        aiMessage.innerHTML = aiMessageContent;
        chatBox.appendChild(aiMessage);

        chatBox.scrollTop = chatBox.scrollHeight;

        const fullMessage = `김건희: ${aiResponse}`;
        splitAndTypeWriter(aiMessage.querySelector('span'), fullMessage, 150, 25);
        userInput.focus();

        // AI가 주도적으로 이야기 진행
        setTimeout(() => {
            sendButton.click();
        }, 5000); // 5초 후 AI가 추가로 이야기함
    } catch (error) {
        chatBox.removeChild(loadingIndicator); // 로딩 표시 제거

        const aiMessage = document.createElement('p');
        aiMessage.classList.add('ai');
        aiMessage.innerHTML = `<img src="https://i.pinimg.com/originals/1e/9e/a6/1e9ea645b698b680c8977ac3bcefc687.png" alt="김건희"> <span>김건희: ${error.message}</span>`;
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
    aiMessage.innerHTML = `<img src="https://i.pinimg.com/originals/1e/9e/a6/1e9ea645b698b680c8977ac3bcefc687.png" alt="김건희"> <span>${greetingMessage}</span>`;
    chatBox.appendChild(aiMessage);

    // Ensure first message is visible and with beep sound
    chatBox.scrollTop = chatBox.scrollHeight;
    splitAndTypeWriter(aiMessage.querySelector('span'), greetingMessage, 150, 25);

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

    // Check if a name is already stored in localStorage
    const storedName = localStorage.getItem('guestbookName');
    if (storedName) {
        userName = storedName;
        isUserNameSet = true;
        saveName(userName); // 이름 저장
    } else {
        // Show the guestbook modal if no name is stored
        guestbookModal.style.display = 'block';
    }
});

// Handle guestbook submission
submitGuestbookButton.addEventListener('click', () => {
    const name = guestbookNameInput.value.trim();
    if (name) {
        userName = name;
        isUserNameSet = true;
        localStorage.setItem('guestbookName', name);
        guestbookModal.style.display = 'none';
        saveName(userName); // 이름 저장
    }
});

// Handle show name button click
showNameButton.addEventListener('click', () => {
    displayStoredNames();
    nameModal.style.display = 'block';
});

// Handle close name modal button click
closeNameModalButton.addEventListener('click', () => {
    nameModal.style.display = 'none';
});

// Save name to local storage and global list
function saveName(name) {
    let names = JSON.parse(localStorage.getItem('guestbookNames')) || [];
    if (!names.includes(name)) {
        names.push(name);
        localStorage.setItem('guestbookNames', JSON.stringify(names));
    }
}

// Display stored names in modal
function displayStoredNames() {
    const names = JSON.parse(localStorage.getItem('guestbookNames')) || [];
    storedNamesContainer.innerHTML = '';
    names.forEach(name => {
        const nameElement = document.createElement('div');
        nameElement.classList.add('stored-name');
        nameElement.textContent = name;
        storedNamesContainer.appendChild(nameElement);
    });
}
