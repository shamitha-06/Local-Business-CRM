# Firestore Security Specification

## Data Invariants
1. A Business profile can only be managed by its owner (where `businessId` matches `auth.uid`).
2. Customers, Leads, and Reminders must belong to a valid Business.
3. Access to sub-resources is strictly derived from ownership of the parent Business.
4. Timestamps (`createdAt`, `updatedAt`, `lastInteraction`) must be set by the server.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing**: Attempt to create a Business doc with a different `ownerId` than the authenticated user.
2. **Resource Poisoning**: Use a 1MB string as a Customer name.
3. **Ghost Fields**: Attempt to update a Lead with a hidden `isVerified: true` field.
4. **State Shortcutting**: Change a Lead status from "New Lead" to "VIP" directly if business logic forbids it.
5. **Orphaned Writes**: Create a Reminder for a non-existent Business ID.
6. **Time Travel**: Manually set a future `createdAt` date from the client.
7. **Cross-Business Access**: Fetch customers belonging to `business_B` while signed in as `user_A`.
8. **Admin Injection**: Attempt to set `isAdmin: true` on a profile.
9. **Unbounded Lists**: Store all customer notes in a single document array (leading to 1MB doc explosion). *Solution: Use subcollections.*
10. **Partial Key Leak**: Update a Lead but omit the required `businessId` field.
11. **Negative Counters**: Set `visitCount` to -1.
12. **Public Scrape**: Authenticated user trying to list ALL businesses without a filter.

## Test Runner (Logic Verification)
*Verification via firestore.rules.test.ts (Conceptual)*
- `test('deny cross-user read', ...)`
- `test('deny invalid schema creation', ...)`
- `test('enforce server timestamps', ...)`
