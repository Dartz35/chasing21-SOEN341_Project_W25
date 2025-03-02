/*This script will extract the computed styles for all styled elements on the page and log them in the console.
You can then copy this output and use it in your automation script to compare styles or perform other operations.
Note: This script may not work in all scenarios, especially if the page has complex styles or dynamic content. 
It's recommended to test it on a sample page before using it in a production environment.
*/

// Get all elements that have computed styles applied
function getAllStyledElements() {
  const elements = new Set();
  document.querySelectorAll("*").forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    // Only add elements that have non-default computed styles
    if (
      [...computedStyle].some(
        (prop) => computedStyle.getPropertyValue(prop).trim() !== ""
      )
    ) {
      elements.add(el);
    }
  });
  return Array.from(elements);
}

// Extract computed styles for all detected elements
function getComputedStylesForElements(elements) {
  let styles = {};
  elements.forEach((element) => {
    let selector;

    // Prioritize ID selector
    if (element.id) {
      selector = `#${element.id}`;
    }
    // Use all classes instead of just the first one
    else if (element.className && typeof element.className === "string") {
      selector = `.${element.className.trim().replace(/\s+/g, ".")}`;
    }
    // If no ID or class, generate a tag selector
    else {
      selector = element.tagName.toLowerCase();
    }

    let computedStyle = window.getComputedStyle(element);
    styles[selector] = {};
    for (let property of computedStyle) {
      styles[selector][property] = computedStyle.getPropertyValue(property);
    }
  });
  return styles;
}

// Run the script
const styledElements = getAllStyledElements();
const extractedStyles = getComputedStylesForElements(styledElements);

// Log to console (copy/paste output)
console.log(JSON.stringify(extractedStyles, null, 2));
