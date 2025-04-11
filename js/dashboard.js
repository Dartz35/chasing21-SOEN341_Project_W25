import { auth, database } from "./firebaseConfig.js";
import { signOut } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { updateNameUI, updateProfilePictureUI } from "./pageLoading.js";
import { toggleSidebar } from "./header.js";
import { getNoticesForCurrentUser } from "./notice.js";

function Dashboard() {
  const [notices, setNotices] = React.useState([]); // State to store notices
  const email = sessionStorage.getItem("email");
  React.useEffect(() => {
    // Fetch all notices when the component mounts
    getNoticesForCurrentUser(email)
      .then((noticesData) => {
        setNotices(noticesData); // Update state with fetched notices
      })
      .catch((error) => {
        console.error("Error fetching notices:", error);
      });
  }, []);
  const renderNotices = () => {
    return notices.map((notice, index) =>
      React.createElement(
        "li",
        { key: index },
        React.createElement("span", null, notice.message) // Adjust this based on the structure of your notices
      )
    );
  };

  return React.createElement(
    "div",
    null,
    // Sidebar Profile
    React.createElement(
      "div",
      { id: "sidebar", className: "sidebar" },
      React.createElement(
        "button",
        { className: "closeBtn sidebarToggle", onClick: toggleSidebar },
        "✕"
      ),
      React.createElement("h2", null, "Dashboard"),
      React.createElement(
        "div",
        { className: "profile" },
        React.createElement("img", {
          className: "profilePic",
          alt: "Profile Picture",
          src: "../images/defaultUserLogo.png",
        }),
        React.createElement("h3", { className: "userName name" }),
        React.createElement("span", { className: "userInfo role" }),
        React.createElement("span", { className: "userInfo email" }),
        React.createElement(
          "div",
          { className: "status" },
          React.createElement("span", null, "Status: "),
          React.createElement(
            "select",
            {
              id: "statusDropdown",
              onChange: handleStatusChange,
            },
            React.createElement("option", { value: "online" }, "Online"),
            React.createElement("option", { value: "away" }, "Away")
          )
        )
      ),

      React.createElement(
        "ul",
        { className: "dashBtns" },

        React.createElement(
          "li",
          null,
          React.createElement(
            "button",
            {
              className: "profBtns toggleEditProfile",
              onClick: toggleEditProfile,
            },
            React.createElement("i", { className: "fas fa-pen" }),
            " Edit Profile"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "HomePage.html", className: "profBtns" },
            React.createElement("i", { className: "fas fa-home" }),
            " Home"
          )
        ),

        React.createElement(
          "li",
          null,
          React.createElement(
            "button",
            {
              className: "profBtns toggleNotification ",
              onClick: toggleNotification,
            },
            React.createElement("i", { className: "fas fa-bell" }),
            " Notifications"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "channels.html", className: "profBtns" },
            React.createElement("i", { className: "fas fa-users" }),
            " Channels"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "contact.html", className: "profBtns" },
            React.createElement("i", { className: "fas fa-address-book" }),
            " Contacts"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "button",
            {
              className: "profBtns toggleSettings",
              onClick: toggleSettings,
            },
            React.createElement("i", { className: "fas fa-cog" }),
            " Settings"
          )
        ),

        React.createElement("hr"),

        React.createElement(
          "li",
          null,
          React.createElement(
            "button",
            {
              id: "logoutBtn",
              className: "profBtns logoutBtn",
              onClick: handleLogout,
            },
            React.createElement("i", { className: "fas fa-sign-out-alt" }),
            " Logout"
          )
        )
      )
    ),
    //edit setting
    React.createElement(
      "div",
      { id: "toggleSettings", className: "editSettings", hidden: true },
      React.createElement(
        "button",
        { className: "backBtn toggleSettings", onClick: toggleSettings },
        "←"
      ),
      React.createElement("h2", null, "Settings"),
      React.createElement(
        "button",
        { className: "settingsBtn" },
        "Change Email 📩"
      ),
      React.createElement(
        "button",
        { className: "settingsBtn" },
        "Change Password 🔒"
      ),
      React.createElement(
        "button",
        { className: "settingsBtn deleteBtn" },
        "Delete Account"
      )
    ),
    // for notification
    React.createElement(
      "div",
      { id: "toggleNotification", className: "notification", hidden: true },
      React.createElement(
        "button",
        { className: "backBtn  toggleSettings", onClick: toggleNotification },
        "←"
      ),
      React.createElement("h3", null, "Notifications"),
      React.createElement("ul", null, renderNotices())
    ),
    // Edit Profile Display

    React.createElement(
      "div",
      { id: "editProfile", className: "editProfile", hidden: true },
      React.createElement(
        "button",
        { className: "backBtn toggleEditProfile", onClick: toggleEditProfile },
        "←"
      ),
      React.createElement("h2", null, "Edit Profile"),
      React.createElement(
        "label",
        { htmlFor: "newProfilePic", className: "changePicBtn" },
        React.createElement("img", {
          className: "profilePic",
          src: "../images/defaultUserLogo.png",
        })
      ),
      React.createElement(
        "label",
        { htmlFor: "newProfilePic", className: "changePicText" },
        "Edit Picture"
      ),
      React.createElement("input", {
        type: "file",
        id: "newProfilePic",
        accept: "image/*",
        hidden: true,
        onChange: handleProfilePicChange,
      }),
      React.createElement(
        "button",
        {
          id: "deletePic",
          className: "changePicText",
          onClick: handleDeletePicture,
        },
        "Delete Picture"
      ),
      React.createElement(
        "div",
        { className: "input" },
        React.createElement("label", { htmlFor: "editName" }, "Name: "),
        React.createElement("input", {
          className: "name",
          type: "text",
          id: "editName",
          name: "name",
          autoComplete: "name",
        }),
        React.createElement(
          "button",
          {
            id: "confirmName",
            className: "confirmChange",
            onClick: handleConfirmName,
          },
          "✔️"
        )
      )
    )
  );
}
function toggleNotification() {
  const editSettings = document.getElementById("toggleNotification");
  const sidebar = document.getElementById("sidebar").classList;

  sidebar.toggle("active");
  editSettings.hidden = !editSettings.hidden;
}
function toggleSettings() {
  const editSettings = document.getElementById("toggleSettings");
  const sidebar = document.getElementById("sidebar").classList;

  sidebar.toggle("active");
  editSettings.hidden = !editSettings.hidden;
}
// Toggle Edit Profile Visibility
function toggleEditProfile() {
  const editProfile = document.getElementById("editProfile");
  const sidebar = document.getElementById("sidebar").classList;

  sidebar.toggle("active");
  editProfile.hidden = !editProfile.hidden;
}

// Validate and Update User's New Name
async function handleConfirmName(event) {
  event.preventDefault();
  const newName = document.getElementById("editName").value.trim();
  const user = auth.currentUser;

  if (user) {
    const userRef = ref(database, "users/" + user.email.replace(".", ","));
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();

      if (newName) {
        // Check if the new name is different from the old name
        if (newName !== userData.name) {
          await update(userRef, { name: newName });
          updateNameUI(newName);
          alert("Name updated successfully!");
        }
      } else {
        alert("Name cannot be empty.");
        document.getElementById("editName").value = userData.name; // Reset to previous name
      }
    }
  } else {
    alert("Please log in to change your name");
    window.location.href = "../html/loginPage.html"; // Redirect if not logged in
  }
}

// Logout Function
async function handleLogout() {
  if (!auth.currentUser) return;
  try {
    window.loggingOut = true;

    // Get the current user's ID
    const userId = auth.currentUser.uid;

    // Create a reference to the user's status
    const userStatusRef = ref(database, "status/" + userId);

    // Update the user's status to offline
    await update(userStatusRef, { state: "offline", lastChanged: Date.now() });
    console.log(`Set user ${userId} to offline before logging out.`);

    // Proceed with the standard logout process
    await signOut(auth);
    sessionStorage.clear();

    alert("You have been logged out.");
    window.location.href = "../html/loginPage.html";
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Error logging out. Please try again.");
  }
}

// Delete Profile Picture Function
async function handleDeletePicture() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(database, "users/" + user.email.replace(".", ","));

  // Update database with empty profile picture
  await update(userRef, {
    profilePicture: "",
  });

  // Update UI with default profile picture
  updateProfilePictureUI("../images/defaultUserLogo.png");
  document.getElementById("newProfilePic").value = null;

  alert("Profile picture deleted successfully!");
  console.log("Profile picture deleted successfully!");
}

// Change Profile Picture Function
function handleProfilePicChange(event) {
  console.log("Triggering change event...");
  const newPic = event.target.files[0]; // Get the first selected file
  const user = auth.currentUser;

  if (user) {
    if (newPic) {
      console.log("File selected: ", newPic.name);

      // Read the file and update the database
      const reader = new FileReader();
      reader.onload = async function (e) {
        const userRef = ref(database, "users/" + user.email.replace(".", ","));
        await update(userRef, {
          profilePicture: e.target.result,
        });

        // Update UI with new profile picture
        updateProfilePictureUI(e.target.result);
        console.log("Profile picture updated successfully!");
        console.log(e.target.result);
        alert("Profile picture updated successfully!");
      };

      // Read the file as a data URL (convert to base64)
      reader.readAsDataURL(newPic);
    } else {
      alert("No file selected.");
      console.log("No file selected.");
    }
  } else {
    alert("Please log in to change your profile picture");
    window.location.href = "../html/loginPage.html"; // Redirect if not logged in
  }
}
async function handleStatusChange(event) {
  const newStatus = event.target.value;
  const user = auth.currentUser;

  if (user) {
    const userStatusRef = ref(database, "status/" + user.uid);

    await update(userStatusRef, { state: newStatus, lastChanged: Date.now() });
  } else {
    alert("Please log in to change your status");
    window.location.href = "../html/loginPage.html";
  }
}

export {
  Dashboard,
  handleLogout,
  handleDeletePicture,
  handleConfirmName,
  handleProfilePicChange,
  toggleEditProfile,
  toggleSettings,
  toggleNotification,
  handleStatusChange,
};
