// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderShell() {
  document.body.innerHTML = `
    <main>
      <section>
        <div id="activities-list"><p>Loading activities...</p></div>
      </section>
      <section>
        <form id="signup-form">
          <input type="email" id="email" />
          <select id="activity">
            <option value="">-- Select an activity --</option>
          </select>
          <button type="submit">Sign Up</button>
        </form>
        <div id="message" class="hidden"></div>
      </section>
    </main>
  `;
}

async function loadAppWithActivities(activities) {
  renderShell();
  window.__DISABLE_AUTO_INIT__ = true;
  vi.resetModules();

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => activities,
  });

  const { initApp } = await import("../../src/static/app.js");
  initApp();
  await Promise.resolve();
  await Promise.resolve();
}

describe("frontend full activity handling", () => {
  const activities = {
    "Chess Club": {
      description: "Chess",
      schedule: "Friday",
      max_participants: 2,
      participants: ["a@mergington.edu", "b@mergington.edu"],
    },
    "Art Studio": {
      description: "Art",
      schedule: "Monday",
      max_participants: 3,
      participants: ["c@mergington.edu"],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete window.__DISABLE_AUTO_INIT__;
    document.body.innerHTML = "";
  });

  it("disables full activities in the select and marks them as full", async () => {
    await loadAppWithActivities(activities);

    const options = Array.from(document.getElementById("activity").options);
    const fullOption = options.find((option) => option.value === "Chess Club");
    const openOption = options.find((option) => option.value === "Art Studio");
    const fullBadge = document.querySelector(".status-badge");

    expect(fullOption.disabled).toBe(true);
    expect(fullOption.textContent).toContain("(Full)");
    expect(openOption.disabled).toBe(false);
    expect(fullBadge.textContent).toBe("Full");
  });

  it("keeps signup disabled and prevents submit when a full activity is selected", async () => {
    await loadAppWithActivities(activities);

    const activitySelect = document.getElementById("activity");
    const signupButton = document.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById("message");
    const emailInput = document.getElementById("email");
    const fullIndex = Array.from(activitySelect.options).findIndex((option) => option.value === "Chess Club");

    emailInput.value = "new.student@mergington.edu";
    activitySelect.selectedIndex = fullIndex;
    activitySelect.dispatchEvent(new Event("change"));
    document.getElementById("signup-form").dispatchEvent(new Event("submit"));

    expect(signupButton.disabled).toBe(true);
    expect(signupButton.title).toBe("This activity is full");
    expect(messageDiv.textContent).toBe("This activity is full. Please select another one.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("enables signup when an available activity is selected", async () => {
    await loadAppWithActivities(activities);

    const activitySelect = document.getElementById("activity");
    const signupButton = document.querySelector('button[type="submit"]');
    const openIndex = Array.from(activitySelect.options).findIndex((option) => option.value === "Art Studio");

    activitySelect.selectedIndex = openIndex;
    activitySelect.dispatchEvent(new Event("change"));

    expect(signupButton.disabled).toBe(false);
    expect(signupButton.title).toBe("");
  });
});
