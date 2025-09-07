// === DOM 참조 ===
const chatBox   = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton= document.getElementById('send-button');

// === 상태 ===
let conversationHistory = [];
let isSpeechEnabled = true; // 필요하면 false로 꺼도 됨

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

// === 안전한 타이핑 효과 (XSS 방지: textContent 사용) ===
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
      await new Promise(resolve => {
        typeWriter(element, p, delay);
        setTimeout(resolve, p.length * delay + 20);
      });
    }
  })();
}

// === 대화 기록 관리 ===
function pushHistory(role, content) {
  conversationHistory.push({ role, content });
  const MAX = 20; // 최근 10턴
  if (conversationHistory.length > MAX) {
    conversationHistory = conversationHistory.slice(-MAX);
  }
}

// === 메시지 렌더 ===
function renderMessage(role, text) {
  const p = document.createElement('p');
  p.className = role;

  if (role === 'ai') {
    const span = document.createElement('span');
    p.appendChild(span);
    chatBox.appendChild(p);
    splitAndTypeWriter(span, `김건희: ${text}`, 160, 16);
  } else {
    p.textContent = `YOU: ${text}`;
    chatBox.appendChild(p);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// === 서버 프록시 연동 자리 ===
// 실제로는 /api/chat 같은 서버 엔드포인트로 보안 호출하세요.
async function sendMessage(userMessage) {
  // 예시(스텁): 실제 구현 시 아래를 서버 호출로 교체
  // const res = await fetch('/api/chat', { ... });
  // const data = await res.json();
  // return data.content;
  return `...${userMessage}에 대한 대답이야.`; // 임시 에코
}

// === 이벤트 ===
sendButton.addEventListener('click', async () => {
  const message = userInput.value.trim();
  if (!message) return;

  renderMessage('user', message);
  userInput.value = '';

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
  // 첫 인사
  const greet = '...왔구나.';
  const p = document.createElement('p');
  p.className = 'ai';
  const span = document.createElement('span');
  p.appendChild(span);
  chatBox.appendChild(p);
  splitAndTypeWriter(span, `김건희: ${greet}`, 160, 16);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});
