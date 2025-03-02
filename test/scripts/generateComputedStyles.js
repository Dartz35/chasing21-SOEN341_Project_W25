/*This script will extract the computed styles for all styled elements on the page and log them in the console.
You can then copy this output and use it in your automation script to compare styles or perform other operations.
Note: This script may not work in all scenarios, especially if the page has complex styles or dynamic content. 
It's recommended to test it on a sample page before using it in a production environment.
*/

// Automatically detects all styled elements on the page
function getAllStyledElements() {
  const elements = new Set();
  document.querySelectorAll("*").forEach((el) => {
    if (el.style.length > 0 || window.getComputedStyle(el).cssText !== "") {
      elements.add(el);
    }
  });
  return Array.from(elements);
}

// Extract computed styles for all detected elements
function getComputedStylesForElements(elements) {
  let styles = {};
  elements.forEach((element) => {
    let selector = element.id ? `#${element.id}` : `.${element.classList[0]}`;
    let computedStyle = window.getComputedStyle(element);
    styles[selector] = {};
    for (let property of computedStyle) {
      styles[selector][property] = computedStyle.getPropertyValue(property);
    }
  });
  return styles;
}

const styledElements = getAllStyledElements();
const extractedStyles = getComputedStylesForElements(styledElements);
console.log(JSON.stringify(extractedStyles, null, 2));
// Output: Computed styles for all styled elements on the page
