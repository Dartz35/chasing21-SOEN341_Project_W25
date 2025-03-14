const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const expectedResultsDir = path.join(__dirname, "../expectedResults");
if (!fs.existsSync(expectedResultsDir)) {
  fs.mkdirSync(expectedResultsDir, { recursive: true });
}

async function generateStyles(htmlFilePath) {
  const executablePath =
    process.env.CI || process.platform === "linux"
      ? "/usr/bin/google-chrome"
      : puppeteer.executablePath();

  const browser = await puppeteer.launch({
    executablePath: executablePath,
    headless: true, // Ensures it runs in headless mode for CI and local
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // Convert file path to a proper URL for Puppeteer
  const absoluteHtmlPath = path.resolve(htmlFilePath);
  const fileUrl = `file://${absoluteHtmlPath}`;
  console.log(`Opening page: ${fileUrl}`);

  await page.goto(fileUrl, { waitUntil: "load" });

  // Ensure the page is fully loaded
  await page.waitForSelector("body");

  // Extract computed styles
  const styles = await page.evaluate(() => {
    const computedStyles = {};

    document.querySelectorAll("*").forEach((el) => {
      let selector;

      if (el.id === "go-back") return;
      // ID selector (highest priority)
      if (el.id) {
        selector = `#${el.id}`;
      }
      // Class selector (handle multiple classes correctly)
      else if (el.classList.length > 0) {
        selector = "." + el.classList.value.replace(/\s+/g, ".");
      }
      // Tag selector (fallback)
      else {
        selector = el.tagName.toLowerCase();
      }

      const style = window.getComputedStyle(el);
      const filteredStyles = {};

      // Iterate over all computed styles
      for (let property of style) {
        const value = style.getPropertyValue(property);

        // Only store "meaningful" styles
        if (
          value &&
          value !== "none" &&
          value !== "normal" &&
          value.trim() !== ""
        ) {
          filteredStyles[property] = value;
        }
      }

      // Only store elements that have meaningful styles
      if (Object.keys(filteredStyles).length > 0) {
        computedStyles[selector] = filteredStyles;
      }
    });

    return computedStyles;
  });

  await browser.close();
  console.log(`Generated computed styles from: ${htmlFilePath}`);
  return styles;
}

async function generateStylesAndOutput(htmlFilePath, outputFilePath) {
  console.log("Generating styles for:", htmlFilePath);

  try {
    const computedStyles = await generateStyles(htmlFilePath); // ✅ Await the async function
    console.log("Styles generated successfully!");

    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(computedStyles, null, 2),
      "utf8"
    );
    console.log("File successfully written:", outputFilePath);
  } catch (error) {
    console.error("Error generating styles:", error);
  }
}

module.exports = { generateStyles, generateStylesAndOutput };
