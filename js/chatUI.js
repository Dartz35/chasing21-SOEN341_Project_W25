import { database } from "./firebaseConfig.js";
import {
    ref,
    get,
    set,
    push,
    update,
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
        await update(channelRef, { groupChatId: newChatId });
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
      <p>Chat ID: ${chatId}</p>
      <div id="messagesContainer" class="messages-container">
        No messages yet
      </div>
      <div class="chat-footer">
        <input
          type="text"
          id="messageInput"
          placeholder="Write your message..."
        />
      </div>
    </div>
  `;
    document.body.appendChild(chatView);
    document.getElementById("backToChannelsBtn").addEventListener("click", () => {
        goBackToChannels();
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
