// homepage.js - Importing and rendering Header component
import { Header } from "./header.js";
import { Dashboard } from "./dashboard.js";

// Attach React component to the DOM
const root = ReactDOM.createRoot(document.getElementById("app"));

// Render both components inside a single parent element
root.render(
  React.createElement(
    "div",
    null,
    React.createElement(Header),
    React.createElement(Dashboard)
  )
);
