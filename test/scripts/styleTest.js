const fs = require("fs");
const path = require("path");
const { generateStyles } = require("../scripts/generateStyles.js");

// Load expected styles from JSON
async function loadExpectedStyles(filePath) {
  try {
    console.log(`Loading expected styles from: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Expected styles file not found. ${filePath}`);
    }

    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading expected styles: ${error}`);
    return null;
  }
}

// Compare extracted styles with expected styles and log results
async function runCSSValidation(htmlFilePath, expectedStylesPath) {
  console.log(`Running CSS validation for: ${htmlFilePath}`);

  // Load expected styles
  const expectedStyles = await loadExpectedStyles(expectedStylesPath);
  if (!expectedStyles) {
    console.error("❌ Failed to load expected styles.");
    process.exit(1);
  }

  // Extract computed styles
  const currentStyles = await generateStyles(htmlFilePath);

  let hasErrors = false;
  let missingElements = [];
  let extraElements = [];

  Object.keys(expectedStyles).forEach((selector) => {
    if (!currentStyles[selector]) {
      missingElements.push(selector);
      return;
    }

    Object.keys(expectedStyles[selector]).forEach((property) => {
      let expectedValue = expectedStyles[selector][property] || "";
      let actualValue = currentStyles[selector][property] || "";

      if (expectedValue !== actualValue) {
        console.error(`❌ Style Mismatch: ${selector} -> ${property}`);
        console.error(`   Expected: ${expectedValue}`);
        console.error(`   Got: ${actualValue}`);
        hasErrors = true;
      }
    });
  });

  // Detect extra unexpected elements
  Object.keys(currentStyles).forEach((selector) => {
    if (!expectedStyles[selector]) {
      extraElements.push(selector);
    }
  });

  if (missingElements.length > 0) {
    console.error(`❌ Missing elements in DOM: ${missingElements.join(", ")}`);
    hasErrors = true;
  }

  if (extraElements.length > 0) {
    console.warn(`⚠️ Extra elements found in DOM: ${extraElements.join(", ")}`);
    hasErrors = true;
  }

  if (!hasErrors) {
    console.log("✅ All styles match.");
    process.exit(0);
  } else {
    console.error("❌ CSS validation failed.");
    process.exit(1);
  }
}

module.exports = { runCSSValidation };
