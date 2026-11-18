const form = document.querySelector("#enquiry-form");

if (!(form instanceof HTMLFormElement)) {
  throw new Error("The trail enquiry form could not be found.");
}

const fields = [...form.querySelectorAll("input, textarea")];
const status = form.querySelector("#form-status");
const validationTimers = new WeakMap();
const touchedFields = new WeakSet();
let hasSubmitted = false;

if (!(status instanceof HTMLElement)) {
  throw new Error("The form status region could not be found.");
}

function getError(field) {
  const value = field.value.trim();

  if (field.name === "name" && value === "") {
    return "Enter your name.";
  }

  if (field.name === "email") {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === "") {
      return "Enter your email address.";
    }
    if (!emailPattern.test(value)) {
      return "Enter an email address in the format name@example.com.";
    }
  }

  if (field.name === "message") {
    if (value === "") {
      return "Enter a message.";
    }
    if (field.value.length > 500) {
      return "Keep your message to 500 characters or fewer.";
    }
  }

  return "";
}

function validateField(field) {
  const error = getError(field);
  const errorElement = form.querySelector(`#${field.id}-error`);

  field.setAttribute("aria-invalid", String(Boolean(error)));
  if (errorElement) {
    errorElement.textContent = error;
  }
  return error;
}

function validateTouchedFields() {
  const errors = [];
  for (const field of fields) {
    if (touchedFields.has(field) || hasSubmitted) {
      const error = validateField(field);
      if (error) {
        errors.push(error);
      }
    }
  }

  status.textContent = errors.length
    ? "Please correct the highlighted fields."
    : "";
}

form.addEventListener("input", (event) => {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    return;
  }

  touchedFields.add(field);
  window.clearTimeout(validationTimers.get(field));
  validationTimers.set(field, window.setTimeout(() => {
    validateField(field);
    validateTouchedFields();
  }, 300));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hasSubmitted = true;

  for (const field of fields) {
    window.clearTimeout(validationTimers.get(field));
    validateField(field);
  }
  const firstInvalidField = fields.find((field) => field.getAttribute("aria-invalid") === "true");

  if (firstInvalidField) {
    status.textContent = "Please correct the highlighted fields before sending your enquiry.";
    firstInvalidField.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      data[key] = value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);
    }
  }

  console.log(JSON.stringify(data, null, 2));
  status.textContent = "Thanks! Your enquiry is valid and ready to send.";
});
