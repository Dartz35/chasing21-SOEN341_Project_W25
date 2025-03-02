const path = require("path");
const { runCSSValidation } = require("../scripts/styleTest.js");

// Define full absolute paths
const htmlFilePath = "../html/loginPage.html";
const expectedStylesPath = path.join(
  __dirname,
  "/expectedResults/expectedLoginPageStyles.json"
);

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(htmlFilePath, expectedStylesPath);
} else {
  console.log("Running locally: Skipping CSS tests.");
}
