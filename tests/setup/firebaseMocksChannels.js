import "../../tests/setup/firebaseMocks.js";
import { vi } from "vitest";

vi.mock("../../js/chatUI.js", () => ({
  openChannelChat: vi.fn(),
}));
