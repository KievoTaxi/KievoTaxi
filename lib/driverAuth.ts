export const DRIVER_SESSION_COOKIE = "driver_session";

export function verifyDriverPassword(inputPassword: string) {
  const expectedPassword = process.env.DRIVER_ACCESS_PASSWORD;

  if (!expectedPassword) {
    throw new Error("Brak DRIVER_ACCESS_PASSWORD w env");
  }

  // DEBUG
  console.log("INPUT:", `[${inputPassword}]`);
  console.log("EXPECTED:", `[${expectedPassword}]`);
  console.log("INPUT LENGTH:", inputPassword.length);
  console.log("EXPECTED LENGTH:", expectedPassword.length);

  return inputPassword.trim() === expectedPassword.trim();
}

export function createDriverSession(_days = 30) {
  return "driver-ok";
}

export function verifyDriverSession(token?: string | null) {
  return token === "driver-ok";
}