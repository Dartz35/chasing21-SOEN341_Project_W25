import { runCSSValidation } from "../test/scripts/styleTest";

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(
    "../html/loginPage.html",
    "../test/expectedResults/expectedloginPageStyles.json",
    "../test/results/loginPageTestResults.log"
  );
} else {
  console.log("Running locally: Skipping CSS tests.");
}
