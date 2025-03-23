// contact.js

import { database } from "./firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

/**
 * Renders the current user's friends (displaying their username) 
 * into the element with the ID "contacts-container".
 */
export function renderFriends() {
  const container = document.getElementById("contacts-container");
  container.innerHTML = "<p>Loading your contacts...</p>";

  // Retrieve the current user's email from sessionStorage
  const currentUserEmail = sessionStorage.getItem("email");
  if (!currentUserEmail) {
    container.innerHTML = "<p>Error: No user is logged in.</p>";
    console.error("No user email found in sessionStorage.");
    return;
  }

  // Convert the email to a Firebase key (replace '.' with ',')
  const currentUserKey = currentUserEmail.replace(/\./g, ",");
  const currentUserRef = ref(database, `users/${currentUserKey}`);

  // Fetch the current user's record to get their friend list.
  get(currentUserRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        container.innerHTML = "<p>Error: Current user record not found.</p>";
        console.error("User record not found for key:", currentUserKey);
        return;
      }

      const userData = snapshot.val();
      const friends = userData.friends || [];
      if (friends.length === 0) {
        container.innerHTML = "<p>You have no friends added.</p>";
        return;
      }

      // Fetch all user records to match friend IDs with user details.
      const usersRef = ref(database, "users");
      get(usersRef)
        .then((usersSnapshot) => {
          if (!usersSnapshot.exists()) {
            container.innerHTML = "<p>Error: No users data found.</p>";
            console.error("No users data found.");
            return;
          }

          const allUsers = usersSnapshot.val();
          let html = "<h2>Your Friends</h2>";
          let foundFriend = false;

          // Iterate over all users and display those whose IDs are in the friend list.
          for (const key in allUsers) {
            const friend = allUsers[key];
            if (friends.includes(friend.id)) {
              foundFriend = true;
              // Display friend's username; fallback to friend.name if username is unavailable.
              html += `<div class="friend-item">
                         <p>${friend.username || friend.name || "No username available"}</p>
                       </div>`;
            }
          }

          if (!foundFriend) {
            html += "<p>No matching friend records found.</p>";
            console.warn("Friends list exists, but no matching friend records were found.");
          }
          container.innerHTML = html;
        })
        .catch((error) => {
          console.error("Error fetching users data:", error);
          container.innerHTML = "<p>Error loading friends data.</p>";
        });
    })
    .catch((error) => {
      console.error("Error fetching current user data:", error);
      container.innerHTML = "<p>Error loading your contacts.</p>";
    });
}
