/**
 * Validates a contact phone number.
 * Must be exactly 10 numeric digits.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateContactNumber(contact?: string | null): string | null {
  if (!contact || contact.trim() === "") {
    return null; // Field is optional if empty
  }

  const str = contact.trim();

  if (!/^[0-9]{10}$/.test(str)) {
    return "Contact number must be exactly 10 digits.";
  }

  return null;
}

/**
 * Validates a password.
 * Must be at least 6 characters long and contain both letters and numbers.
 * Returns an error message string if invalid, or null if valid.
 */
export function validatePassword(password?: string | null): string | null {
  if (!password || password.trim() === "") {
    return "Password is required.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain both letters and numbers.";
  }

  return null;
}
