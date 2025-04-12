// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import { mockDatabase } from "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";
import "../../tests/setup/loadMessageDom.js";
import { set } from "firebase/database";

import {
  populateUserList,
  createUserElement,
  storeMessageInDatabase,
} from "../../js/message.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("message.js", () => {
  it("should populate the user list UI", () => {
    const mockStatuses = {
      user1: "online",
      user2: "offline",
    };

    populateUserList(mockDatabase.users, mockStatuses);

    const userList = document.querySelector(".listProfiles").innerHTML;
    expect(userList).toContain("User One");
    expect(userList).toContain("User Two");
  });
  it("should create a user element", () => {
    const user = { id: "user1", name: "User One" };
    const email = "user1@example.com";
    const status = "online";

    const userElement = createUserElement(user, email, status);

    expect(userElement).toBeInstanceOf(HTMLElement);
    expect(userElement.innerHTML).toContain("User One");
    expect(userElement.innerHTML).toContain("user1@example.com");
    expect(userElement.innerHTML).toContain("online");
  });

  it("should store a message in the database", async () => {
    const mockMessage = "Hello";

    storeMessageInDatabase("user1", mockMessage);

    expect(set).toHaveBeenCalled();
  });
});
