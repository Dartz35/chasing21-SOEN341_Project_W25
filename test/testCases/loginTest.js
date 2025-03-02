const fs = require("fs");
const path = require("path");
const { runCSSValidation } = require("../scripts/styleTest.js");

// Ensure the results directory exists
const resultsDir = path.join(__dirname, "../results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Define full absolute paths
const htmlFilePath = path.join(__dirname, "../html/loginPage.html");
const expectedStylesPath = path.join(
  __dirname,
  "../expectedResults/expectedloginPageStyles.json"
);
const logFilePath = path.join(__dirname, "../results/loginPageTestResults.log");

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(htmlFilePath, expectedStylesPath, logFilePath);
} else {
  console.log("🟢 Running locally: Skipping CSS tests.");
}
