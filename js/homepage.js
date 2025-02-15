const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const messageText = chatInput.value.trim();
  if (messageText !== "") {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.textContent = messageText;
    messagesContainer.appendChild(messageDiv);
    chatInput.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}
