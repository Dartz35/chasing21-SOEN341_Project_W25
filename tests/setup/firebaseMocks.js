import { vi } from "vitest";

const mockFns = {
  ref: vi.fn(),
  get: vi.fn(),
  push: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  onChildAdded: vi.fn(),
  onChildRemoved: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
  remove: vi.fn(),
  limitToLast: vi.fn(),
  getDatabase: vi.fn(() => ({})),
  onDisconnect: vi.fn(() => ({
    set: vi.fn(),
  })),
};

// Register the default mock
vi.mock("firebase/database", () => mockFns);

// Export for optional access/override
export default mockFns;

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: "uid1", email: "user1@example.com" },
  })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: "uid1", email: "user1@example.com" });
  }),
}));

vi.mock("../js/firebaseConfig.js", () => ({
  auth: {},
  database: {},
}));

vi.mock("../js/pageLoading.js", () => ({
  fetchProfileData: vi.fn(() =>
    Promise.resolve({
      id: "uid1",
      name: "Mock User",
      email: "user1@example.com",
    })
  ),
}));
