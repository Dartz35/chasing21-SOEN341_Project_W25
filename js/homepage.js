import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  ref,
  get,
  set,
  update,
  push,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
  authDomain: "chathaven-d181a.firebaseapp.com",
  projectId: "chathaven-d181a",
  storageBucket: "chathaven-d181a.firebasestorage.app",
  messagingSenderId: "885486697811",
  appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
  measurementId: "G-D1W5TPK13Q",
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };


const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");

document.getElementById("social-link").addEventListener("click", function(event) {
  event.preventDefault(); // Prevent page reload

  document.getElementById("social-buttons").style.display = "block";
  document.getElementById("home-buttons").style.display = "none"; 
 
});

document.getElementById("go-back").addEventListener("click", function() {
  document.getElementById("social-buttons").style.display = "none";
  document.getElementById("home-buttons").style.display = "block"; 
  
});




const usersRef = ref(database, 'users');

get(usersRef)
.then((snapshot) => {
  if (snapshot.exists()) {
    const allUsers = snapshot.val();


    const userListContainer = document.querySelector('.listProfiles');


    userListContainer.innerHTML = '';


    for (const email in allUsers) {
      const user = allUsers[email];


      let userDiv = document.createElement('div');
      userDiv.classList.add('user-item');
      

      userDiv.innerHTML = `
        <img src="../images/avatar.png" alt="">
        <div id="item-profile" class="item-profile">
          <span>${user.name}</span>
          <p>${email}</p>
        </div>
      `;


      userListContainer.appendChild(userDiv);
      

      const newChatRef = push(ref(database, 'userChats'));
     

      const currentUser = sessionStorage.getItem("username");
      const currentID = sessionStorage.getItem("currentID");
    

function checkExistingChat(userID, currentID) {
const userChatsRef = ref(database, "userChats");

return get(userChatsRef)
  .then(snapshot => {
    let existingChatID = null;

    snapshot.forEach(childSnapshot => {
      const chatData = childSnapshot.val();
      

      if (
        (chatData.ReceiverID === userID && chatData.SenderID === currentID) ||
        (chatData.ReceiverID === currentID && chatData.SenderID === userID)
      ) {
        existingChatID = chatData.ChatID;
      }
    });

    return existingChatID;
  })
  .catch(error => {
    console.error("Error checking for existing chat:", error.message);
    return null;
  });
}

var currentChatID = null;


userDiv.addEventListener('click', () => {
const userID = user.id;
const currentUserID = currentID;
const chatID = newChatRef.key;
currentChatID = chatID;


checkExistingChat(userID, currentUserID)
  .then(existingChatID => {
    if (existingChatID) {
      console.log("Found existing chat with ID: " + existingChatID);

      currentChatID = existingChatID;
       loadMessages(currentChatID);
    } else {
      console.log("No existing chat found, creating a new one...");
      messagesContainer.innerHTML = "";
      const chatRefCurrent = push(ref(database, "userChats"));
      const chatRefUser = push(ref(database, "userChats"));

      const chatDataCurrent = {
        ChatID: chatID,
        LastMessage: "",
        ReceiverID: userID,
        SenderID: currentUserID,
        UpdatedDate: Date.now()
      };

      const chatDataUser = {
        ChatID: chatID,
        LastMessage: "",
        ReceiverID: currentUserID,
        SenderID: userID,
        UpdatedDate: Date.now()
      };


      Promise.all([ 
        set(chatRefCurrent, chatDataCurrent),
        set(chatRefUser, chatDataUser)
      ])
      .then(() => {
        alert(`Chat created successfully with ID: ${chatID}`);
        currentChatID = chatID;
      })
      .catch(error => {
        console.error("Error creating chat:", error.message);
      });


      const messagesRef = ref(database, `messages/${chatID}`);


      const newMessageRef = push(messagesRef);

      set(newMessageRef, {
        message: "Hello!",
        senderID: currentUserID,
        timestamp: Date.now()
      })
      .then(() => console.log("Message sent to Firebase!"))
      .catch((error) => console.error("Error sending message:", error));
    }
  })
  .catch(error => {
    console.error("Error checking for existing chat:", error.message);
  });
});


sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", function (e) {
if (e.key === "Enter") {
  sendMessage(currentChatID);
}
});

    
    }

    

  } else {
    alert("No users found in the database.");
  }
})


  .catch((error) => {
    console.error("Error fetching users:", error);
  });


  

  function sendMessage(currChatID) {
    const logedinUserID = sessionStorage.getItem("currentID");
    const messageText = chatInput.value.trim();

    if (messageText !== "") {
        // Append message instantly to UI
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.textContent = messageText;
        if (logedinUserID) messageDiv.style.color = 'blue'; // Highlight user's messages
        messagesContainer.appendChild(messageDiv);
        chatInput.value = "";
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Firebase Database Reference
        const messagesRef = ref(database, `messages/${currChatID}`);
        const newMessageRef = push(messagesRef);

        // Store Message in Firebase
        set(newMessageRef, { message: messageText, senderID: logedinUserID })
            .then(() => console.log("Message sent to Firebase!"))
            .catch((error) => console.error("Error sending message:", error));
    }
}

let isListenerAttached = false;

function listenForNewMessages(currChatID) {
    if (isListenerAttached) return;
    isListenerAttached = true; 

    const messagesRef = ref(database, `messages/${currChatID}`);

    onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        if (!messageData) return;

        const messageText = messageData.message;
        const senderID = messageData.senderID;


        if (!document.querySelector(`.message[data-id="${snapshot.key}"]`)) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.setAttribute("data-id", snapshot.key);
            messageDiv.textContent = messageText;

            if (senderID === sessionStorage.getItem("currentID")) {
                messageDiv.style.color = 'blue'; 
            }

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });
}

function loadMessages(currChatID) {
    if (!currChatID) {
        console.error("No chat ID provided.");
        return;
    }

    messagesContainer.innerHTML = "";

    const messagesRef = ref(database, `messages/${currChatID}`);

    onChildAdded(messagesRef, (snapshot) => {
        if (!document.querySelector(`.message[data-id="${snapshot.key}"]`)) {
            const messageData = snapshot.val();
            const messageText = messageData?.message;
            const senderID = messageData?.senderID;

            if (messageText) {
                const messageDiv = document.createElement("div");
                messageDiv.classList.add("message");
                messageDiv.setAttribute("data-id", snapshot.key);
                messageDiv.textContent = messageText;

                if (senderID === sessionStorage.getItem("currentID")) {
                    messageDiv.style.color = 'blue';
                }

                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const currChatID = "your_chat_id_here";
    loadMessages(currChatID);
});

