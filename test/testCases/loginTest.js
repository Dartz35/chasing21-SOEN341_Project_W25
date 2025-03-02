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
const logFilePath = "../results/loginPageTestResults.log";

// Ensure log file is created before writing results
fs.writeFileSync(logFilePath, "CSS Test Log Start\n", "utf8");

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(htmlFilePath, expectedStylesPath, logFilePath);
} else {
  console.log("Running locally: Skipping CSS tests.");
}
