// utils/generateUsername.ts
export const generateUsername = (name: string) => {
  // Remove spaces, lowercase, add random 4-digit number
  const base = name.toLowerCase().replace(/\s+/g, "");
  const random = Math.floor(Math.random() * 10000);
  return `${base}${random}`;
};
