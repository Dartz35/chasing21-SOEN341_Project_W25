import { runCSSValidation } from "../scripts/styleTest";

// Run tests only in CI/CD
if (process.env.CI) {
  runCSSValidation(
    "../html/loginPage.html",
    "../expectedResults/expectedloginPageStyles.json",
    "../results/loginPageTestResults.log"
  );
} else {
  console.log("Running locally: Skipping CSS tests.");
}
