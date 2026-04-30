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

## 🔧 FIX

- [ ] Backend private keys should be set to an env or locally to local docker container.

- [ ] `/api/users/{id}/block` is public (`permitAll`) → should be protected + not `GET`.
- [ ] Missing validation on update/patch DTOs (`@Valid`).

  - create → should return `201`
  - delete/clear → should return `204`

- [ ] Returning raw `Map.of(...)` instead of proper response DTOs.
- [ ] Potential infinite recursion / heavy JSON → ensure all relations are hidden (already partially fixed).
- [ ] Collections not initialized (risk of `NullPointerException`).

- [ ] Service layer missing strict ownership checks (user editing/deleting others' posts).
- [ ] No global exception handling (`@RestControllerAdvice` missing).
- [ ] Weak error consistency (different response shapes everywhere).

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

- [ ] Cache only DTOs (NOT entities).
- [ ] Add proper cache naming strategy:

  - `posts:list`
  - `posts:single`
  - `posts:search`

- [ ] Implement cache eviction on:

  - post create/update/delete
  - like/unlike
  - comment add/delete
  - save/unsave

- [ ] Avoid caching user-specific data globally (include userId in key).
- [ ] Tune TTL per cache type (not one global value).

---

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

- [ ] Separate controller logic from response formatting.
- [ ] Centralize authorization logic in service layer.
- [ ] Introduce consistent API response format.
- [ ] Add logging for critical actions (create/delete/update).
- [ ] Add integration tests for:

  - post lifecycle
  - delete cascade
  - search filters
  - cache behavior

---

## 📌 PRIORITY ORDER (VERY IMPORTANT)

- [ ] 1 → Fix security + authorization logic
- [ ] 2 → Fix delete cascade issues
- [ ] 3 → Fix controller routing + DTO cleanup
- [ ] 4 → Fix Redis strategy (DTO caching + eviction)
- [ ] 5 → Optimize `@Formula` + queries
- [ ] 6 → Add indexes + search optimization
- [ ] 7 → Add global error handling
