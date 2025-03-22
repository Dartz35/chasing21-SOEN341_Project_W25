// contact.js

import { database } from "./firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

/**
 * Retrieves the current user's friends and displays their usernames
 * in the element with the ID "contacts-container".
 */
export function renderFriends() {
  const container = document.getElementById("contacts-container");
  container.innerHTML = "<p>Loading friends...</p>";

  // Get the current user's email from sessionStorage
  const currentUserEmail = sessionStorage.getItem("email");
  if (!currentUserEmail) {
    container.innerHTML = "<p>Error: No user is logged in.</p>";
    console.error("No user email found in sessionStorage.");
    return;
  }
  
  console.log("Current user email:", currentUserEmail);

  // Format the email for Firebase keys (replace '.' with ',')
  const currentUserKey = currentUserEmail.replace(/\./g, ",");
  const currentUserRef = ref(database, `users/${currentUserKey}`);

  // Retrieve the current user's record to get their friend list
  get(currentUserRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        container.innerHTML = "<p>Error: User record not found.</p>";
        console.error("User record not found for key:", currentUserKey);
        return;
      }

      const userData = snapshot.val();
      console.log("Current user data:", userData);
      const friends = userData.friends || [];
      console.log("Friends list from user data:", friends);
      
      if (friends.length === 0) {
        container.innerHTML = "<p>You have no friends added.</p>";
        console.log("No friends found for the current user.");
        return;
      }

      // Retrieve all users so we can match friend IDs to user records
      const usersRef = ref(database, "users");
      get(usersRef)
        .then((usersSnapshot) => {
          if (!usersSnapshot.exists()) {
            container.innerHTML = "<p>Error: No users data found.</p>";
            console.error("No users data found in Firebase.");
            return;
          }

          const allUsers = usersSnapshot.val();
          let html = "<h2>Your Friends</h2>";
          let friendFound = false;
          
          // Loop through all user records and display those whose IDs are in the friends array.
          for (const key in allUsers) {
            const friend = allUsers[key];
            // Log each friend record for debugging.
            console.log("Checking friend record:", friend);
            if (friends.includes(friend.id)) {
              friendFound = true;
              html += `<p>${friend.username || "No username"}</p>`;
            }
          }
          
          if (!friendFound) {
            html += "<p>No matching friend records found.</p>";
            console.warn("Friends list exists, but no matching friend records found in users.");
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
      container.innerHTML = "<p>Error loading your data.</p>";
    });
}
