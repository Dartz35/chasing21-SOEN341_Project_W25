import { vi, beforeEach, describe, it, expect } from "vitest";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocksChannels.js";
import "../../tests/setup/loadChannelDom.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ✅ After mocks, import the module under test
import {
  createChannel,
  deletechannel,
  addMember,
  removeMember,
  searchUsers,
  searchChannelMembers,
} from "../../js/channels.js";

import { get, set, push, update } from "firebase/database";

const mockDatabase = {
  users: {
    "user1@example,com": {
      id: "uid1",
      email: "user1@example.com",
      name: "User One",
      channels: [],
    },
    "user2@example,com": {
      id: "uid2",
      email: "user2@example.com",
      name: "User Two",
      channels: [],
    },
  },
};

const mockChannelData = {
  id: "mockChannelId",
  name: "Test Channel",
  ownerId: "uid1",
  members: ["uid1"],
  joinRequests: [],
};

describe("Channel management", () => {
  it("should create a new channel for a regular user", async () => {
    global.currentUserData = {
      id: "uid1",
      role: "user",
      email: "user1@example.com",
    };

    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => mockDatabase.users,
    });

    await createChannel();

    expect(push).toHaveBeenCalled();
    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith("Channel created successfully!");
  });

  it("should add a member to a channel", async () => {
    const email = "user2@example.com";
    const channelId = "mockChannelId";

    get
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => mockDatabase.users["user2@example,com"],
      })
      .mockResolvedValueOnce({ exists: () => true, val: () => ["uid1"] });

    await addMember(email, channelId);

    expect(set).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Member added successfully!");
  });

  it("should not add a member if already in the channel", async () => {
    get
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => mockDatabase.users["user2@example,com"],
      })
      .mockResolvedValueOnce({ exists: () => true, val: () => ["uid2"] });

    await addMember("user2@example.com", "mockChannelId");

    expect(alert).toHaveBeenCalledWith("This user is already a member.");
  });

  it("should remove a member from a channel", async () => {
    const email = "user2@example.com";
    const channelId = "mockChannelId";

    get
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => mockDatabase.users["user2@example,com"],
      })
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ["uid1", "uid2"],
      });

    await removeMember(email, channelId);

    expect(set).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Member removed successfully!");
  });

  it("should fetch all users matching a query", async () => {
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => mockDatabase.users,
    });

    const results = await searchUsers("User");

    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty("email");
    expect(results[1]).toHaveProperty("id");
  });

  it("should fetch all members matching a query", async () => {
    const channelMembers = ["uid1", "uid2"];

    get
      .mockResolvedValueOnce({ exists: () => true, val: () => channelMembers })
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => mockDatabase.users,
      });

    const results = await searchChannelMembers(
      "mockChannelId",
      "User",
      "members"
    );

    expect(results.length).toBe(2);
  });

  it("should delete a channel", async () => {
    get
      .mockResolvedValueOnce({ exists: () => true, val: () => mockChannelData })
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => mockDatabase.users,
      });

    const mockDropdown = document.createElement("div");
    mockDropdown.classList.add("channel-options");
    document.body.appendChild(mockDropdown);

    await deletechannel("mockChannelId");

    expect(set).toHaveBeenCalledWith(expect.anything(), null);
    expect(alert).toHaveBeenCalledWith("Channel deleted successfully!");
  });
});
