import { database } from "./firebaseConfig.js";
import { ref, query, orderByChild, equalTo, get,push } from "firebase/database";

export function getNoticesForCurrentUser(currentUserEmail) {
  if (!currentUserEmail) {
    console.error("Current user email not found.");
    return;
  }

  const emailKey = currentUserEmail.replace(/\./g, ",");
  const noticesRef = ref(database, `notices/${emailKey}`);

  return get(noticesRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const notices = snapshot.val();
        const results = Object.entries(notices).map(([id, data]) => ({
          id,
          ...data,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
        return results;
      } else {
        console.log("No notices found for this user.");
        return [];
      }
    })
    .catch((error) => {
      console.error("Error fetching notices:", error);
      return [];
    });
}

// Example usage of the function
// getNoticesForCurrentUser().then((results) => {
//   console.log("Filtered notices:", results);
// });




function sendNotice(friendUserKey, currentUserData, message) {
  // Reference to the notices of the specific friend
  const noticeRef = ref(database, `notices/${friendUserKey}`);

  // New notice data
  const newNotice = {
    from: currentUserData.email,
    message: message,
    timestamp: Date.now(),
  };

  // Push the new notice to the database
  push(noticeRef, newNotice)
    .then(() => {
      console.log("New notice sent:", newNotice);
    })
    .catch((error) => {
      console.error("Error sending notice:", error);
    });
}

// Example usage of the function
const currentUserData = {
  email: "jane.example.com'",
  name: "John Doe",
};
const friendUserKey = "jane,example,com"; // The friend user key (replace '.' with ',' for Firebase keys)
const message = `You have a new friend request from ${currentUserData.name}`;

// sendNotice(friendUserKey, currentUserData, message);


export function getAllNotices() {
    return new Promise((resolve, reject) => {
      // Reference to the 'notices' path in Firebase
      const noticesRef = ref(database, "notices");
  
      // Get all notices from the database
      get(noticesRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const allUserNotices = snapshot.val();
            const allNotices = [];
  
            // Loop through each userKey and their notices
            Object.entries(allUserNotices).forEach(([userKey, notices]) => {
              // Loop through each notice and push them to the allNotices array
              Object.entries(notices).forEach(([noticeId, notice]) => {
                allNotices.push({
                  id: noticeId,
                  to: userKey.replace(/,/g, "."), // Convert key format back to email format
                  ...notice
                });
              });
            });
  
            resolve(allNotices); // Return all notices
          } else {
            resolve([]); // No notices found
          }
        })
        .catch((error) => {
          console.error("Error fetching all notices:", error);
          reject(error); // Reject the promise in case of an error
        });
    });
  }
  
  // Example usage of the function
  // getAllNotices()
  //   .then((notices) => {
  //     console.log("All notices:", notices);
  //     return notices;
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //   });