import { login } from "../helpers/auth.js";

// You can define multiple users if needed
export const testUsers = [
  { email: "attachedboy@gmail.com", password: "attachedboy@gmail.com" },
  // Add more users here if needed
];

export function getRandomUser() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  return {
    ...user,
    token: login(user.email, user.password), // dynamically log in and get token
  };
}
