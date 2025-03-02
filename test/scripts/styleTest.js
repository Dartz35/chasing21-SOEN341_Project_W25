const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// Ensure results folder exists
const resultsDir = path.join(__dirname, "../results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Function to generate a unique log file name
function createNewLogFile() {
  const timestamp = new Date().toISOString().replace(/:/g, "-"); // Prevents issues with Windows filenames
  return path.join(resultsDir, `css_test_${timestamp}.log`);
}

// Function to log test results into a file
function logToFile(message, logFilePath) {
  fs.appendFileSync(
    logFilePath,
    `[${new Date().toISOString()}] ${message}\n`,
    "utf8"
  );
}

// Load expected styles from JSON
async function loadExpectedStyles(filePath, logFilePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logToFile(`Error loading expected styles: ${error}`, logFilePath);
    return null;
  }
}

// prevented redirection to login page
function preventRedirection(window, blockedPage = "../html/loginPage.html") {
  Object.defineProperty(window, "location", {
    get() {
      return {
        href: "http://localhost/protectedPage.html", // Fake staying on the protected page
        assign: (url) => {
          if (url.includes(blockedPage)) {
            console.log(`Prevented redirection to ${blockedPage}`);
          } else {
            console.log(`Allowed redirection to: ${url}`);
          }
        },
        replace: (url) => {
          if (url.includes(blockedPage)) {
            console.log(`Prevented redirection to ${blockedPage}`);
          } else {
            console.log(`Allowed redirection to: ${url}`);
          }
        },
        reload: () => {
          console.log("Prevented page reload");
        },
      };
    },
    set(newValue) {
      if (newValue.includes(blockedPage)) {
        console.log(`Prevented setting window.location to ${blockedPage}`);
      } else {
        console.log(`Allowed setting window.location to: ${newValue}`);
      }
    },
  });
}

// Extract computed styles using jsdom (Node.js)
async function getComputedStylesFromHTML(filePath, logFilePath) {
  const htmlContent = fs.readFileSync(filePath, "utf8");
  const dom = new JSDOM(htmlContent, {
    resources: "usable",
    runScripts: "dangerously",
  });
  const { document } = dom.window;

  // Prevent redirection to login page
  preventRedirection(dom.window, "../html/loginPage.html");

  let computedStyles = {};
  document.querySelectorAll("*").forEach((el) => {
    let selector = el.id
      ? `#${el.id}`
      : `.${el.className.replace(/\s+/g, ".")}`;
    if (!selector || selector === ".undefined") return;

    let computed = dom.window.getComputedStyle(el);
    computedStyles[selector] = {};
    for (let property of computed) {
      computedStyles[selector][property] = computed.getPropertyValue(property);
    }
  });

  return computedStyles;
}

// Normalize CSS values for consistency (e.g., colors)
function normalizeCSSValue(value) {
  return value.trim().toLowerCase(); // Normalize spaces and casing
}

// Compare extracted styles with expected styles and log results
async function runCSSValidation(htmlFilePath, expectedStylesPath) {
  const logFilePath = createNewLogFile();
  logToFile("Running CSS Tests...\n", logFilePath);

  const expectedStyles = await loadExpectedStyles(
    expectedStylesPath,
    logFilePath
  );
  if (!expectedStyles) return;

  const currentStyles = await getComputedStylesFromHTML(
    htmlFilePath,
    logFilePath
  );
  let hasErrors = false;
  let missingElements = [];

  Object.keys(expectedStyles).forEach((selector) => {
    if (!currentStyles[selector]) {
      missingElements.push(selector);
      return;
    }
    Object.keys(expectedStyles[selector]).forEach((property) => {
      let expectedValue = normalizeCSSValue(expectedStyles[selector][property]);
      let actualValue = normalizeCSSValue(currentStyles[selector][property]);

      if (expectedValue !== actualValue) {
        logToFile(
          `Style Mismatch: ${selector} -> ${property} (Expected: ${expectedValue}, Got: ${actualValue})`,
          logFilePath
        );
        hasErrors = true;
      }
    });
  });

  if (missingElements.length > 0) {
    logToFile(
      `Missing elements in DOM: ${missingElements.join(", ")}`,
      logFilePath
    );
  }

  if (!hasErrors && missingElements.length === 0) {
    logToFile("All styles match.\n", logFilePath);
    process.exit(0);
  } else {
    logToFile("CSS validation failed.\n", logFilePath);
    process.exit(1);
  }
}

module.exports = { runCSSValidation };
