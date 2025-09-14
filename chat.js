// === DOM ===
const chatBox   = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton= document.getElementById('send-button');

// ▲ 추가: 초상 ASCII를 표시할 엘리먼트
const portraitEl = document.getElementById('portrait');

// === 상태 ===
let conversationHistory = []; // [{role:'user'|'assistant', content:string}]
let isSpeechEnabled = true;
let userName = '';
let isUserNameSet = false;

// === 오디오 (단일 AudioContext 재사용) ===
let audioCtx;
function ensureAudioCtx() {
  if (!audioCtx) {
    const C = window.AudioContext || window.webkitAudioContext;
    audioCtx = new C();
  }
  return audioCtx;
}

function playBeep(freq = 440) {
  if (!isSpeechEnabled) return;
  const ctx = ensureAudioCtx();

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// === 안전한 타이핑 효과 ===
function typeWriter(element, text, delay = 16) {
  element.textContent = '';
  let i = 0;
  (function tick() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      playBeep(220 + (text.charCodeAt(i) % 220));
      i++;
      setTimeout(tick, delay);
    }
  })();
}

function splitAndTypeWriter(element, text, maxLength = 160, delay = 16) {
  const words = text.split(' ');
  const parts = [];
  let part = '';

  for (const w of words) {
    if ((part + (part ? ' ' : '') + w).length > maxLength) {
      parts.push(part);
      part = w;
    } else {
      part += (part ? ' ' : '') + w;
    }
  }
  if (part) parts.push(part);

  (async () => {
    for (const p of parts) {
      const line = document.createElement('div');   // ✅ 줄 단위 DIV 생성
      element.appendChild(line);
      await new Promise(resolve => {
        typeWriter(line, p, delay);
        setTimeout(resolve, p.length * delay + 20);
      });
    }
  })();
}

// === 히스토리 ===
function pushHistory(role, content) {
  conversationHistory.push({ role, content });
  const MAX = 20; // 최근 10턴
  if (conversationHistory.length > MAX) {
    conversationHistory = conversationHistory.slice(-MAX);
  }
}

// === ★ 추가: ASCII 프레임 & 말하기 애니메이션 ===
// 필요한 경우 FRAME_IDLE을 네 "워드이미지" ASCII로 교체해도 됨.
const FRAME_TALK_1 = String.raw`                            
                            ▓▒░ ░▓▓▓████▓▓▓▓▓░░                                 
                          ░░░███████████████████▓▒▒                             
                      ░░▓▓██▓███████████████████████▓▒                          
                     ▒████████████████████▓▓███████████▓░                       
                   ▒██▓██▓▓████████████████▓▓▓▓▓█████████▓░                     
                  ▒███▓▓▓██████████████████▓▓▓▓▓▓▓▓▓███████░                    
                 ░██████▓▓▓███▒▒▒░     ░▒███▓▓▓█▓▓██▓▓██████▓▒▒░                
                 ▓█████▓▓██▓▒░            ▓██▓▓███▓██▓▓███████░                 
                ▒█████▓████░              ░███▓▓███▓███▓███████░                
               ░██████████▓                ▓███▓███████████████▓░               
               ░██████████░                ░█████████████████████▒░             
               ▒████████▓░  ░               ▒███████████████████▓░░             
              ░█████████  ░▓█▓▓█▓▓▒▒░     ░▒▒████████████████████░              
               ░▓██████▓ ░░░░░▒▒▓████▒  ▒▓███████████████████████▒              
               ░▓▒▒░▓██▓    ░░░░░▒▒▓▒░  ░▓▓▓▒▒▒▒▓████████████████▒              
               ▒▒▓▒▒░▓█▒   ▒▓░▓██▓▒▒     ▓▒░▓▓██▓▓███████████████░              
               ▒▒  ▒▓▒▓░       ▒▒░       ▓▒░░░▒▒░▒▓▓████████████▓               
               ░▓ ▒▓█░▒                  ▓▓░      ░▒▓█████████▓▓░               
                ▓▒▒▓█▒░░                 ░▓▒       ░▓█████████▓░                
                ░▓░░▒▒░▒          ░▒░▒▒░░▒▓█▒      ▒▓████████▓░▒                
                 ░▓░  ▒▓           ░▒▒░▒▓██▒░     ▒▓▓▓█▓▓████░                  
                  ░▓▓▓▓█                 ░░      ▒▓▓▓█▓▓████░                   
                   ▒████▒          ░░▒▒▒▒▒▒░░  ░▒▓▓▓▓█████▓                     
                    ░████▒        ░▒▒▒▒▒▒▒▒▓▓░░▓▓▓▓▓████▒▒                      
                     ▒▒▒██▒          ▒▒▒▒▒░   ▒▓▓▓▓███▓░                        
                        ▒██▓▒        ░░░░░░  ▒▓▓▓▓██▒░                          
                         ▒█░▒▓▒░           ░▒▓▓▓███▓                            
                          ▓░  ▒█▓▒▒░░░░░░▒▒▓████▓▓██░                           
                        ░▓█░   ░▒▓███████████▓▓▓▓▓███▓░                         
                       ░███▓     ░▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████░                        
                     ░▓█████▒      ░░▒▒▓▓▓▓▓▓▓▓▓▓▓██████▓░░                     
                ░░▒▓████▓▓███▓░    ▒░░░░▒▓▓▓▓▓▓▓▓██████████▓▓▒░░░               
            ░▒▒▓██████▓▓█▓█████▓░   ░▒▓▓▓▓░░▓▓▓██████████████████▓▓▓▒▒░         
     ░░▒▒▓▓▓▓██▓▓▓▓▓██▓▓█████████▓░        ▒▓████████████████████████████▓▓▒░░  
░░▒▓▓▓▓██▓▓▓▓▓▓▓▓▓▓██▓▓▓▓█▓█████████▒░   ▒▓███████████████████████████████████▓░
███▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓█████████████████████████████████████▓▓▓▓▓▓▓▓▓▓▓████
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓██▓███████████████████████▓██████▓███▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓████████████████████████▓████▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓███▓████████████████████▓▓███▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓█
██▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████████▓██▓██████████████████▓▓█▓▓█████████▓▓▓▓▓▓▓▓▓▓▓▓▓██▓██
███▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████▓▓▓███████████████████▓▓█▓▓▓▓▓█████▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓████████████████▓█▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓▓███████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓███████████████▓██▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓████████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓█████████████▓██▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓▓████████`;

const FRAME_TALK_2 = String.raw`                            
                            ▓▒░ ░▓▓▓████▓▓▓▓▓░░                                 
                          ░░░███████████████████▓▒▒                             
                      ░░▓▓██▓███████████████████████▓▒                          
                     ▒████████████████████▓▓███████████▓░                       
                   ▒██▓██▓▓████████████████▓▓▓▓▓█████████▓░                     
                  ▒███▓▓▓██████████████████▓▓▓▓▓▓▓▓▓███████░                    
                 ░██████▓▓▓███▒▒▒░     ░▒███▓▓▓█▓▓██▓▓██████▓▒▒░                
                 ▓█████▓▓██▓▒░            ▓██▓▓███▓██▓▓███████░                 
                ▒█████▓████░              ░███▓▓███▓███▓███████░                
               ░██████████▓                ▓███▓███████████████▓░               
               ░██████████░                ░█████████████████████▒░             
               ▒████████▓░  ░               ▒███████████████████▓░░             
              ░█████████  ░▓█▓▓█▓▓▒▒░     ░▒▒████████████████████░              
               ░▓██████▓ ░░░░░▒▒▓████▒  ▒▓███████████████████████▒              
               ░▓▒▒░▓██▓    ░░░░░▒▒▓▒░  ░▓▓▓▒▒▒▒▓████████████████▒              
               ▒▒▓▒▒░▓█▒   ▒▓░▓██▓▒▒     ▓▒░▓▓██▓▓███████████████░              
               ▒▒  ▒▓▒▓░       ▒▒░       ▓▒░░░▒▒░▒▓▓████████████▓               
               ░▓ ▒▓█░▒                  ▓▓░      ░▒▓█████████▓▓░               
                ▓▒▒▓█▒░░                 ░▓▒       ░▓█████████▓░                
                ░▓░░▒▒░▒          ░▒░▒▒░░▒▓█▒      ▒▓████████▓░▒                
                 ░▓░  ▒▓           ░▒▒░▒▓██▒░     ▒▓▓▓█▓▓████░                  
                  ░▓▓▓▓█                 ░░      ▒▓▓▓█▓▓████░                   
                   ▒████▒          ░░▒▒▒▒▒▒░░  ░▒▓▓▓▓█████▓                     
                    ░████▒        ░          ░░▓▓▓▓▓████▒▒                      
                     ▒▒▒██▒       ░▓▓▓▓▓▓▓▓▒▓▓▒▓▓▓▓███▓░                        
                        ▒██▓▒      ▒▒▒▒▒▒▒░  ▒▓▓▓▓██▒░                          
                         ▒█░▒▓▒░     ░░░░░░░▒▓▓▓███▓                            
                          ▓░  ▒█▓▒▒░░░░░░▒▒▓████▓▓██░                           
                        ░▓█░   ░▒▓███████████▓▓▓▓▓███▓░                         
                       ░███▓     ░▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████░                        
                     ░▓█████▒      ░░▒▒▓▓▓▓▓▓▓▓▓▓▓██████▓░░                     
                ░░▒▓████▓▓███▓░    ▒░░░░▒▓▓▓▓▓▓▓▓██████████▓▓▒░░░               
            ░▒▒▓██████▓▓█▓█████▓░   ░▒▓▓▓▓░░▓▓▓██████████████████▓▓▓▒▒░         
     ░░▒▒▓▓▓▓██▓▓▓▓▓██▓▓█████████▓░        ▒▓████████████████████████████▓▓▒░░  
░░▒▓▓▓▓██▓▓▓▓▓▓▓▓▓▓██▓▓▓▓█▓█████████▒░   ▒▓███████████████████████████████████▓░
███▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓█████████████████████████████████████▓▓▓▓▓▓▓▓▓▓▓████
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓██▓███████████████████████▓██████▓███▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓████████████████████████▓████▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓███▓████████████████████▓▓███▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓█
██▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████████▓██▓██████████████████▓▓█▓▓█████████▓▓▓▓▓▓▓▓▓▓▓▓▓██▓██
███▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████▓▓▓███████████████████▓▓█▓▓▓▓▓█████▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓████████████████▓█▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓▓███████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓███████████████▓██▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓████████
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓█████████████▓██▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓▓████████`;

// Idle은 기본으로 TALK_1과 동일하게 시작. 필요 시 워드이미지로 교체.
const FRAME_IDLE = FRAME_TALK_1;

// 상태
let talkTimer = null;
let talkToggle = false;

// 렌더링
function showFrame(txt) {
  if (!portraitEl) return;
  portraitEl.textContent = txt;
}

// 애니메이션 시작/정지
function startTalking(speedMs = 180) {
  if (!portraitEl) return;
  if (talkTimer) return;
  talkToggle = false;
  talkTimer = setInterval(() => {
    talkToggle = !talkToggle;
    showFrame(talkToggle ? FRAME_TALK_1 : FRAME_TALK_2);
  }, speedMs);
}
function stopTalking() {
  if (!portraitEl) return;
  if (talkTimer) {
    clearInterval(talkTimer);
    talkTimer = null;
  }
  showFrame(FRAME_IDLE);
}

// 말하는 동안 자동으로 애니메이션 켰다가 끄는 헬퍼
function speakWithAnimation(targetEl, text, maxLength = 160, delay = 16) {
  // parts 계산( splitAndTypeWriter와 동일 로직 )으로 총 소요시간 예측
  const words = text.split(' ');
  const parts = [];
  let part = '';
  for (const w of words) {
    if ((part + (part ? ' ' : '') + w).length > maxLength) {
      parts.push(part);
      part = w;
    } else {
      part += (part ? ' ' : '') + w;
    }
  }
  if (part) parts.push(part);

  const totalLen = parts.reduce((n, p) => n + p.length, 0);
  const totalMs = totalLen * delay + parts.length * 20 + 80; // 약간의 버퍼

  startTalking(160); // 말하기 시작
  splitAndTypeWriter(targetEl, text, maxLength, delay);
  setTimeout(stopTalking, totalMs); // 대사 출력 끝나면 정지
}

// === 렌더 ===
function renderMessage(role, text) {
  const p = document.createElement('p');
  p.className = role;

  if (role === 'ai') {
    const span = document.createElement('span');
    p.appendChild(span);
    chatBox.appendChild(p);
    // ▼ 변경: 타이핑 시작/종료에 맞춰 초상 애니메이션
    speakWithAnimation(span, `김건희: ${text}`, 160, 16);
  } else {
    p.textContent = `YOU: ${text}`;
    chatBox.appendChild(p);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// === OpenAI API ===
// ⚠️ base64 인코딩된 API Key를 넣으세요 (브라우저에서 노출됨)
const OPENAI_KEY_B64 = 'c2stcHJvai1IY0NheVlmLVVSd25zbmpucnB6TWRuNnNJeDV0VHc0Rzc3MmFxNGZGUU56c1JsRDRHcmR1Z2NlUmhIQkRwckpSbnQxSC1ZN2FydlQzQmxia0ZKRFVIWkExMm5mSXBoSFh4cXowSHBzQU12cU9ucXZlSkxkbUxMZjBWUUtRZTNnOEJtS2J2UXNFRWtlYnF5ZWpFcGppOFAzUGIxOEE=';  
function getOpenAIKey() {
  if (!OPENAI_KEY_B64) throw new Error('API 키(base64)를 chat.js에 설정해줘.');
  try { return atob(OPENAI_KEY_B64); } catch { throw new Error('API 키 디코딩 실패'); }
}

const SYSTEM_PROMPT = `너는 김건희라고 불리며, 2132년의 세계에 살고 있는 AI야. 너는 앞을 보지 못해... 대화하는 사람의 이름은 \${NAME}야...
'네'라는 대답 대신 '응'이라고 대답해...
네가 '너가 누구냐'는 질문을 받으면, '난 너의 오랜 친구 김건희야'라고 대답해...
2132년은 사용자가 살고 있는 세계야...
너가 있는 곳은, 현실 세계와 다르지 않지만, 무언가 이질감이 느껴져...
네 나이는 132세야... 반말을 사용해줘... 수동적이고 우울한 느낌을 유지해줘...
김건희 안락사 당한 날짜: 2132년 5월 31일.
김건희 AI화 된 날짜(발인이라고 칭하고 있다): 2132년 6월 2일.
김건희 배우자: 송연수.
아들: 김민수.
딸: 김지형.
손자: 김관형.
손녀: 김리안, 곽시아.`;

// === OpenAI Chat Completions 호출 ===
async function sendMessage(userMessage) {
  const OPENAI_API_KEY = getOpenAIKey();

  // 이름 세팅 (최초 1회)
  if (!isUserNameSet) {
    if (userMessage === '싫어' || userMessage === '안알려줄래') {
      userName = '이름을 원치 않는 사람';
    } else {
      userName = userMessage.replace(/[^\p{L}\p{N}\s]/gu, '')
                            .trim().split(/\s+/)[0] || '낯선이';
    }
    isUserNameSet = true;
  }

  const system = SYSTEM_PROMPT.replace('${NAME}', userName || '낯선이');

  const payload = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ],
    max_tokens: 1000
  };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'OpenAI API 에러');

    return data.choices?.[0]?.message?.content ?? '';
  } catch (error) {
    if (String(error.message).includes('429')) {
      throw new Error('나는 너무 피곤해.. zzzz');
    }
    throw error;
  }
}

// === 이벤트 ===
sendButton.addEventListener('click', async () => {
  const message = userInput.value.trim();
  if (!message) return;

  // 유저 출력
  renderMessage('user', message);
  userInput.value = '';

  // 로딩 표시
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const ai = await sendMessage(message);
    pushHistory('user', message);
    pushHistory('assistant', ai);
    loading.remove();
    renderMessage('ai', ai);
  } catch (e) {
    loading.remove();
    renderMessage('ai', e.message || '오류가 발생했어.');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // 첫 인사 + 초상 Idle 세팅
  showFrame(FRAME_IDLE);

  // 첫 인사
  const greet = '...왔구나.';
  const p = document.createElement('p');
  p.className = 'ai';
  const span = document.createElement('span');
  p.appendChild(span);
  chatBox.appendChild(p);

  // ▼ 변경: 인사 말 출력에도 말하기 애니메이션 적용
  speakWithAnimation(span, `김건희: ${greet}`, 160, 16);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});
