document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const userMessage = userInput.value;
    if (!userMessage) return;

    const chatBox = document.getElementById('chat-box');

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user';
    userMessageDiv.innerHTML = `<span class="text">You: ${userMessage}</span>`;
    chatBox.appendChild(userMessageDiv);

    userInput.value = '';  // Clear the input field after sending the message

    const response = await fetch('/api/fetch-openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();

    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message ai';
    aiMessageDiv.innerHTML = `
        <img src="https://i.pinimg.com/736x/d4/4b/53/d44b5391bf855f9d9703e15059c3cdf2.jpg" alt="김건희">
        <span class="text">김건희: ${data.response}</span>
    `;
    chatBox.appendChild(aiMessageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;  // Scroll to the bottom of the chat box
}
