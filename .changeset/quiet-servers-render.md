---
'formatir': patch
---

`init()` no longer throws during server-side rendering when `root` is a selector; it returns a disabled instance like it does without `root`.
