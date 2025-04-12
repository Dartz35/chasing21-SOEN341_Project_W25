import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import {
  currentUserMock,
  mockDatabase,
} from "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";
import "../../tests/setup/loadLoginDom.js"; // Adjust path based on your structure

// Import Firebase functions that are mocked in firebaseMocks.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";

// Import the module to be tested
import "../../js/loginPage.js"; // Adjust path based on your structure

describe("loginPage Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.sessionStorage.clear();
  });

  describe("Input Field Styling", () => {
    it("should change text color of login email input to white on input", () => {
      const emailLoginInput = document.getElementById("email_login");
      emailLoginInput.dispatchEvent(new Event("input"));
      expect(emailLoginInput.style.color).toBe("white");
    });

    it("should change text color of login password input to white on input", () => {
      const passwordLoginInput = document.getElementById("password_login");
      passwordLoginInput.dispatchEvent(new Event("input"));
      expect(passwordLoginInput.style.color).toBe("white");
    });

    it("should change text color of register email input to white on input", () => {
      const emailRegisterInput = document.getElementById("email");
      emailRegisterInput.dispatchEvent(new Event("input"));
      expect(emailRegisterInput.style.color).toBe("white");
    });

    it("should change text color of register password input to white on input", () => {
      const passwordRegisterInput = document.getElementById("password");
      passwordRegisterInput.dispatchEvent(new Event("input"));
      expect(passwordRegisterInput.style.color).toBe("white");
    });
  });

  describe("Registration Functionality", () => {
    it("shows alert if no role is selected", async () => {
      document.getElementById("name").value = "Test Name";
      document.getElementById("email").value = "test@example.com";
      document.getElementById("password").value = "password123";

      document.getElementById("submit_register").click();
      expect(alert).toHaveBeenCalled("Please select a role!");
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it("calls createUserWithEmailAndPassword and saves user data on successful registration", async () => {
      document.getElementById("name").value = "Test Name";
      document.getElementById("email").value = "test@example.com";
      document.getElementById("password").value = "password123";
      document.getElementById("role").value = "user";

      document.getElementById("submit_register").click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(alert).toHaveBeenCalledWith("Registration successful!");
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(set).toHaveBeenCalled();
    });
  });

  describe("Login Functionality", () => {
    it("calls signInWithEmailAndPassword and redirects on successful login", async () => {
      document.getElementById("email_login").value = "test@example.com";
      document.getElementById("password_login").value = "password123";

      document.getElementById("submit_login").click();
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
    });

    it("displays error alert on login failure", async () => {
      document.getElementById("email_login").value = "test@example.com";
      document.getElementById("password_login").value = "wrongpassword";

      document.getElementById("submit_login").click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(alert).toHaveBeenCalledWith(
        "Error: No user found with this email."
      );
      expect(get).toThrow();
    });
  });
});
