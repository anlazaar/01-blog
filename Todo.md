## DONE

- [x] Navbar profile data doesn't load after loggin/register or patch profile data.
- [x] Static routes conflict with `/{id}` (e.g. `/drafts`, `/saved`, `/search`) → reorder mappings.
- [x] Repeated `SecurityContextHolder` usage → replace with `@AuthenticationPrincipal`.
- [x] Wrong HTTP semantics:
- [x] Replace `@Formula` counts with optimized queries OR stored counters.
- [x] Missing explicit `fetch = LAZY` on some relations (avoid accidental eager loading).
- [x] Delete cascade issues across:
  - `post_hashtags`
  - `post_likes`
  - `comments`
  - `saved_posts`
  - `content_chunks`
- [x] Add DB indexes:

  - `posts.author_id`
  - `posts.created_at`
  - `comments.post_id`
  - `post_likes.post_id`
  - `saved_posts.user_id`
  - `post_hashtags.post_id`

- [x] Potential infinite recursion / heavy JSON → ensure all relations are hidden (already partially fixed).
- [x] Collections not initialized (risk of `NullPointerException`).
- [x] No global exception handling (`@RestControllerAdvice` missing).
- [x] Weak error consistency (different response shapes everywhere).
- [x] Missing validation on update/patch DTOs (`@Valid`).
- [x] Make sure cached data does not break serialization.
- [x] Improve cache naming strategy.
- [-] Tune TTL per cache type.
- [x] Replace polymorphic serializer with cleaner DTO-based serialization.
- [-] Optimize JWT filter current-user DB lookup.---
- [x] Separate controller logic from response formatting.
- [x] Introduce consistent API response format.
- [x] 5 → Optimize `@Formula` + queries
- [x] 6 → Add indexes + search optimization
- [x] 7 → Add global error handling
- [x] 2 → Fix delete cascade issues
- [x] Avoid caching user-specific post responses globally unless userId is part of the key.
- [x] Cache DTOs when easy, but do not refactor the whole app only for this.
- [x] save/unsave if saved state is inside cached response

## 🔧 FIX

- [ ] Backend private keys should be set to an env or locally to local docker container.

- [ ] add tika file MIME security in backend

- [ ] ARCHIEVED POST SHOULD APPEAR IN POSTS LIST FOR THE ADMIN.
- [ ] MEDIA VALIDATION BEFORE UPLOADING.

- [ ] FIX THIS ERROR ON THE ADMIN PAGE:
      home:1 EventSource's response has a MIME type ("text/html") that is not "text/event-stream". Aborting the connection.

- [ ] `/api/users/{id}/block` is public (`permitAll`) → should be protected + not `GET`.

  - create → should return `201`
  - delete/clear → should return `204`

- [ ] Returning raw `Map.of(...)` instead of proper response DTOs.

- [ ] Service layer missing strict ownership checks (user editing/deleting others' posts).

- [ ] JWT filter loads full User from DB on every authenticated request to check banned status and build principal.  
       Look into later: replace full User principal with lightweight AuthUser principal, and handle banned users with cache/token invalidation/short-lived access tokens.

---

## 🚀 FEATURES / IMPROVEMENTS

- [ ] Convert all list endpoints to proper pagination (`Page` or custom response).
- [ ] Add max page size protection (prevent abuse like `size=100000`).
- [ ] Improve search performance (optimize JPA Specifications queries).
- [ ] Implement DTO mapper layer (clean separation from entities).
- [ ] Replace `List` with `Set` where duplicates are not allowed (hashtags already good).
- [ ] Add bidirectional sync in helper methods (e.g. hashtag ↔ post).

---

## ⚡ REDIS / CACHE

### MUST FIX

- [ ] Make sure post cache is evicted after:
  - [x] post update/delete
  - [ ] comment add/delete
  - [ ] like/unlike

### SHOULD FIX

### OPTIONAL / LATER

## 📁 FILE / MEDIA

- [ ] Validate file size limits.
- [ ] Validate MIME types (image/video only).
- [ ] Secure file naming (avoid collisions & injection).
- [ ] Handle orphan files if post creation fails.
- [ ] Move upload config to env variables.

---

## 🔐 SECURITY

- [ ] Move CORS origin to config (env-based).
- [ ] Add production frontend URL.
- [ ] Review role logic (`hasRole` vs `hasAnyRole`) for admin access consistency.

---

## 🧠 CLEAN ARCHITECTURE

- [ ] Centralize authorization logic in service layer.
- [ ] Add logging for critical actions (create/delete/update).
- [-] Add integration tests for:

  - post lifecycle
  - delete cascade
  - search filters
  - cache behavior

---

## 📌 PRIORITY ORDER (VERY IMPORTANT)

- [ ] 1 → Fix security + authorization logic
- [ ] 3 → Fix controller routing + DTO cleanup
- [ ] 4 → Fix Redis strategy (DTO caching + eviction)
