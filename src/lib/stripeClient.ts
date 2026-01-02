import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with publishable key
export const stripePromise = loadStripe(
  "pk_live_51SdJNlBBqKy6E8PpqD1bYfJvJ3mOPiUW6rxPNg5SCQF4bDFiE8OKvPYzCaVBxmXcQqJwWqvQfZJc3rTYEoZkDV5n00T55yV3nT"
);
