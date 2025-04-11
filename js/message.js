import { database } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  push,
  query,
  orderByChild,
  onChildAdded, // Import onChildAdded
  onChildChanged, // Import onChildChanged
} from "firebase/database";

const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");

let currentChatID = null; // To store the ID of the currently open chat
let isListenerAttached = false; // Flag to prevent multiple listeners

// Function to detach the message listener
function detachMessageListener() {
  if (currentChatID && isListenerAttached) {
    const messagesRef = ref(database, `messages/${currentChatID}`);
    // Remove all listeners from the messagesRef (if needed, more specific detachment can be implemented)
    isListenerAttached = false;
    console.log(`Detached listener for chat ID: ${currentChatID}`);
  }
}

// Firebase References
const usersRef = ref(database, "users");
const userChatsRef = ref(database, "userChats");
const statusRef = ref(database, "status");

// Entry Point: Fetch Users & Populate UI
fetchUsers();
listenForStatusChanges(); // Call the function to start listening for status changes

// Helper functions
function findUserById(usersData, userId) {
  for (const [email, user] of Object.entries(usersData)) {
    if (user.id === userId) {
      return {
        ...user,
        email: email.replace(/,/g, "."),
      };
    }
  }
  return null;
}

/**
 * Fetches all users from the database and displays them
 */
async function fetchUsers() {
  try {
    const currentUserID = sessionStorage.getItem("currentID");

    const friendsQuery = query(
      ref(database, "Friends"),
      orderByChild("timestamp")
    );
    const snapshot = await get(friendsQuery);
    let friendsData = [];

    if (snapshot.exists()) {
      const usersSnapshot = await get(ref(database, "users"));
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

      snapshot.forEach((childSnapshot) => {
        const friendship = childSnapshot.val();

        if (
          friendship.user1 === currentUserID ||
          friendship.user2 === currentUserID
        ) {
          const friendId =
            friendship.user1 === currentUserID
              ? friendship.user2
              : friendship.user1;
          const friend = findUserById(usersData, friendId);

          if (friend) {
            friendsData.push(friend);
          }
        }
      });
      const statusSnapshot = await get(statusRef);
      const statuses = statusSnapshot.val() || {};
      populateUserList(friendsData, statuses);
    } else {
      console.log("No friends found in the database.");
      return;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

/**
 * Populates the user list UI with retrieved users
 */
function populateUserList(allUsers, statuses) {
  const userListContainer = document.querySelector(".listProfiles");
  const messageArea = document.querySelector(".messages-area");

  userListContainer.innerHTML = ""; // Clear existing list

  if (allUsers.length === 0) {
    userListContainer.innerHTML = "<p>No friends found.</p>";
    messageArea.innerHTML =
      '<p style="color: white; font-size: 2em;">Add a friend to start chatting.</p>'; // Hide message area if no friends
    return;
  }
  let firstUser = null;

  for (const user in allUsers) {
    const userData = allUsers[user];
    if (userData.id === sessionStorage.getItem("currentID")) continue;

    const status = statuses[userData.id]?.state || "offline";
    const userDiv = createUserElement(userData, userData.email, status);
    userListContainer.appendChild(userDiv);

    if (!firstUser) {
      firstUser = userData;
    }
  }

  if (firstUser) {
    handleUserClick(firstUser); // Automatically open chat with the first user
  }
}
/**
 * Creates a user element for the UI
 */
function createUserElement(user, email, status) {
  let userDiv = document.createElement("div");
  userDiv.classList.add("user-item");
  userDiv.dataset.id = user.id;

  const statusClass =
    status === "online"
      ? "online-status"
      : status === "away"
      ? "away-status"
      : "offline-status";

  let src = user.profilePicture || "../images/defaultUserLogo.png";
  userDiv.innerHTML = `
    <img src="${src}" alt="User Profile Picture">
    <div id="item-profile" class="item-profile">
      <span>${user.name} <span class="status-indicator ${statusClass}"></span></span>
      <p>${email}</p>
    </div>
  `;

  const statusIndicator = userDiv.querySelector(".status-indicator");
  if (statusIndicator) {
    statusIndicator.addEventListener("click", () =>
      showLastOnlineTime(user.id)
    );
    statusIndicator.style.cursor = "pointer";
  }

  // When the overall userDiv is clicked (outside of the button), open the chat
  userDiv.addEventListener("click", () => handleUserClick(user));
  return userDiv;
}

async function showLastOnlineTime(userId) {
  const statusRef = ref(database, `status/${userId}`);
  const snapshot = await get(statusRef);

  if (snapshot.exists()) {
    const userStatus = snapshot.val().state;

    if (userStatus === "offline") {
      const lastChanged = snapshot.val().lastChanged;
      const dateTime = new Date(lastChanged);
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      };
      alert(`Last Online: ${dateTime.toLocaleDateString("en-US", options)}`);
    } else {
      // Do nothing if the user is online or away
      console.log(`User is ${userStatus}, no need to show last online time.`);
    }
  } else {
    // If there's no status information (e.g., user never logged in)
    const defaultDate = new Date("2025-03-19T10:00:00"); // Default date for when there's no data
    alert(
      `Last Online: ${defaultDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })} `
    );
  }
}

/**
 * Handles user click event (opens chat)
 */
function handleUserClick(user) {
  const userID = user.id;
  const currentUserID = sessionStorage.getItem("currentID");
  const chatID = push(userChatsRef).key; // Generate a unique chat ID

  detachMessageListener();
  messagesContainer.innerHTML = ""; // Clear previous messages

  checkExistingChat(userID, currentUserID)
    .then((existingChatID) => {
      if (existingChatID) {
        console.log("Found existing chat with ID: " + existingChatID);
        currentChatID = existingChatID;
        loadMessages(currentChatID);
      } else {
        createNewChat(userID, currentUserID, chatID);
      }
      document.getElementById("currentUser").textContent = user.name;
      document.getElementById("currentProfilePic").src =
        user.profilePicture || "../images/defaultUserLogo.png";
    })
    .catch((error) =>
      console.error("Error checking for existing chat:", error.message)
    );
}

/**
 * Checks if a chat already exists between two users
 */
async function checkExistingChat(userID, currentID) {
  try {
    const snapshot = await get(userChatsRef);
    let existingChatID = null;

    snapshot.forEach((childSnapshot) => {
      const chatData = childSnapshot.val();
      if (
        (chatData.ReceiverID === userID && chatData.SenderID === currentID) ||
        (chatData.ReceiverID === currentID && chatData.SenderID === userID)
      ) {
        existingChatID = chatData.ChatID;
      }
    });

    return existingChatID;
  } catch (error) {
    console.error("Error checking for existing chat:", error.message);
    return null;
  }
}

/**
 * Creates a new chat if no existing chat is found
 */
function createNewChat(userID, currentUserID, chatID) {
  console.log("No existing chat found, creating a new one...");

  const chatRefCurrent = push(userChatsRef);
  const chatRefUser = push(userChatsRef);

  const chatDataCurrent = {
    ChatID: chatID,
    LastMessage: "",
    ReceiverID: userID,
    SenderID: currentUserID,
    UpdatedDate: Date.now(),
  };

  const chatDataUser = {
    ChatID: chatID,
    LastMessage: "",
    ReceiverID: currentUserID,
    SenderID: userID,
    UpdatedDate: Date.now(),
  };

  Promise.all([
    set(chatRefCurrent, chatDataCurrent),
    set(chatRefUser, chatDataUser),
  ])
    .then(() => {
      console.log(`Chat created successfully with ID: ${chatID}`);
      currentChatID = chatID;
      loadMessages(currentChatID);
    })
    .catch((error) => console.error("Error creating chat:", error.message));
}

/**
 * Sends a message in the current chat
 */
function sendMessage() {
  const logedinUserID = sessionStorage.getItem("currentID");
  const messageText = chatInput.value.trim();

  const chatOutputContainer = document.getElementById("reply-message-cont");

  if (messageText !== "" && currentChatID) {
    if (chatOutputContainer && chatOutputContainer.textContent.trim() !== "") {
      appendMessageToUI("Reply: " + chatOutputContainer.textContent);
    }
    appendMessageToUI(messageText);
    storeMessageInDatabase(logedinUserID, messageText);
    chatOutputContainer.innerHTML = "";
  } else if (!currentChatID) {
    alert("Please select a user to start chatting.");
  }
}

/**
 * Appends a sent message to the UI instantly
 */
function appendMessageToUI(messageText) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "sent");
  messageDiv.textContent = messageText;
  messagesContainer.appendChild(messageDiv);
  chatInput.value = "";

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Stores the message in Firebase
 */
function storeMessageInDatabase(senderID, messageText) {
  const messagesRef = ref(database, `messages/${currentChatID}`);
  const newMessageRef = push(messagesRef);

  set(newMessageRef, {
    message: messageText,
    senderID: senderID,
    timestamp: Date.now(),
  })
    .then(() => console.log("Message sent to Firebase!"))
    .catch((error) => console.error("Error sending message:", error));
}

// ✅ Prevent multiple listeners from being attached - now managed with detach
function listenForNewMessages(currChatID) {
  if (isListenerAttached && currChatID === currentChatID) {
    return; // Avoid attaching multiple listeners for the same chat
  }
  detachMessageListener(); // Detach any existing listener
  isListenerAttached = true;
  currentChatID = currChatID; // Update the current chat ID for the listener
  messagesContainer.dataset.chatId = currentChatID; // Store the chat ID in the container

  const messagesRef = ref(database, `messages/${currChatID}`);

  onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    if (!messageData) return;

    const messageText = messageData.message;
    const senderID = messageData.senderID;

    // Only add messages if they belong to the current open chat
    if (messagesContainer.dataset.chatId !== snapshot.ref.parent.key) {
      console.warn("Message ignored: Not from current chat");
      return; // Skip messages from other chats
    }

    // Prevent duplicate messages AND messages sent by the current user
    if (
      senderID !== sessionStorage.getItem("currentID") &&
      !document.querySelector(`.message[data-id="${snapshot.key}"]`)
    ) {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", "received");
      messageDiv.setAttribute("data-id", snapshot.key); // Using the message ID
      messageDiv.textContent = messageText;

      if (senderID === sessionStorage.getItem("currentID")) {
        messageDiv.classList.remove("received");
        messageDiv.classList.add("sent");
      }

      messagesContainer.appendChild(messageDiv);
      console.log("New message received:", messageText);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  console.log(`Attached listener for chat ID: ${currChatID}`);
}

// ✅ Load Messages on Page Load
function loadMessages(currChatID) {
  if (!currChatID) {
    console.error("No chat ID provided.");
    return;
  }

  messagesContainer.innerHTML = ""; // Clear previous messages
  const messagesRef = ref(database, `messages/${currChatID}`);
  get(messagesRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const messageData = childSnapshot.val();
          const messageText = messageData?.message;
          const senderID = messageData?.senderID;

          if (messageText) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.setAttribute("data-id", childSnapshot.key);
            messageDiv.textContent = messageText;

            if (senderID === sessionStorage.getItem("currentID")) {
              messageDiv.classList.add("sent");
            } else {
              messageDiv.classList.add("received");
            }

            messagesContainer.appendChild(messageDiv);
            messageDiv.onclick = function () {
              const addButton = this.querySelector("#reply-btn");

              if (addButton) {
                // Button is displayed, so remove it
                addButton.remove();
              } else {
                // Button is not displayed, so add it
                // Create the button element
                const addButton = document.createElement("button");
                addButton.textContent = "reply"; // Button text
                addButton.id = "reply-btn"; // Button ID for styling if needed

                // Add button click handler (stopPropagation is important!)
                addButton.onclick = function (event) {
                  event.stopPropagation();
                  console.log("Add Friend clicked for message:", messageText);

                  const replyMessageText = messageText;

                  // Create a new div element for the reply message container
                  const replyContainer = document.createElement("div");

                  // Add a CSS class to style the reply message (optional)
                  replyContainer.classList.add("reply-message");

                  // Set the text content of the container to the reply message
                  replyContainer.textContent = replyMessageText;

                  // Or, if the reply message might contain HTML, use innerHTML (be cautious)
                  // replyContainer.innerHTML = replyMessageText;

                  // Find a container element in your HTML where you want to display the reply
                  const chatOutputContainer =
                    document.getElementById("reply-message-cont"); // Replace "chat-output" with the actual ID of your output area

                  // Append the reply container to the output container
                  if (chatOutputContainer) {
                    chatOutputContainer.innerHTML = ""; // Clear existing content
                    chatOutputContainer.appendChild(replyContainer);
                  } else {
                    console.error(
                      "Container element with ID 'chat-output' not found."
                    );
                  }
                  // Handle "Add Friend" logic here
                };

                // Append the button to the message div
                this.appendChild(addButton);
              }
            };
          }
        });
      } else {
        console.log("No messages found for this chat.");
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      listenForNewMessages(currentChatID);
    })
    .catch((error) => {
      console.error("Error loading messages:", error);
    });
}

// Event listener for send button
sendBtn.addEventListener("click", sendMessage);

// Event listener for chat input "Enter" keypress
chatInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function listenForStatusChanges() {
  const statusRef = ref(database, "status");

  onChildChanged(statusRef, (snapshot) => {
    const statusData = snapshot.val();
    const userID = snapshot.key;
    const status = statusData?.state || "offline";

    updateUserStatusInUI(userID, status);
  });
}

function updateUserStatusInUI(userID, status) {
  const userDiv = document.querySelector(`.user-item[data-id="${userID}"]`);
  if (!userDiv) return;

  const statusClass =
    status === "online"
      ? "online-status"
      : status === "away"
      ? "away-status"
      : "offline-status";

  const statusSpan = userDiv.querySelector(".item-profile .status-indicator");
  if (statusSpan) {
    statusSpan.className = `status-indicator ${statusClass}`;
    console.log(`User ${userID} is now ${status}`);
  }
}
