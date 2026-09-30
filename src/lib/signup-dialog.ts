/** Opens the sign-up / log-in popup (`components/auth-dialog.tsx`, mounted once by the site header) from anywhere. */
export const AUTH_EVENT = "izi:open-auth";

export type AuthMode = "signup" | "login";

function open(mode: AuthMode) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<AuthMode>(AUTH_EVENT, { detail: mode }));
}

export const openSignup = () => open("signup");
export const openLogin = () => open("login");
