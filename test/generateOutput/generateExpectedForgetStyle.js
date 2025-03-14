const { generateStylesAndOutput } = require("../scripts/generateStyles");

// Run script for a specific page
const htmlFilePath = "../chasing21-SOEN341_Project_W25/html/forget.html";
const outputFilePath =
  "../chasing21-SOEN341_Project_W25/test/expectedResults/expectedforgetStyles.json";

generateStylesAndOutput(htmlFilePath, outputFilePath);
