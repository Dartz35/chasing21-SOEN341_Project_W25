import { database } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  push,
  query,
  orderByChild,
  equalTo,
  onChildAdded,
  onChildRemoved,
  remove,
} from "firebase/database";

let currentChannelOwner = null;
function displayError(message) {
  let errorDiv = document.getElementById("errorMessage");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "errorMessage";
    errorDiv.style.color = "red";
    errorDiv.style.margin = "10px";
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  setTimeout(() => {
    errorDiv.textContent = "";
  }, 5000);
}

async function fetchRoleById(uid) {
  try {
    const snapshot = await get(ref(database, "users"));
    if (!snapshot.exists()) return "member";
    const usersData = snapshot.val();
    for (const key in usersData) {
      if (usersData[key].id === uid) {
        return usersData[key].role || "member";
      }
    }
    return "member";
  } catch {
    return "member";
  }
}

export async function openChannelChat(channelId) {
  try {
    const channelRef = ref(database, "channels/" + channelId);
    const channelSnapshot = await get(channelRef);
    if (!channelSnapshot.exists()) {
      displayError("Channel does not exist.");
      return;
    }
    const channelData = channelSnapshot.val();
    currentChannelOwner = channelData.ownerId;
    document.getElementById("channelsContainer").style.display = "none";
    const createChannelEl = document.getElementById("createchannelSection");
    if (createChannelEl) {
      createChannelEl.style.display = "none";
    }
    let groupChatId;
    if (channelData.groupChatId) {
      groupChatId = channelData.groupChatId;
    } else {
      const newChatRef = push(ref(database, "groupChats"));
      groupChatId = newChatRef.key;
      await set(newChatRef, {
        groupChatId: groupChatId,
        members: channelData.members || [],
        lastMessage: "",
        senderID: "",
        updatedDate: new Date().toISOString(),
        channelId: channelId,
      });
      await set(
        ref(database, `channels/${channelId}/groupChatId`),
        groupChatId
      );
    }
    displayChatUI(groupChatId, channelData.name);
  } catch (error) {
    console.error(error.stack);
    displayError("Error opening channel chat: " + error.message);
  }
}

function displayChatUI(groupChatId, channelName) {
  try {
    const existingChatView = document.getElementById("chatView");
    if (existingChatView) {
      existingChatView.remove();
    }
    const chatView = document.createElement("div");
    chatView.id = "chatView";
    chatView.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <h3>${channelName}</h3>
          <p id="userRoleDisplay"></p>
          <button id="backToChannelsBtn">Back</button>
        </div>
        <div id="messagesContainer" class="messages-container"></div>
        <div class="chat-footer">
          <input type="text" id="messageInput" placeholder="Write your message..." />
          <button id="sendMessageBtn">Send</button>
         <img
          src="../images/emoji.png"
          onclick="show_emoji()"
          alt=""
          style="width: 20px; height: 20px; "
        />
          </div>
     
        </div>
    `;
    document.body.appendChild(chatView);
    fetchRoleById(sessionStorage.getItem("currentID") || "unknown").then(
      (role) => {
        document.getElementById("userRoleDisplay").textContent =
          "Role: " + role;
        sessionStorage.setItem("role", role);
      }
    );
    document
      .getElementById("backToChannelsBtn")
      .addEventListener("click", () => {
        goBackToChannels();
      });
    document.getElementById("sendMessageBtn").addEventListener("click", () => {
      sendMessage(groupChatId);
    });
    loadMessages(groupChatId);
  } catch (error) {
    console.error(error.stack);
    displayError("Error displaying chat UI: " + error.message);
  }
}

async function sendMessage(groupChatId) {
  try {
    const messageInput = document.getElementById("messageInput");
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    const currentUserName = sessionStorage.getItem("username") || "Anonymous";
    const currentUserId = sessionStorage.getItem("currentID") || "unknown";
    const messagesRef = ref(database, "groupMessages");
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      groupChatId: groupChatId,
      senderID: currentUserId,
      senderName: currentUserName,
      text: messageText,
      timestamp: new Date().toISOString(),
    });
    messageInput.value = "";
  } catch (error) {
    console.error(error.stack);
    displayError("Error sending message: " + error.message);
  }
}

function loadMessages(groupChatId) {
  try {
    const messagesContainer = document.getElementById("messagesContainer");
    messagesContainer.innerHTML = "";
    const messagesRef = ref(database, "groupMessages");
    const messagesQuery = query(
      messagesRef,
      orderByChild("groupChatId"),
      equalTo(groupChatId)
    );
    onChildAdded(messagesQuery, (snapshot) => {
      const message = snapshot.val();
      if (!message) return;
      const messageEl = document.createElement("div");
      messageEl.classList.add("message");
      messageEl.textContent = `${message.senderName}: ${message.text}`;
      messageEl.dataset.id = snapshot.key;
      const currentUserRole = sessionStorage.getItem("role") || "user";
      const currentUserId = sessionStorage.getItem("currentID") || "unknown";
      if (
        currentUserRole === "admin" &&
        currentChannelOwner === currentUserId
      ) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.classList.add("delete-btn");

        deleteBtn.addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this message?")) {
            try {
              await remove(ref(database, "groupMessages/" + snapshot.key));
            } catch (err) {
              console.error(err);
              displayError("Error deleting message: " + err.message);
            }
          }
        });

        messageEl.appendChild(deleteBtn);
      }

      onChildRemoved(messagesRef, (snapshot) => {
        const messageEl = document.querySelector(
          `.message[data-id="${snapshot.key}"]`
        );
        messageEl.remove();
      });

      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  } catch (error) {
    console.error(error.stack);
    displayError("Error loading messages: " + error.message);
  }
}

function goBackToChannels() {
  try {
    const chatView = document.getElementById("chatView");
    if (chatView) {
      chatView.remove();
    }
    document.getElementById("channelsContainer").style.display = "block";
    const createChannelEl = document.getElementById("createchannelSection");
    if (createChannelEl) {
      createChannelEl.style.display = "block";
    }
  } catch (error) {
    console.error(error.stack);
    displayError("Error going back to channels: " + error.message);
  }
}

export { displayChatUI, goBackToChannels, sendMessage, loadMessages };
