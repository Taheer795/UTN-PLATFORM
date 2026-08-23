# Firebase Security Specification

## Data Invariants
1. **User Ownership**: Users can only modify their own profiles.
2. **Admin Privileges**: Only admins can delete any listing. Sellers can only delete their own listings.
3. **Listing Integrity**: A listing must have a valid price (>0) and a siloType.
4. **Request Immutability**: Once a request is paid, its price and listingId cannot be changed.
5. **Authenticity**: `sellerId` in a listing and `userId` in a request must match the authenticated user's UID.
6. **Timestamp Integrity**: `createdAt` must be the server time.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing (Listing)**: Create a listing with a `sellerId` that doesn't match `auth.uid`.
2. **Identity Spoofing (Request)**: Create a request with a `userId` that doesn't match `auth.uid`.
3. **Price Manipulation (Update)**: Update the price of someone else's listing.
4. **Admin Escalation**: Attempt to write to `users/{userId}` with `role: "admin"` as a normal user.
5. **Shadow Field Injection**: Add `isVerified: true` to a listing create payload when not authorized.
6. **Negative Price**: Create a listing with `price: -100`.
7. **Orphaned Request**: Create a request for a `listingId` that doesn't exist.
8. **Bypassing Server Timestamps**: Attempt to set `createdAt` manually to a past date.
9. **Status Jumping**: Update a request directly to `paid` without a valid payment flow (if we have status logic).
10. **Malicious ID**: Use a 2KB string as a document ID.
11. **PII Leak**: Attempt to read the entire `users` collection without being an admin.
12. **Cross-Silo Poisoning**: Create an apparel listing but set `siloType: "garage"`.

## Red Team Results expectation
All the above payloads MUST return `PERMISSION_DENIED`.
