import mockFns from "/home/runner/work/chasing21-SOEN341_Project_W25/chasing21-SOEN341_Project_W25/tests/setup/firebaseMocks.js";
import "/home/runner/work/chasing21-SOEN341_Project_W25/chasing21-SOEN341_Project_W25/tests/setup/firebaseMocks.js";

mockFns.onChildAdded.getMockImplementation((query, callback) => {
  callback({
    val: () => ({
      senderName: "MockSender",
      text: "Mock message",
    }),
    key: "msg1",
  });
});
mockFns.push.getMockImplementation(() => ({ key: "mockMessageId" }));
mockFns.set.getMockImplementation(() => Promise.resolve());
mockFns.get.getMockImplementation((refPath) => {
  if (refPath.includes("channels")) {
    return Promise.resolve({
      exists: () => true,
      val: () => ({
        name: "Test Channel",
        members: ["user1"],
        groupChatId: "mockGroupChatId",
      }),
    });
  }

  if (refPath.includes("users")) {
    return Promise.resolve({
      exists: () => true,
      val: () => ({
        user1: { id: "user1", role: "admin" },
      }),
    });
  }

  return Promise.resolve({ exists: () => false, val: () => null });
});

mockFns.orderByChild.getMockImplementation((key) => key);
mockFns.equalTo.getMockImplementation((value) => value);
mockFns.query.getMockImplementation(
  (ref, ...args) => `query:${ref}:${args.join(",")}`
);
mockFns.remove.getMockImplementation(() => Promise.resolve());
