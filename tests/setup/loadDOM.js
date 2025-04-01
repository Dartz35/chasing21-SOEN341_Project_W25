import { readFileSync } from "fs";
import { join } from "path";

/**
 * Loads a static HTML file into the test DOM.
 * @param {string} name - Name of the HTML file inside /tests/dom/
 */
export function loadDOM(name) {
  const path = join(__dirname, "dom", `${name}.html`);
  try {
    const html = readFileSync(path, "utf-8");
    document.body.innerHTML = html;
    console.log(`[DOM] Loaded: ${name}.html`);
  } catch (e) {
    console.warn(e);
  }
}
