import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/loadContactDom.js";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";

beforeEach(() => {
  vi.clearAllMocks();
});

import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  loadAllUsers,
  loadFriends,
  loadFriendRequests,
} from "../../js/contact.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Contact Features", () => {
  it("should load all users", async () => {
    await loadAllUsers();
    const allUsersDiv = document.getElementById("allUsers");
    expect(allUsersDiv.innerHTML).toContain("User Two");
  });

  it("should load friends", async () => {
    await loadFriends();
    const friendsListDiv = document.getElementById("friendsList");
    expect(friendsListDiv.innerHTML).toContain("User Two");
  });

  it("should load friend requests", async () => {
    await loadFriendRequests();
    const sentRequestsDiv = document.getElementById("sentRequests");
    const receivedRequestsDiv = document.getElementById("receivedRequests");
    expect(sentRequestsDiv.innerHTML).toContain("User Two");
    expect(receivedRequestsDiv.innerHTML).toContain("No received requests");
  });

  it("should send a friend request", async () => {
    global.alert = vi.fn();
    await sendFriendRequest({ id: "user2", name: "User Two" });
    expect(alert).toHaveBeenCalledWith(
      "You already have a pending request with this user"
    );
  });

  it("should accept a friend request", async () => {
    global.alert = vi.fn();
    await acceptFriendRequest("request1", "user1");
    expect(alert).toHaveBeenCalledWith("Friend request accepted!");
  });

  it("should decline a friend request", async () => {
    global.alert = vi.fn();
    await declineFriendRequest("request1");
    expect(alert).toHaveBeenCalledWith("Friend request declined");
  });

  it("should remove a friend", async () => {
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    await removeFriend("friendship1");
    expect(alert).toHaveBeenCalledWith("Friend removed successfully");
  });
});

describe("Friend Request Features - Additional Tests", () => {
  it("should not send a friend request if user is undefined", async () => {
    global.alert = vi.fn();
    await sendFriendRequest(undefined);
    expect(alert).toHaveBeenCalledWith("Failed to send friend request");
  });

  it("should not accept a friend request if request ID is invalid", async () => {
    global.alert = vi.fn();
    await acceptFriendRequest(null, "user2");
    expect(alert).toHaveBeenCalledWith("Invalid friend request ID!");
  });

  it("should not decline a friend request if request ID is invalid", async () => {
    global.alert = vi.fn();
    await declineFriendRequest(null);
    expect(alert).toHaveBeenCalledWith("Invalid friend request ID!");
  });

  it("should not remove a friend if friend ID is invalid", async () => {
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    await removeFriend(null);
    expect(alert).toHaveBeenCalledWith("Invalid friend ID!");
  });

  it("should not remove a friend if user cancels the confirmation", async () => {
    global.alert = vi.fn();
    global.confirm = vi.fn(() => false);
    await removeFriend("friendId789");
    expect(alert).not.toHaveBeenCalledWith("Friend removed successfully");
  });
});
