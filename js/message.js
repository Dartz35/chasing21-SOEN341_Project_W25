import { database } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  update,
  push,
  off,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

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

// Entry Point: Fetch Users & Populate UI
fetchUsers();

/**
 * Fetches all users from the database and displays them
 */
async function fetchUsers() {
  try {
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      alert("No users found in the database.");
      return;
    }
    const allUsers = snapshot.val();
    populateUserList(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

/**
 * Populates the user list UI with retrieved users
 */
function populateUserList(allUsers) {
  const userListContainer = document.querySelector(".listProfiles");
  userListContainer.innerHTML = ""; // Clear existing list

  let firstUser = null;

  for (const email in allUsers) {
    const user = allUsers[email];
    if (user.id === sessionStorage.getItem("currentID")) continue; // Skip current user

    const userDiv = createUserElement(user, email);
    userListContainer.appendChild(userDiv);

    if (!firstUser) {
      firstUser = user; // Store the first user
    }
  }

  if (firstUser) {
    handleUserClick(firstUser); // Automatically open chat with the first user
  }
}

/**
 * Creates a user element for the UI
 */
function createUserElement(user, email) {
  let userDiv = document.createElement("div");
  userDiv.classList.add("user-item");

  let src = user.profilePicture || "../images/defaultUserLogo.png";
  userDiv.innerHTML = `
    <img src="${src}" alt="User Profile Picture">
    <div id="item-profile" class="item-profile">
      <span>${user.name}</span>
      <p>${email.replace(",", ".")} 
         <button class="add-friend-btn">Add Friend</button>
      </p>
    </div>
  `;

  // Attach event listener to the "Add Friend" button
  const addFriendBtn = userDiv.querySelector(".add-friend-btn");
  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent triggering the userDiv's click event (which opens the chat)
      addFriend(user);
    });
  }

  // When the overall userDiv is clicked (outside of the button), open the chat
  userDiv.addEventListener("click", () => handleUserClick(user));
  return userDiv;
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

  if (messageText !== "" && currentChatID) {

    if(chatOutputContainer && chatOutputContainer.textContent.trim() !== ""){
      appendMessageToUI("Reply: "+chatOutputContainer.textContent);
      appendMessageToUI(messageText);
      storeMessageInDatabase(logedinUserID, messageText);
      chatOutputContainer.innerHTML = '';
    }else{
    appendMessageToUI(messageText);
    storeMessageInDatabase(logedinUserID, messageText);
    chatOutputContainer.innerHTML = '';}

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

/**
 * Adds a friend by updating both the current user's and the target friend's records.
 */
function addFriend(friend) {
  // Retrieve the current user's email from sessionStorage
  const currentUserEmail = sessionStorage.getItem("email");
  if (!currentUserEmail) {
    alert("Current user email not found.");
    return;
  }
  // Format emails for Firebase keys (replace '.' with ',')
  const currentUserKey = currentUserEmail.replace(/\./g, ",");
  if (!friend.email) {
    alert("Friend email not available.");
    return;
  }
  const friendUserKey = friend.email.replace(/\./g, ",");

  const currentUserRef = ref(database, "users/" + currentUserKey);
  const friendUserRef = ref(database, "users/" + friendUserKey);

  // Update current user's friend list
  get(currentUserRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        alert("Current user record not found.");
        return;
      }
      const currentUserData = snapshot.val();
      let currentFriends = currentUserData.friends || [];
      if (currentFriends.includes(friend.id)) {
        alert("User is already your friend.");
        return;
      }
      currentFriends.push(friend.id);
      return update(currentUserRef, { friends: currentFriends })
        .then(() => get(friendUserRef))
        .then((snapshot) => {
          if (!snapshot.exists()) {
            alert("Friend record not found.");
            return;
          }
          const friendData = snapshot.val();
          let friendFriends = friendData.friends || [];
          if (!friendFriends.includes(currentUserData.id)) {
            friendFriends.push(currentUserData.id);
            return update(friendUserRef, { friends: friendFriends });
          }
        });
    })
    .then(() => {
      alert("Friend added successfully!");
    })
    .catch((error) => {
      console.error("Error adding friend:", error);
      alert("Failed to add friend.");
    });
}
