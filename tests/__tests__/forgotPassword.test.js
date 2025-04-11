import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/loadForgetDom.js";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";

// Mock Firebase and DOM
vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail: vi.fn(() => Promise.resolve("Email sent!")),
}));

import { sendPasswordResetEmail } from "firebase/auth";
import "../../js/forget.js"; // Adjust path based on your structure

describe("Forgot Password", () => {
  beforeEach(() => {
    sendPasswordResetEmail.mockClear();
    document.getElementById("email_forgot").value = "";
  });

  it("shows alert if email is empty", () => {
    global.alert = vi.fn();
    document.getElementById("submit_forgot").click();
    expect(alert).toHaveBeenCalledWith("Please enter a valid email address.");
  });

  it("calls sendPasswordResetEmail with the email", async () => {
    global.alert = vi.fn();
    document.getElementById("email_forgot").value = "test@example.com";
    await document.getElementById("submit_forgot").click();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com"
    );
    expect(alert).toHaveBeenCalledWith(
      "Password reset email sent! Check your inbox."
    );
  });
});
