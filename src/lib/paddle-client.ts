"use client";

import { CheckoutEventNames, initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";

/**
 * The browser side of Paddle: its overlay checkout, opened on our own page for a transaction the server created
 * (`/api/checkout`, `/api/project-requests/checkout`). Paddle.js is loaded only when a client actually buys - nothing of it
 * runs on a page view, so it needs no cookie consent. Needs `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (Paddle → Developer tools →
 * Authentication → client-side token) and `NEXT_PUBLIC_PADDLE_ENVIRONMENT` (`sandbox` unless it says `production`).
 */
let instance: Promise<Paddle | undefined> | null = null;
let onEvent: ((e: PaddleEventData) => void) | null = null;

function paddleJs(): Promise<Paddle | undefined> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return Promise.resolve(undefined);
  instance ??= initializePaddle({
    token,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox",
    eventCallback: (e) => onEvent?.(e),
  }).catch(() => {
    instance = null;
    return undefined;
  });
  return instance;
}

/**
 * Opens Paddle's checkout over the page for a transaction: once it is paid Paddle sends the browser to `successUrl`;
 * closed without paying, `onClosed` runs. Returns false when Paddle.js could not be loaded (no client token, blocked).
 */
export async function openPaddleCheckout(transactionId: string, opts: { successUrl: string; onClosed?: () => void }): Promise<boolean> {
  const paddle = await paddleJs();
  if (!paddle) return false;
  let paid = false;
  onEvent = (e) => {
    if (e.name === CheckoutEventNames.CHECKOUT_COMPLETED) paid = true;
    if (e.name === CheckoutEventNames.CHECKOUT_CLOSED && !paid) opts.onClosed?.();
  };
  paddle.Checkout.open({
    transactionId,
    settings: { displayMode: "overlay", theme: "dark", locale: "en", successUrl: opts.successUrl, allowLogout: false },
  });
  return true;
}
