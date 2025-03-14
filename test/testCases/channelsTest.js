const { runCSSValidation } = require("../scripts/styleTest.js");
const path = require("path");

// Define full absolute paths
const htmlFilePath = "../chasing21-SOEN341_Project_W25/html/channels.html";
const expectedStylesPath = path.resolve(
  __dirname,
  "../expectedResults/expectedChannelStyles.json"
);

// Run tests only in CI/CD

runCSSValidation(htmlFilePath, expectedStylesPath);
