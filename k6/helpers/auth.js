import http from "k6/http";
import { check, fail } from "k6";

export function login(email, password) {
  const payload = JSON.stringify({
    email,
    password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    "http://localhost:8080/api/auth/login",
    payload,
    params
  );

  const ok = check(res, {
    "login status is 200": (r) => r.status === 200,
    "response has body": (r) => r.body && r.body.length > 0,
  });

  if (!ok) {
    fail(`Login failed: status=${res.status}, body=${res.body}`);
  }

  return res.json("token");
}
