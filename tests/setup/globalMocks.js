import { vi } from "vitest";

global.alert = vi.fn();
global.confirm = vi.fn(() => true);
