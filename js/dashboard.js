// Contains the code for all profile-related functions

import { auth, database } from "./firebaseConfig.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { updateNameUI, updateProfilePictureUI } from "./pageLoading.js";
import { toggleSidebar } from "./header.js";

function Dashboard() {
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
        React.createElement("span", { className: "userInfo email" })
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
            "a",
            { href: "#Notifications", className: "profBtns" },
            React.createElement("i", { className: "fas fa-bell" }),
            " Notifications"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "group.html", className: "profBtns" },
            React.createElement("i", { className: "fas fa-users" }),
            " Groups"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "#Contacts", className: "profBtns" },
            React.createElement("i", { className: "fas fa-address-book" }),
            " Contacts"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "button",
            { id: "settingBtn", className: "profBtns toggleSettings" },
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

/*
//Setting function
document.querySelectorAll(".toggleSettings").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const settings = document.getElementById("settings");
    const sidebar = document.getElementById("sidebar").classList;
    sidebar.toggle("active");
    settings.hidden = !settings.hidden;
  });
});*/

// Confirm email change function
/*
document
  .getElementById("confirmEmail")
  .addEventListener("click", async function () {
    const newEmail = document.getElementById("editEmail").value.trim();
    const user = auth.currentUser;

    if (user) {
      const userRef = ref(database, "users/" + user.email.replace(".", ","));
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();

        if (newEmail) {
          if (newEmail != userData.email) {
            await update(userRef, {
              email: newEmail,
            });
            updateEmailUI(newEmail);
            alert("Email updated successfully!");
          }
        } else {
          alert("Email cannot be empty.");
        }
      }
    } else {
      alert("Please log in to change your email");
      window.location.href = "../html/loginPage.html";
    }
  });
*/

// Logout Function
async function handleLogout() {
  window.loggingOut = true;
  await signOut(auth);
  sessionStorage.clear();
  alert("You have been logged out.");
  window.location.href = "../html/loginPage.html";
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

export { Dashboard };
