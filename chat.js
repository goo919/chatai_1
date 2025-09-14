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

// === Hangul 모음 판별 유틸 (전역) ===
const HANGUL_BASE = 0xAC00;
const HANGUL_LAST = 0xD7A3;
// 중성 인덱스 0..20: ㅏ,ㅐ,ㅑ,ㅒ,ㅓ,ㅔ,ㅕ,ㅖ,ㅗ,ㅘ,ㅙ,ㅚ,ㅛ,ㅜ,ㅝ,ㅞ,ㅟ,ㅠ,ㅡ,ㅢ,ㅣ
// "입 크게 여는" 계열 (원하는 대로 조정 가능)
const OPEN_JUNGSEONG = new Set([8,9,10,11,12,13,14,15,16,17,18,20]); 
// ㅗ,ㅘ,ㅙ,ㅚ,ㅛ,ㅜ,ㅝ,ㅞ,ㅟ,ㅠ,ㅡ,ㅣ

function isLatinVowel(ch) {
  return /[AEIOUaeiou]/.test(ch);
}
function isHangulOpenVowel(ch) {
  const code = ch.codePointAt(0);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return false;
  const syllableIndex = code - HANGUL_BASE; // 0..11171
  const jungseongIndex = Math.floor(syllableIndex / 28) % 21;
  return OPEN_JUNGSEONG.has(jungseongIndex);
}
function isVowelChar(ch) {
  if (!/\S/.test(ch)) return false; // 공백/개행/탭 무시
  return isLatinVowel(ch) || isHangulOpenVowel(ch);
}

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

// === 안전한 타이핑 효과 (비프 동기 콜백 지원) ===
function typeWriter(element, text, delay = 16, onChar = null, onDone = null) {
  element.textContent = '';
  let i = 0;
  (function tick() {
    if (i < text.length) {
      const ch = text.charAt(i);
      element.textContent += ch;
      playBeep(220 + (ch.charCodeAt(0) % 220));
      if (typeof onChar === 'function') onChar(ch);   // 🔁 비프와 동기화된 콜백
      i++;
      setTimeout(tick, delay);
    } else {
      if (typeof onDone === 'function') onDone();
    }
  })();
}

function splitAndTypeWriter(element, text, maxLength = 160, delay = 16, onChar = null, onAllDone = null) {
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
    for (let idx = 0; idx < parts.length; idx++) {
      const p = parts[idx];
      const line = document.createElement('div');   // ✅ 줄 단위 DIV 생성
      element.appendChild(line);
      await new Promise(resolve => {
        typeWriter(
          line,
          p,
          delay,
          onChar,                      // 🔁 각 글자 콜백 전달
          () => setTimeout(resolve, 20) // 줄 사이 약간의 버퍼
        );
      });
    }
    if (typeof onAllDone === 'function') onAllDone();
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

// === ★ ASCII 프레임 & 비프 동기화 입 모양 토글 ===
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
████▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓▓███████████████▓██▓▓▓▓▓▓▓▓▓███▓▓▓▓▓▓▓▓▓▓▓████████`;

// Idle은 기본으로 TALK_1과 동일하게 시작. 필요 시 워드이미지로 교체.
const FRAME_IDLE = FRAME_TALK_1;

// === 렌더링 ===
function showFrame(txt) {
  if (!portraitEl) return;
  portraitEl.textContent = txt;
}

// === 비프(글자 출력) 타이밍에 맞춘 입 모양 토글 ===
let mouthCount = 0; // (모음) 글자 카운트

function resetMouth() {
  mouthCount = 0;
  showFrame(FRAME_TALK_1); // 시작은 입 다문 상태
}

function onBeepCharToggle(ch) {
  if (!isVowelChar(ch)) return; // ✅ 모음에서만 반응
  mouthCount++;
  // 홀수 → 입 벌림(2번), 짝수 → 입 다묾(1번)
  showFrame(mouthCount % 2 ? FRAME_TALK_2 : FRAME_TALK_1);
}

// 말하는 동안: 비프에 동기화해 프레임 토글, 끝나면 Idle
function speakWithAnimation(targetEl, text, maxLength = 160, delay = 16) {
  resetMouth();
  splitAndTypeWriter(
    targetEl,
    text,
    maxLength,
    delay,
    onBeepCharToggle,       // 🔁 글자마다(모음만) 입 모양 토글
    () => showFrame(FRAME_IDLE) // 모두 끝나면 Idle 복귀
  );
}

// === 렌더 ===
function renderMessage(role, text) {
  const p = document.createElement('p');
  p.className = role;

  if (role === 'ai') {
    const span = document.createElement('span');
    p.appendChild(span);
    chatBox.appendChild(p);
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

  // 이름 세팅: "내 이름은/제 이름은/저는/난 ..." 형태일 때만 인식
  if (!isUserNameSet) {
    const m = userMessage.match(/(?:내\s*이름은|제\s*이름은|저는|난)\s*([^\s.,!?~"'()]+)\s*$/u);
    if (m) {
      userName = m[1];
      isUserNameSet = true;
    } else {
      userName = '낯선이';
      // (미확정으로 두고 싶다면 이 줄 지우고 SYSTEM_PROMPT에서 기본값 사용)
    }
  } else {
    // 이미 이름이 있는 상태에서도, 뒤늦게 알려주면 업데이트
    const m2 = userMessage.match(/(?:내\s*이름은|제\s*이름은)\s*([^\s.,!?~"'()]+)\s*$/u);
    if (m2) {
      userName = m2[1];
    }
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

  // 인사에 비프 동기화 입 모양 적용 (모음만 반응)
  speakWithAnimation(span, `김건희: ${greet}`, 160, 16);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});
