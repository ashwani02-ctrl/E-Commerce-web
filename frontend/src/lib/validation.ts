import type { ProductInput } from "@/types/api";
import { rupeesToCents } from "./format";

// These mirror the backend's Zod rules, so users get instant feedback.
// The backend still checks everything again.

/* ---------- password ---------- */

export const PASSWORD_RULES = [
  { id: "length", label: "8 to 72 characters", test: (p: string) => p.length >= 8 && p.length <= 72 },
  { id: "lower", label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "A number", test: (p: string) => /[0-9]/.test(p) },
] as const;

/** For the live checklist under the password box */
export const checkPassword = (password: string) =>
  PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, passed: rule.test(password) }));

export const isPasswordValid = (password: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(password));

/* ---------- small field checks (return an error message, or "" when fine) ---------- */

export const validateEmail = (email: string): string =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 255
    ? ""
    : "Enter a valid email address";

export const validateName = (name: string): string => {
  const n = name.trim();
  return n.length >= 2 && n.length <= 100 ? "" : "Name must be 2 to 100 characters";
};

export const validateShippingAddress = (address: string): string => {
  const a = address.trim();
  return a.length >= 10 && a.length <= 500 ? "" : "Enter your full address (at least 10 characters)";
};

export const validateStore = (values: { name: string; description: string }): Record<string, string> => {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  if (name.length < 2 || name.length > 100) errors.name = "Store name must be 2 to 100 characters";
  if (values.description.trim().length > 1000) errors.description = "Description can be at most 1000 characters";
  return errors;
};

/* ---------- product form ---------- */

export interface ProductFormValues {
  title: string;
  description: string;
  price: string; // in rupees, as typed
  stock: string;
  category: string;
  brand: string;
  discountPercent: string;
  imageUrl: string;
  images: string[];
  tags: string[];
}

export const emptyProductForm: ProductFormValues = {
  title: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  brand: "",
  discountPercent: "",
  imageUrl: "",
  images: [],
  tags: [],
};

const isUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && value.length <= 500;
  } catch {
    return false;
  }
};

/** Returns field errors, or the body ready to send (price already converted to cents) */
export function validateProductForm(values: ProductFormValues): {
  errors: Record<string, string>;
  data?: ProductInput;
} {
  const errors: Record<string, string> = {};

  const title = values.title.trim();
  if (title.length < 2 || title.length > 150) errors.title = "Title must be 2 to 150 characters";

  const description = values.description.trim();
  if (description.length > 2000) errors.description = "Description can be at most 2000 characters";

  const rupees = Number(values.price);
  const priceCents = rupeesToCents(rupees);
  if (!values.price.trim() || !Number.isFinite(rupees) || priceCents <= 0 || priceCents > 100_000_000) {
    errors.price = "Enter a price above 0 (up to ₹10,00,000)";
  }

  const stock = Number(values.stock);
  if (!values.stock.trim() || !Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    errors.stock = "Stock must be a whole number from 0 to 100000";
  }

  const category = values.category.trim();
  if (category.length > 50) errors.category = "Category can be at most 50 characters";

  const brand = values.brand.trim();
  if (brand.length > 100) errors.brand = "Brand can be at most 100 characters";

  let discountPercent: number | undefined;
  if (values.discountPercent.trim()) {
    discountPercent = Number(values.discountPercent);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 90) {
      errors.discountPercent = "Discount must be between 0 and 90";
    }
  }

  const imageUrl = values.imageUrl.trim();
  if (imageUrl && !isUrl(imageUrl)) errors.imageUrl = "Enter a valid image link (https://...)";

  const images = values.images.map((i) => i.trim()).filter(Boolean);
  if (images.length > 10) errors.images = "You can add at most 10 images";
  else if (images.some((i) => !isUrl(i))) errors.images = "Every image must be a valid link";

  const tags = values.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length > 10) errors.tags = "You can add at most 10 tags";
  else if (tags.some((t) => t.length > 30)) errors.tags = "Each tag can be at most 30 characters";

  if (Object.keys(errors).length > 0) return { errors };

  const data: ProductInput = { title, priceCents, stock };
  if (description) data.description = description;
  if (category) data.category = category;
  if (brand) data.brand = brand;
  if (discountPercent !== undefined) data.discountPercent = discountPercent;
  if (imageUrl) data.imageUrl = imageUrl;
  if (images.length) data.images = images;
  if (tags.length) data.tags = tags;

  return { errors, data };
}