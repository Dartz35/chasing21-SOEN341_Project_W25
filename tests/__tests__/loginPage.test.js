import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";

// Import Firebase functions that are mocked in firebaseMocks.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";

// Import the module to be tested
import "../../js/loginPage.js"; // Adjust path based on your structure
import { JSDOM } from 'jsdom';

describe("loginPage Functionality", () => {
  beforeEach(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Page</title>
      </head>
      <body>
        <div>
          <input type="email" id="email_login" />
          <input type="password" id="password_login" />
          <input type="email" id="email" />
          <input type="password" id="password" />
          <input type="text" id="name" />
          <select id="role">
            <option value="">--Choose Role--</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button id="submit_register">Register</button>
          <button id="submit_login">Login</button>
          <div id="currentUser"></div>
        </div>
        <script src="../../js/loginPage.js" type="module"></script>
      </body>
      </html>
    `);

    global.document = dom.window.document;
    global.window = dom.window;
    global.navigator = dom.window.navigator;

    vi.clearAllMocks();
    document.getElementById("email_login").value = "";
    document.getElementById("password_login").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("name").value = "";
    document.getElementById("role").value = ""; // Reset role selection
    global.alert = vi.fn();
    global.sessionStorage.clear();
    //window.location.href = ""; // Reset the location
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

      await document.getElementById("submit_register").click();
      expect(global.alert).toHaveBeenCalledWith("Please select a role!");
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it("calls createUserWithEmailAndPassword and saves user data on successful registration", async () => {
      document.getElementById("name").value = "Test Name";
      document.getElementById("email").value = "test@example.com";
      document.getElementById("password").value = "password123";
      document.getElementById("role").value = "user";

      await document.getElementById("submit_register").click();
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ key: "users/test,example,com" }),
        expect.objectContaining({
          name: "Test Name",
          email: "test@example.com",
          role: "user",
        })
      );
      expect(global.alert).toHaveBeenCalledWith("Registration successful!");
      expect(window.location.href).toBe("../html/loginPage.html");
    });

    it("displays error alert on registration failure", async () => {
      vi.mock("firebase/auth", () => ({
        createUserWithEmailAndPassword: vi.fn(() => Promise.reject(new Error("Registration failed"))),
        signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: "mockUserId", email: "test@example.com" } })),
        sendPasswordResetEmail: vi.fn(() => Promise.resolve("Email sent!")),
      }));
      document.getElementById("name").value = "Test Name";
      document.getElementById("email").value = "test@example.com";
      document.getElementById("password").value = "password123";
      document.getElementById("role").value = "user";

      await document.getElementById("submit_register").click();
      expect(global.alert).toHaveBeenCalledWith("Error: Registration failed");
      vi.restoreAllMocks();
    });
  });

  describe("Login Functionality", () => {
    it("calls signInWithEmailAndPassword and redirects on successful login", async () => {
      document.getElementById("email_login").value = "test@example.com";
      document.getElementById("password_login").value = "password123";

      await document.getElementById("submit_login").click();
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ key: "status/mockUserId" }),
        expect.objectContaining({ state: "online" })
      );
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ key: "users/test,example,com" }));
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith("email", "test@example.com");
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith("username", "Test User");
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith("currentID", "mockUserId");
      expect(global.alert).toHaveBeenCalledWith("Welcome, Test User!");
      expect(window.location.href).toBe("../html/HomePage.html");
    });

    it("displays error alert on login failure", async () => {
      vi.mock("firebase/auth", () => ({
        signInWithEmailAndPassword: vi.fn(() => Promise.reject(new Error("Login failed"))),
        createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: "mockUserId", email: "test@example.com" } })),
        sendPasswordResetEmail: vi.fn(() => Promise.resolve("Email sent!")),
      }));
      document.getElementById("email_login").value = "test@example.com";
      document.getElementById("password_login").value = "wrongpassword";

      await document.getElementById("submit_login").click();
      expect(global.alert).toHaveBeenCalledWith("Error: Login failed");
      vi.restoreAllMocks();
    });

    it("displays alert if no user found during login", async () => {
      vi.mock("firebase/auth", () => ({
        signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: "mockUserId", email: "nonexistent@example.com" } })),
        createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: "mockUserId", email: "test@example.com" } })),
        sendPasswordResetEmail: vi.fn(() => Promise.resolve("Email sent!")),
      }));
      vi.mock("firebase/database", async () => {
        const original = await vi.importActual("firebase/database");
        return {
          ...original,
          ref: vi.fn((path) => ({
            key: path,
            get: vi.fn(() => Promise.resolve({ exists: () => false })),
            set: vi.fn(() => Promise.resolve()),
            update: vi.fn(() => Promise.resolve()),
          })),
        };
      });
      document.getElementById("email_login").value = "nonexistent@example.com";
      document.getElementById("password_login").value = "password123";

      await document.getElementById("submit_login").click();
      expect(global.alert).toHaveBeenCalledWith("Error: No user found with this email.");
      vi.restoreAllMocks();
    });
  });
});