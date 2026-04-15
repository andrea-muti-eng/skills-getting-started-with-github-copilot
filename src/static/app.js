export function initApp() {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  if (!activitiesList || !activitySelect || !signupForm || !messageDiv) {
    return;
  }

  const signupButton = signupForm.querySelector('button[type="submit"]');

  function updateSignupButtonState() {
    const selectedOption = activitySelect.options[activitySelect.selectedIndex];
    const disableSignup = !selectedOption || selectedOption.value === "" || selectedOption.disabled;

    signupButton.disabled = disableSignup;
    signupButton.title = selectedOption && selectedOption.disabled ? "This activity is full" : "";
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");

        const spotsLeft = details.max_participants - details.participants.length;
        const isFull = spotsLeft <= 0;

        activityCard.className = isFull ? "activity-card full" : "activity-card";

        const participantsList = details.participants.length > 0
          ? `<ul class="participants-list">${details.participants.map(p =>
              `<li><span class="participant-email">${p}</span><button class="remove-btn" data-activity="${name}" data-email="${p}" title="Unregister">🗑️</button></li>`
            ).join("")}</ul>`
          : `<p class="no-participants">No participants yet. Be the first!</p>`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <h4>${name}</h4>
            ${isFull ? '<span class="status-badge">Full</span>' : ""}
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
            ${participantsList}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = spotsLeft > 0 ? name : `${name} (Full)`;
        option.disabled = spotsLeft <= 0;
        activitySelect.appendChild(option);
      });

      updateSignupButtonState();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister button clicks via event delegation
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".remove-btn");
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const selectedOption = activitySelect.options[activitySelect.selectedIndex];

    if (!activity || (selectedOption && selectedOption.disabled)) {
      messageDiv.textContent = "This activity is full. Please select another one.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  activitySelect.addEventListener("change", updateSignupButtonState);
  fetchActivities();
}

if (!window.__DISABLE_AUTO_INIT__) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp, { once: true });
  } else {
    initApp();
  }
}
