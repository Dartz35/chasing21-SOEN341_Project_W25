import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
    ref,
    get,
    set,
    update,
    push,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

import { onChildAdded } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
    authDomain: "chathaven-d181a.firebaseapp.com",
    projectId: "chathaven-d181a",
    storageBucket: "chathaven-d181a.firebasestorage.app",
    messagingSenderId: "885486697811",
    appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
    measurementId: "G-D1W5TPK13Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };

const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");

document
    .getElementById("social-link")
    .addEventListener("click", function (event) {
        event.preventDefault(); // Prevent page reload

        document.getElementById("social-buttons").style.display = "block"; // Show buttons
        document.getElementById("home-buttons").style.display = "none";
    });

document.getElementById("go-back").addEventListener("click", function () {
    document.getElementById("social-buttons").style.display = "none"; // Hide buttons
    document.getElementById("home-buttons").style.display = "block";
});

const usersRef = ref(database, "users");
let currentChatID = null; // To store the ID of the currently open chat
let isListenerAttached = false; // Flag to prevent multiple listeners

// Function to detach the message listener
function detachMessageListener() {
    if (currentChatID && isListenerAttached) {
        const messagesRef = ref(database, `messages/${currentChatID}`);
        // Remove all listeners from the messagesRef
        // This approach might be too broad if other listeners are attached.
        // A more specific approach might be needed if other listeners are added later.
        // For now, simply setting the flag will prevent new listeners,
        // and the old listener will eventually stop if the component unmounts in a real application.
        isListenerAttached = false;
        console.log(`Detached listener for chat ID: ${currentChatID}`);
    }
}

// Retrieve all users from the database
get(usersRef)
    .then((snapshot) => {
        if (snapshot.exists()) {
            const allUsers = snapshot.val(); // Get all users

            // Find the container where the user profiles should be populated
            const userListContainer = document.querySelector(".listProfiles");

            // Clear the list before adding new items (optional)
            userListContainer.innerHTML = "";

            // Loop through all users and display them
            for (const email in allUsers) {
                const user = allUsers[email];

                // Create a new div for each user
                let userDiv = document.createElement("div");
                userDiv.classList.add("user-item");

                // Populate user info (name and email) into the div
                userDiv.innerHTML = `
        <img src="../images/avatar.png" alt="">
        <div id="item-profile" class="item-profile">
          <span>${user.name}</span>
          <p>${email}</p>
        </div>
      `;

                // Append the user div to the listProfiles container
                userListContainer.appendChild(userDiv);

                // userChats collection
                const newChatRef = push(ref(database, "userChats"));

                // current user
                const currentUser = sessionStorage.getItem("username");
                const currentID = sessionStorage.getItem("currentID");

                // Function to check if a chat already exists between the two users
                function checkExistingChat(userID, currentID) {
                    const userChatsRef = ref(database, "userChats");

                    return get(userChatsRef)
                        .then((snapshot) => {
                            let existingChatID = null;

                            snapshot.forEach((childSnapshot) => {
                                const chatData = childSnapshot.val();

                                // Ensure we are checking both directions: currentID to userID or userID to currentID
                                if (
                                    (chatData.ReceiverID === userID &&
                                        chatData.SenderID === currentID) ||
                                    (chatData.ReceiverID === currentID &&
                                        chatData.SenderID === userID)
                                ) {
                                    existingChatID = chatData.ChatID;
                                }
                            });

                            return existingChatID;
                        })
                        .catch((error) => {
                            console.error("Error checking for existing chat:", error.message);
                            return null;
                        });
                }

                // Event listener for the userDiv click event
                userDiv.addEventListener("click", () => {
                    const userID = user.id; // ID of the user clicked on
                    const currentUserID = currentID; // Logged-in user's ID
                    const chatID = newChatRef.key; // Unique chat ID for this interaction

                    // Detach any existing listener before setting up a new one
                    detachMessageListener();
                    messagesContainer.innerHTML = ""; // Clear previous messages

                    // Step 1: Check if the chat exists
                    checkExistingChat(userID, currentUserID)
                        .then((existingChatID) => {
                            if (existingChatID) {
                                // Chat already exists, show it
                                console.log("Found existing chat with ID: " + existingChatID);
                                currentChatID = existingChatID; // Update currentChatID
                                loadMessages(currentChatID);
                                listenForNewMessages(currentChatID);
                            } else {
                                // Step 2: Create new chat if no existing chat
                                console.log("No existing chat found, creating a new one...");
                                // Generate two unique references for storing user chat entries
                                const chatRefCurrent = push(ref(database, "userChats"));
                                const chatRefUser = push(ref(database, "userChats"));

                                const chatDataCurrent = {
                                    ChatID: chatID,
                                    LastMessage: "",
                                    ReceiverID: userID,
                                    SenderID: currentUserID, // Sender's ID (not to be confused with Receiver)
                                    UpdatedDate: Date.now(),
                                };

                                const chatDataUser = {
                                    ChatID: chatID,
                                    LastMessage: "",
                                    ReceiverID: currentUserID, // Receiver's ID (this will be the other user)
                                    SenderID: userID, // Sender's ID (this will be the logged-in user)
                                    UpdatedDate: Date.now(),
                                };

                                // Store two separate chat entries with unique Firebase-generated IDs
                                Promise.all([
                                    set(chatRefCurrent, chatDataCurrent),
                                    set(chatRefUser, chatDataUser),
                                ])
                                    .then(() => {
                                        alert(`Chat created successfully with ID: ${chatID}`);
                                        currentChatID = chatID; // Update currentChatID when new chat is created
                                        loadMessages(currentChatID); // Load the initial "Hello!" message
                                        listenForNewMessages(currentChatID); // Start listening for new messages
                                    })
                                    .catch((error) => {
                                        console.error("Error creating chat:", error.message);
                                    });

                                // Reference to the messages node for this chatID
                                const messagesRef = ref(database, `messages/${chatID}`);

                                // Push new message with a unique ID
                                const newMessageRef = push(messagesRef); // This generates a unique key for each message

                                // Now set the message
                                set(newMessageRef, {
                                    message: "Hello!", // Your actual message
                                    senderID: currentUserID, // Sender's ID
                                    timestamp: Date.now(), // Timestamp for the message
                                })
                                    .then(() => console.log("Message sent to Firebase!"))
                                    .catch((error) =>
                                        console.error("Error sending message:", error)
                                    );
                            }
                        })
                        .catch((error) => {
                            console.error("Error checking for existing chat:", error.message);
                        });
                });
            }
        } else {
            alert("No users found in the database.");
        }
    })

    .catch((error) => {
        console.error("Error fetching users:", error);
    });

function sendMessage() {
    const logedinUserID = sessionStorage.getItem("currentID");
    const messageText = chatInput.value.trim();

    if (messageText !== "" && currentChatID) {
        // Append message instantly to UI
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "sent"); // Add a class to distinguish sent messages
        messageDiv.textContent = messageText;
        messagesContainer.appendChild(messageDiv);
        chatInput.value = "";
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Firebase Database Reference
        const messagesRef = ref(database, `messages/${currentChatID}`);
        const newMessageRef = push(messagesRef);

        // Store Message in Firebase
        set(newMessageRef, { message: messageText, senderID: logedinUserID, timestamp: Date.now() })
            .then(() => console.log("Message sent to Firebase!"))
            .catch((error) => console.error("Error sending message:", error));
    } else if (!currentChatID) {
        alert("Please select a user to start chatting.");
    }
}

// ✅ Prevent multiple listeners from being attached - now managed with detach
function listenForNewMessages(currChatID) {
    if (isListenerAttached && currChatID === currentChatID) {
        return; // Avoid attaching multiple listeners for the same chat
    }
    detachMessageListener(); // Detach any existing listener
    isListenerAttached = true;
    currentChatID = currChatID; // Update the current chat ID for the listener

    const messagesRef = ref(database, `messages/${currChatID}`);

    onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        if (!messageData) return;

        const messageText = messageData.message;
        const senderID = messageData.senderID;

        // Prevent duplicate messages AND messages sent by the current user
        if (senderID !== sessionStorage.getItem("currentID") && !document.querySelector(`.message[data-id="${snapshot.key}"]`)) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message", "received");
            messageDiv.setAttribute("data-id", snapshot.key); // Using the message ID
            messageDiv.textContent = messageText;

            if (senderID === sessionStorage.getItem("currentID")) {
                messageDiv.classList.remove("received");
                messageDiv.classList.add("sent");
            }

            messagesContainer.appendChild(messageDiv);
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

// Remove the initial call to loadMessages on DOMContentLoaded as it should happen when a user is selected.