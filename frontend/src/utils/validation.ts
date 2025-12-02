// Validation utility functions

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password should contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password should contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password should contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

// Required field validation
export const validateRequired = (
  value: string | number | undefined | null,
  fieldName: string
): string | null => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return `${fieldName} is required`;
  }
  return null;
};

// Number validation
export const validateNumber = (
  value: string | number,
  min?: number,
  max?: number
): string | null => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "Must be a valid number";
  }
  if (min !== undefined && num < min) {
    return `Must be at least ${min}`;
  }
  if (max !== undefined && num > max) {
    return `Must be at most ${max}`;
  }
  return null;
};

// Date validation
export const validateDate = (
  date: string,
  minDate?: Date,
  maxDate?: Date
): string | null => {
  if (!date) return "Date is required";

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return "Invalid date format";
  }

  if (minDate && selectedDate < minDate) {
    return `Date must be after ${minDate.toLocaleDateString()}`;
  }

  if (maxDate && selectedDate > maxDate) {
    return `Date must be before ${maxDate.toLocaleDateString()}`;
  }

  return null;
};

// Time validation
export const validateTime = (time: string): string | null => {
  if (!time) return "Time is required";

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return "Invalid time format (use HH:MM)";
  }

  return null;
};

// Name validation
export const validateName = (
  name: string,
  fieldName: string = "Name"
): string | null => {
  const required = validateRequired(name, fieldName);
  if (required) return required;

  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }
  if (name.length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }
  if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods`;
  }

  return null;
};

// URL validation
export const validateURL = (url: string): string | null => {
  if (!url) return null; // Optional
  try {
    new URL(url);
    return null;
  } catch {
    return "Invalid URL format";
  }
};

// Rating validation
export const validateRating = (rating: number): string | null => {
  if (rating < 1 || rating > 5) {
    return "Rating must be between 1 and 5";
  }
  return null;
};

// Form validation helper
export const validateForm = (
  fields: Record<string, string | null>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(fields).forEach(([field, error]) => {
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Check if form is valid
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};
