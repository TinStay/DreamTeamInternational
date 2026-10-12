/**
 * Paddle statuses that still count as a plan the client has - a payment being retried (`past_due`) and a paused plan
 * included - one of these blocks buying another. A plain module (no server imports), so the browser can use it too.
 */
export const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "paused"] as const;

export const isLiveStatus = (status: string) => (LIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
