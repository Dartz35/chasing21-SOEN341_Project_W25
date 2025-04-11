import { vi, beforeEach, describe, it, expect } from "vitest";
import {
  currentUserMock,
  mockDatabase,
} from "../../tests/setup/globalMocks.js";
import "../../tests/setup/loadChannelDom.js";
import "../../tests/setup/firebaseMocksChannels.js";
import { set, push, update, get } from "firebase/database";

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

describe("Channel management", () => {
  it("should create a new channel for a regular user", async () => {
    global.currentUserData = currentUserMock;
    await createChannel();

    expect(get).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith("Channel created successfully!");
  });

  it("should add a member to a channel", async () => {
    const email = "user2@example.com";
    const channelId = "mockChannelId";

    await addMember(email, channelId);

    expect(set).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Member added successfully!");
  });

  it("should not add a member if already in the channel", async () => {
    // Mock the database structure for the test
    mockDatabase.channels.mockChannelId.members = ["user1", "user2"];

    // Attempt to add a member who is already in the channel
    await addMember("user2@example.com", "mockChannelId");

    // Verify that the alert is called with the correct message
    expect(alert).toHaveBeenCalledWith("This user is already a member.");
  });

  it("should remove a member from a channel", async () => {
    const email = "user2@example.com";
    const channelId = "mockChannelId";
    mockDatabase.channels.mockChannelId.members = ["user1", "user2"];

    await removeMember(email, channelId);

    expect(set).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Member removed successfully!");
  });

  it("should fetch all users matching a query", async () => {
    const results = await searchUsers("User");

    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty("email");
    expect(results[1]).toHaveProperty("id");
  });

  it("should fetch all members matching a query", async () => {
    const channelMembers = ["user1", "user2"];
    mockDatabase.channels.mockChannelId.members = channelMembers;
    const results = await searchChannelMembers(
      "mockChannelId",
      "User",
      "members"
    );

    expect(results.length).toBe(2);
  });

  it("should delete a channel", async () => {
    const mockDropdown = document.createElement("div");
    mockDropdown.classList.add("channel-options");
    document.body.appendChild(mockDropdown);

    await deletechannel("mockChannelId");

    expect(set).toHaveBeenCalledWith(expect.anything(), null);
    expect(alert).toHaveBeenCalledWith("Channel deleted successfully!");
  });
});
