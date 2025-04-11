import { vi } from "vitest";

global.alert = vi.fn();
global.confirm = vi.fn(() => true);

export const currentUserMock = {
  uid: "user1",
  email: "user1@example.com",
  role: "user",
  id: "user1",
  name: "User One",
  profilePicture: "../images/user1.png",
  channels: [],
};

export const mockDatabase = {
  users: {
    "user1@example,com": {
      id: "user1",
      name: "User One",
      profilePicture: "../images/user1.png",
      channels: [],
      role: "user",
      email: "user1@example.com",
    },
    "user2@example,com": {
      id: "user2",
      name: "User Two",
      profilePicture: "../images/user2.png",
      channels: [],
      role: "admin",
      email: "user2@example.com",
    },
  },
  Friends: {
    friendship1: {
      user1: "user1",
      user2: "user2",
      timestamp: 1620000000000,
    },
  },
  FriendRequests: {
    request1: {
      senderID: "user1",
      receiverID: "user2",
      status: "pending",
      timestamp: 1620000000000,
    },
  },
  channels: {
    channel1: {
      id: "mockChannelId",
      name: "Test Channel",
      ownerId: "user1",
      members: ["user1"],
      channelType: "private",
      joinRequests: [],
      groupChatId: "mockGroupChatId",
    },
  },
};
