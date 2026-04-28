# TODOS

## Backend tests

### Stripe payment-intent test requires real test key
**Priority:** P2

`backend/__tests__/booking.test.ts` calls `POST /api/create-payment-intent` which hits the real Stripe API. Currently the dev `.env.docker` has the literal placeholder `DW_STRIPE_SECRET_KEY=STRIPE_SECRET_KEY`, so Stripe rejects the request and the test fails with 400.

**Fix:** Either (a) document in `LOCAL-SETUP.md` that contributors need to set a real `sk_test_...` key in `.env.docker` before running tests, OR (b) mock `stripe.paymentIntents.create` at the test boundary so the suite doesn't depend on external network + credentials.

Noticed by `/ship` on 2026-04-19 (002-host-signup branch).

## Completed
