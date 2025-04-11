import { describe, it, expect, vi, beforeEach } from "vitest";
import "../../tests/setup/globalMocks.js";
import "../../tests/setup/firebaseMocks.js";
import { update } from "firebase/database";

import {
  handleLogout,
  handleDeletePicture,
  handleConfirmName,
  handleProfilePicChange,
  toggleEditProfile,
  toggleNotification,
  handleStatusChange,
} from "../../js/dashboard.js";
import * as pageLoading from "../../js/pageLoading.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = `
    <div id="sidebar" class="sidebar"></div>
    <div id="toggleSettings" hidden></div>
    <div id="toggleNotification" hidden></div>
    <div id="editProfile" hidden></div>
    <input id="editName" value="New Name" />
    <input id="newProfilePic" type="file" />
  `;
});

describe("Dashboard.js", () => {
  it("should toggle notification visibility", () => {
    const sidebar = document.getElementById("sidebar");
    const notification = document.getElementById("toggleNotification");

    toggleNotification();

    expect(sidebar.classList.contains("active")).toBe(true);
    expect(notification.hidden).toBe(false);

    toggleNotification();

    expect(sidebar.classList.contains("active")).toBe(false);
    expect(notification.hidden).toBe(true);
  });

  it("should toggle edit profile visibility", () => {
    const sidebar = document.getElementById("sidebar");
    const editProfile = document.getElementById("editProfile");

    toggleEditProfile();

    expect(sidebar.classList.contains("active")).toBe(true);
    expect(editProfile.hidden).toBe(false);

    toggleEditProfile();

    expect(sidebar.classList.contains("active")).toBe(false);
    expect(editProfile.hidden).toBe(true);
  });

  it("should handle logout", async () => {
    global.alert = vi.fn();

    await handleLogout();

    expect(alert).toHaveBeenCalledWith("You have been logged out.");
  });

  it("should handle profile picture deletion", async () => {
    const spy = vi.spyOn(pageLoading, "updateProfilePictureUI");
    global.alert = vi.fn();

    await handleDeletePicture();

    expect(spy).toHaveBeenCalledWith("../images/defaultUserLogo.png");
    expect(alert).toHaveBeenCalledWith("Profile picture deleted successfully!");

    spy.mockRestore();
  });

  it("should handle profile picture change", () => {
    const fileInput = document.getElementById("newProfilePic");
    const file = new File(["dummy content"], "profile.png", {
      type: "image/png",
    });
    const event = { target: { files: [file] } };

    global.alert = vi.fn();
    const readerMock = {
      readAsDataURL: vi.fn(),
      onload: null,
    };
    global.FileReader = vi.fn(() => readerMock);

    handleProfilePicChange(event);

    expect(readerMock.readAsDataURL).toHaveBeenCalledWith(file);
  });

  it("should handle name confirmation", async () => {
    global.alert = vi.fn();
    const input = document.getElementById("editName");
    input.value = "Updated Name";

    await handleConfirmName({ preventDefault: vi.fn() });

    expect(alert).toHaveBeenCalledWith("Name updated successfully!");
  });

  it("should handle status change", async () => {
    const event = { target: { value: "away" } };

    await handleStatusChange(event);

    expect(update).toHaveBeenCalled();
  });
});
