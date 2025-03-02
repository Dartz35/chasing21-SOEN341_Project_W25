const fs = require("fs");
const path = require("path");
const { runCSSValidation } = require("../scripts/styleTest.js");

// Ensure the results directory exists
const resultsDir = path.join(__dirname, "../results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Define full absolute paths
const htmlFilePath = "../html/loginPage.html";
const expectedStylesPath = "../expectedResults/expectedLoginPageStyles.json";

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(htmlFilePath, expectedStylesPath);
} else {
  console.log("Running locally: Skipping CSS tests.");
}
