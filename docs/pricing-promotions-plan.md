# MSC Pricing Promotions: Product and Delivery Plan

## Goal
Help event organizers improve early registrations and targeted outreach with reliable early-bird pricing and coupon codes, without weakening MSC's registration capacity or Razorpay payment controls.

## MVP product decisions
- Support paid events in INR. Existing event registration fee remains the base price.
- Support two promotion types: automatic early-bird offers and manually entered coupon codes.
- Support fixed-rupee and percentage discounts.
- Support start/end timestamps, total redemption limit, per-email limit, and minimum order amount.
- Apply one promotion per registration in the MVP. Entering a valid coupon replaces the automatic early-bird offer. No stacking.
- Percentage discounts are capped at 99%. Checkout must remain a positive amount; free tickets continue to use MSC's existing free-event flow.
- A coupon/offer is held for the payment reservation window and counted as redeemed only after Razorpay payment is captured and verified.
- The backend is authoritative. Browser totals are previews only.

## Participant flow
1. Open a paid event and see the base price and any currently active early-bird price.
2. Optionally enter a coupon code and choose Apply.
3. See the base price, discount, and final price before submitting registration.
4. Complete the existing registration and no-refund acknowledgment.
5. Server rechecks the selected promotion, limits, dates, email eligibility, and amount while creating the Razorpay order.
6. The verified Razorpay amount must equal the order amount stored by MSC. Successful payment confirms registration and redeems the offer.
7. Failed/abandoned/expired payment releases or expires the promotion hold. A failed payment must not consume a redemption.

## Organizer flow
- Open Admin > Event > Pricing & promotions.
- Create an early-bird offer or coupon with discount type/value, validity window, usage caps, per-email cap, and minimum order.
- View active/disabled promotions and disable an offer without deleting its redemption history.
- Keep event base price in the existing event editor. Promotion changes do not rewrite historical payment records.

## Backend and data model
- `event_promotions`: event-scoped promotion configuration and constraints.
- `event_promotion_redemptions`: per-registration reservation/redeemed state and expiry.
- `payment_orders`: stores the selected promotion and discount amount in addition to the final paise amount.
- Database RPCs validate/preview and reserve promotions. Promotion rows are locked during reservation so the final limited redemption is not oversold.
- A payment insert trigger marks a valid reservation redeemed in the same transaction as payment confirmation.
- Keep new tables service-role-only. Admin mutations pass through `requireAdmin`; public validation exposes only the quote result, not private organizer data.

## Rollout plan
### Phase 0, reliability and schema
- Add the migration and apply it to staging first.
- Verify current paid checkout, registration idempotency, and event capacity behavior before turning promotions on.
- Confirm migration backfill/compatibility for existing payment orders. New promotion columns default to no discount.

### Phase 1, MVP
- Add public coupon validation and early-bird quote.
- Add coupon entry and price breakdown to event registration.
- Integrate promotion reservation into Razorpay order creation.
- Add organizer create/list/disable controls and API validation.
- Add tests for amount calculation, dates, caps, duplicate attempts, failed payments, and capacity preservation.

### Phase 2, post-MVP
- Add promotion editing, usage analytics, exports, and redemption audit history.
- Add campaign links, student eligibility rules, referral codes, and team-level discounts.
- Consider stacking only after organizer research and accounting review.
- Add automated release jobs for abandoned holds if monitoring shows expired rows are operationally noisy. Expired holds are already excluded from quota checks.

## Acceptance criteria
- A valid early-bird offer is automatically selected when no coupon code is supplied.
- A valid coupon takes precedence over early-bird pricing. Invalid, inactive, not-yet-started, expired, below-minimum, or exhausted offers are rejected.
- A percentage/fixed discount never exceeds the ticket price and never produces a zero-value Razorpay order.
- The browser cannot set the final amount. The order amount is derived from event pricing and the server-side promotion RPC.
- Concurrent requests cannot exceed the total offer limit or the event capacity.
- A payment is not marked redeemed until the captured payment is verified.
- Failed order creation releases the offer hold; expired reservations do not count toward usage.
- Coupon codes are normalized to uppercase and constrained to 3–32 characters.
- Admin operations require admin authorization and are rate limited.
- Existing free registration and paid registration without promotions continue to work.

## Metrics and monitoring
- Promotion redemption count and conversion rate.
- Early-bird registrations before/after the offer deadline.
- Checkout completion and payment failure rate by promotion.
- Discount amount and net revenue per paid registration.
- Coupon validation errors and promotion hold expiry count.
- Oversold event seats and oversold promotion quotas, target zero.

## Deployment checklist
1. Review the migration and run it against a staging Supabase project.
2. Run typecheck, lint, unit tests, and end-to-end Razorpay test-mode checkout.
3. Test two simultaneous checkouts for the final coupon slot and final event seat.
4. Verify webhook and verify-payment paths both insert captured payment records as expected.
5. Deploy the app and migration together. Keep promotions inactive until organizer settings are ready.
6. Enable one internal test offer, validate receipts/admin payment reports, then enable for public events.
