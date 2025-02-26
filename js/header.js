// header.js - Exporting a React Component with a Click Event
function Header() {
  return React.createElement(
    "div",
    { className: "header" },
    React.createElement(
      "h1",
      null,
      React.createElement("img", {
        src: "../images/Chat-Icon-Transparent-Background.webp",
        width: "30",
        height: "30",
        alt: "Chat Icon",
      }),
      " Chat Haven"
    ),
    React.createElement(
      "button",
      { className: "profileBtn", onClick: toggleSidebar },
      React.createElement("img", {
        className: "profilePic",
        alt: "Profile",
        src: "../images/defaultUserLogo.png",
      })
    )
  );
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
}

export { Header, toggleSidebar };
