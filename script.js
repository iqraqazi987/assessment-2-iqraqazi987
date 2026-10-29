const form = document.querySelector("#trail-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const messageInput = document.querySelector("#message");
const charCount = document.querySelector("#char-count");
const formStatus = document.querySelector("#form-status");

const fields = [
  { input: nameInput, error: document.querySelector("#name-error"), key: "name" },
  { input: emailInput, error: document.querySelector("#email-error"), key: "email" },
  { input: messageInput, error: document.querySelector("#message-error"), key: "message" }
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const debounceTimers = new Map();

function sanitizeText(value) {
  // Normalize and trim input; remove unsafe control characters.
  // Never insert user input with innerHTML. Use textContent for any future display.
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function validateField(input) {
  const value = sanitizeText(input.value);
  let message = "";

  if (input === nameInput && value.length === 0) {
    message = "Please enter your name.";
  } else if (input === emailInput && value.length === 0) {
    message = "Please enter your email address.";
  } else if (input === emailInput && !emailPattern.test(value)) {
    message = "Enter a valid email address, such as name@example.com.";
  } else if (input === messageInput && value.length === 0) {
    message = "Please enter your question.";
  } else if (input === messageInput && value.length > 500) {
    message = "Your message must be 500 characters or fewer.";
  }

  const errorElement = document.querySelector(`#${input.id}-error`);
  input.setAttribute("aria-invalid", String(Boolean(message)));
  errorElement.textContent = message;
  return !message;
}

function debounceValidation(input) {
  const existingTimer = debounceTimers.get(input);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    validateField(input);
    debounceTimers.delete(input);
  }, 300);

  debounceTimers.set(input, timer);
}

fields.forEach(({ input }) => {
  input.addEventListener("input", () => {
    debounceValidation(input);
    formStatus.textContent = "";
    formStatus.className = "status";
  });

  input.addEventListener("blur", () => {
    const timer = debounceTimers.get(input);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(input);
    }
    validateField(input);
  });
});

messageInput.addEventListener("input", () => {
  charCount.textContent = `${messageInput.value.length} / 500`;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  // Cancel pending debounced validations so submit validation is immediate.
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();

  const results = fields.map(({ input }) => validateField(input));
  const isValid = results.every(Boolean);

  if (!isValid) {
    formStatus.textContent = "Please correct the errors below and submit the form again.";
    formStatus.className = "status failure";
    const firstInvalid = fields.find(({ input }) => input.getAttribute("aria-invalid") === "true");
    firstInvalid?.input.focus();
    return;
  }

  // Build a clean data object for the console demonstration.
  const rawData = Object.fromEntries(new FormData(form).entries());
  const data = Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeText(value) : value
    ])
  );

  console.log(JSON.stringify(data, null, 2));

  formStatus.textContent = "Your enquiry passed validation. The form data was printed to the browser console; no email was sent.";
  formStatus.className = "status success";
  formStatus.focus();
});
