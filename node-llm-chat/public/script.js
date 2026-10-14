const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    userInput.value = '';
    const pending = addMessage('…', 'bot');

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage }),
        });
        const data = await response.json();
        // 서버가 보낸 오류 문구(혼잡·한도 초과)를 그대로 보여 준다
        pending.textContent = response.ok ? data.reply : data.error;
    } catch (error) {
        pending.textContent = '죄송합니다. 오류가 발생했습니다.';
    }
});

function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const contentElement = document.createElement('div');
    contentElement.classList.add('content');
    contentElement.textContent = message;

    messageElement.appendChild(contentElement);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return contentElement;
}
