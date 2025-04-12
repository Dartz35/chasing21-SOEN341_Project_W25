import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";
import {
  currentUserMock,
  mockDatabase,
} from "../../tests/setup/globalMocks.js";

import * as pageLoading from "../../js/pageLoading.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = `
    <div class="name"></div>
    <input class="name" />
    <div class="email"></div>
    <input class="email" />
    <div class="role"></div>
    <input class="role" />
  `;
});

describe("pageLoading.js", () => {
  it("should fetch profile data for a valid user and update the UI", async () => {
    currentUserMock.role = "admin";
    mockDatabase.users["user1@example,com"].role = "admin";

    const result = await pageLoading.fetchProfileData(currentUserMock);

    const nameElements = document.getElementsByClassName("name");
    expect(nameElements[0].textContent).toBe("User One");
    expect(nameElements[1].value).toBe("User One");

    const emailElements = document.getElementsByClassName("email");
    expect(emailElements[0].textContent).toBe("user1@example.com");
    expect(emailElements[1].value).toBe("user1@example.com");

    const roleElements = document.getElementsByClassName("role");
    expect(roleElements[0].textContent).toBe("admin");
    expect(roleElements[1].value).toBe("admin");
  });

  it("should handle an invalid user gracefully", async () => {
    let mockUser = currentUserMock;
    mockUser.email = "";
    const result = await pageLoading.fetchProfileData(mockUser);
    expect(result).toEqual({});
  });
});
