import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js"
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
  authDomain: "chathaven-d181a.firebaseapp.com",
  projectId: "chathaven-d181a",
  storageBucket: "chathaven-d181a.firebasestorage.app",
  messagingSenderId: "885486697811",
  appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
  measurementId: "G-D1W5TPK13Q"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

const adminSection = document.getElementById("adminSection")
const createGroupForm = document.getElementById("createGroupForm")
const createGroupBtn = document.getElementById("createGroupBtn")
const groupNameInput = document.getElementById("groupName")
const groupItemsUl = document.getElementById("groupItems")
const userStatus = document.getElementById("userStatus")

window.addEventListener("load", () => {
  const userJSON = localStorage.getItem("loggedInUser")
  if (!userJSON) {
    userStatus.textContent = "Not logged in"
    alert("No user is logged in.")
    return
  }
  const userData = JSON.parse(userJSON)
  userStatus.textContent = userData.email
  if (userData.role === "admin") adminSection.classList.remove("hidden")
  loadGroups()
})

createGroupBtn.addEventListener("click", e => {
  e.preventDefault()
  const userJSON = localStorage.getItem("loggedInUser")
  if (!userJSON) {
    alert("User not found in storage.")
    return
  }
  const userData = JSON.parse(userJSON)
  const groupName = groupNameInput.value.trim()
  if (!groupName) {
    alert("Please enter a group name.")
    return
  }
  const groupsRef = ref(database, "groups")
  const newGroupRef = push(groupsRef)
  set(newGroupRef, {
    name: groupName,
    createdBy: userData.email
  })
      .then(() => {
        alert("Group created.")
        createGroupForm.reset()
      })
      .catch(() => {
        alert("Failed to create group.")
      })
})

function loadGroups() {
  const groupsRef = ref(database, "groups")
  onValue(groupsRef, snapshot => {
    groupItemsUl.innerHTML = ""
    if (snapshot.exists()) {
      const data = snapshot.val()
      const keys = Object.keys(data)
      keys.forEach(key => {
        const g = data[key]
        const li = document.createElement("li")
        li.style.display = "flex"
        li.style.alignItems = "center"
        li.innerHTML = `
          <span style="font-weight:bold;">${g.name}</span>
          <span style="margin-left:auto;"> ${g.createdBy}</span>
        `
        groupItemsUl.appendChild(li)
      })
    } else {
      const li = document.createElement("li")
      li.textContent = "No groups available."
      groupItemsUl.appendChild(li)
    }
  })
}
