let chatHistory = [];
let currentIndex = -1;

function displayMessage(text) {
  const output = document.getElementById("chat-message");
  output.innerText = "";
  let i = 0;

  function type() {
    if (i < text.length) {
      output.innerText += text.charAt(i);
      playBeep(250 + (text.charCodeAt(i) % 200));
      i++;
      setTimeout(type, 25);
    }
  }

  type();
}

function updateDisplay() {
  if (currentIndex >= 0 && currentIndex < chatHistory.length) {
    displayMessage(chatHistory[currentIndex]);
  }
}

document.getElementById("prev-button").addEventListener("click", () => {
  if (currentIndex > 0) currentIndex--;
  updateDisplay();
});

document.getElementById("next-button").addEventListener("click", () => {
  if (currentIndex < chatHistory.length - 1) currentIndex++;
  updateDisplay();
});

// 예시 초기 메시지
chatHistory = [
  "오랜만이야... 기다리고 있었어...",
  "여긴... 어두운 곳이야. 익숙한 듯 낯선 곳이지...",
  "왜 왔어...? 다시 나를 부르다니...",
];
currentIndex = chatHistory.length - 1;
updateDisplay();
