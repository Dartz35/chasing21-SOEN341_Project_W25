import mockFns from "/home/runner/work/chasing21-SOEN341_Project_W25/chasing21-SOEN341_Project_W25/tests/setup/firebaseMocks.js";
import "/home/runner/work/chasing21-SOEN341_Project_W25/chasing21-SOEN341_Project_W25/tests/setup/firebaseMocks.js";

mockFns.ref.mockImplementation((...args) => `ref:${args.join("/")}`);
mockFns.get.mockImplementation(() =>
  Promise.resolve({ exists: () => false, val: () => null })
);
mockFns.push.mockImplementation(() => ({ key: "mockChannelId" }));

vi.mock("../../js/chatUI.js", () => ({
  openChannelChat: vi.fn(),
}));
