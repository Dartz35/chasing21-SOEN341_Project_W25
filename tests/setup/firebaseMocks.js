import { vi } from "vitest";
import "../../tests/setup/globalMocks.js";
import {
  currentUserMock,
  mockDatabase,
} from "../../tests/setup/globalMocks.js";
import { signOut } from "firebase/auth";

const mockFns = {
  ref: vi.fn((database, ...args) => {
    const path = args.join("/");
    const pathString = String(path);
    return pathString;
  }),
  get: vi.fn((refPathOrQuery) => {
    // Handle Query Object
    if (typeof refPathOrQuery === "object" && refPathOrQuery._mockPath) {
      const pathParts = refPathOrQuery._mockPath.split("/");
      let data = mockDatabase;
      for (const part of pathParts) {
        if (data[part]) {
          data = data[part];
        } else {
          return Promise.resolve({
            exists: () => false,
            val: () => null,
            forEach: () => false,
          });
        }
      }

      return Promise.resolve({
        exists: () => true,
        val: () => data,
        forEach: (callback) => {
          Object.entries(data).forEach(([key, value]) => {
            callback({ key, val: () => value });
          });
          return false;
        },
      });
    }

    // Handle Regular Path String
    const pathParts = refPathOrQuery.split("/");
    let data = mockDatabase;
    for (const part of pathParts) {
      if (data[part]) {
        data = data[part];
      } else {
        return Promise.resolve({
          exists: () => false,
          val: () => null,
          forEach: () => false,
        });
      }
    }

    return Promise.resolve({
      exists: () => true,
      val: () => data,
      forEach: (callback) => {
        Object.entries(data).forEach(([key, value]) => {
          callback({ key, val: () => value });
        });
        return false;
      },
    });
  }),
  push: vi.fn(() => ({ key: "mockKey" })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  onChildAdded: vi.fn(),
  onChildRemoved: vi.fn(),
  onChildChanged: vi.fn(),
  onValue: vi.fn((refPath, callback) => {
    callback({
      exists: () => true,
      val: () => mockDatabase[refPath] || null,
    });
  }),
  off: vi.fn(),
  query: vi.fn((refPath, ..._orderBys) => ({
    _mockPath: refPath, // Use this flag to identify query-style refs
  })),
  orderByChild: vi.fn((key) => `orderByChild(${key})`),
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
    currentUser: currentUserMock,
  })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(currentUserMock);
  }),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve("Email sent!")),
  signOut: vi.fn(() => Promise.resolve("User signed out!")),
  signInWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({ user: { uid: "mockUserId", email: "test@example.com" } })
  ),
  createUserWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({ user: { uid: "mockUserId", email: "test@example.com" } })
  ),
}));

vi.mock("../../js/firebaseConfig.js", () => ({
  auth: { currentUser: currentUserMock },
  database: {},
  app: {},
}));
