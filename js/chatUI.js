import { database } from "./firebaseConfig.js";
import {
    ref,
    get,
    set,
    push,
    onChildAdded,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function openChannelChat(channelId) {
    const channelRef = ref(database, "channels/" + channelId);
    const channelSnapshot = await get(channelRef);
    if (!channelSnapshot.exists()) return;
    const channelData = channelSnapshot.val();
    document.getElementById("channelsContainer").style.display = "none";
    const createChannelEl = document.getElementById("createchannelSection");
    if (createChannelEl) {
        createChannelEl.style.display = "none";
    }
    if (channelData.groupChatId) {
        displayChatUI(channelData.groupChatId, channelData.name);
    } else {
        const newChatRef = push(ref(database, "groupChats"));
        const newChatId = newChatRef.key;
        await set(newChatRef, {
            chatId: newChatId,
            members: channelData.members || [],
            lastMessage: "",
            senderID: "",
            updatedDate: new Date().toISOString(),
            channelId: channelId,
        });
        displayChatUI(newChatId, channelData.name);
    }
}

function displayChatUI(chatId, channelName) {
    const existingChatView = document.getElementById("chatView");
    if (existingChatView) {
        existingChatView.remove();
    }
    const chatView = document.createElement("div");
    chatView.id = "chatView";
    chatView.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <h3>Chat for channel: ${channelName}</h3>
        <button id="backToChannelsBtn">Back</button>
      </div>
      <div id="messagesContainer" class="messages-container"></div>
      <div class="chat-footer">
        <input type="text" id="messageInput" placeholder="Write your message..." />
        <button id="sendMessageBtn">Send</button>
      </div>
    </div>
  `;
    document.body.appendChild(chatView);
    document.getElementById("backToChannelsBtn").addEventListener("click", () => {
        goBackToChannels();
    });
    document.getElementById("sendMessageBtn").addEventListener("click", () => {
        sendMessage(chatId);
    });
    loadMessages(chatId);
}

async function sendMessage(chatId) {
    const messageInput = document.getElementById("messageInput");
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    const messagesRef = ref(database, `groupChats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
        senderID: "user", // Replace with actual user ID when authentication is implemented
        text: messageText,
        timestamp: new Date().toISOString(),
    });
    messageInput.value = "";
}

function loadMessages(chatId) {
    const messagesContainer = document.getElementById("messagesContainer");
    messagesContainer.innerHTML = "";

    const messagesRef = ref(database, `groupChats/${chatId}/messages`);
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        const messageEl = document.createElement("div");
        messageEl.classList.add("message");
        messageEl.textContent = `${message.senderID}: ${message.text}`;
        messagesContainer.appendChild(messageEl);
    });
}

function goBackToChannels() {
    const chatView = document.getElementById("chatView");
    if (chatView) {
        chatView.remove();
    }
    document.getElementById("channelsContainer").style.display = "block";
    const createChannelEl = document.getElementById("createchannelSection");
    if (createChannelEl) {
        createChannelEl.style.display = "block";
    }
}
