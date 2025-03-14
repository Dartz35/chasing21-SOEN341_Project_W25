const { generateStylesAndOutput } = require("../scripts/generateStyles");

// Run script for a specific page
const htmlFilePath = "../chasing21-SOEN341_Project_W25/html/channels.html";
const outputFilePath =
  "../chasing21-SOEN341_Project_W25/test/expectedResults/expectedChannelStyles.json";

generateStylesAndOutput(htmlFilePath, outputFilePath);
