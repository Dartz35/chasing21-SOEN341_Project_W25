import mockFns from "@setup/firebaseMocks.js";
import "@setup/firebaseMocks.js";

mockFns.ref.mockImplementation((...args) => `ref:${args.join("/")}`);
mockFns.get.mockImplementation(() =>
  Promise.resolve({ exists: () => false, val: () => null })
);
mockFns.push.mockImplementation(() => ({ key: "mockChannelId" }));

vi.mock("../js/chatUI.js", () => ({
  openChannelChat: vi.fn(),
}));
