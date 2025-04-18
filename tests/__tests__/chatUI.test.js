// tests/__tests__/chatUI.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";

document.body.innerHTML = `
<div id="chatView">
  >
  <div class="chat-container">
    <div class="chat-header">
      <h3></h3>
      <p id="userRoleDisplay"></p>
      <button id="backToChannelsBtn">Back</button>
    </div>
    <div id="messagesContainer" class="messages-container"></div>
    <div class="chat-footer">
      <input
        type="text"
        id="messageInput"
        placeholder="Write your message..."
      />
      <button id="sendMessageBtn">Send</button>
    </div>
  </div>
</div>

<div id="chatSection" style="display: none">
  <div id="messageList"></div>
  <input id="messageInput" />
  <button id="sendMessageBtn"></button>
</div>
<div id="channelsContainer"></div>
<div id="createchannelSection"></div>
<div id="userRoleDisplay">user</div>`;

import {
  openChannelChat,
  displayChatUI,
  goBackToChannels,
  sendMessage,
} from "../../js/chatUI.js";

global.sessionStorage = {
  getItem: vi.fn((key) => {
    const store = {
      currentID: "uid1",
      username: "TestUser",
      role: "admin",
    };
    return store[key];
  }),
  setItem: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chatUI.js", () => {
  it("should open a channel chat and display UI", async () => {
    await openChannelChat("testChannelId");

    const chatView = document.getElementById("chatView");
    expect(chatView).toBeTruthy();
    expect(chatView.innerHTML).toContain("Send");
  });

  it("should display chat UI with message input and send button", () => {
    displayChatUI("groupChatId123", "General");

    expect(document.getElementById("chatView")).toBeTruthy();
    expect(document.getElementById("messageInput")).toBeTruthy();
    expect(document.getElementById("sendMessageBtn")).toBeTruthy();
  });

  it("should go back to channels and show UI sections", () => {
    displayChatUI("groupChatId123", "General");
    goBackToChannels();

    expect(document.getElementById("channelsContainer").style.display).toBe(
      "block"
    );
    expect(document.getElementById("createchannelSection").style.display).toBe(
      "block"
    );
  });

  it("should send a message and clear the input", async () => {
    displayChatUI("groupChatId123", "General");
    const input = document.getElementById("messageInput");
    input.value = "Hello world!";

    await sendMessage("groupChatId123");

    expect(input.value).toBe("");
  });
});
