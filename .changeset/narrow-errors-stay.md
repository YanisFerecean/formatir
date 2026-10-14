---
'formatir': minor
---

New `errorScope` option: `'root'` limits `js_error` to errors that happen while the user works in `root` (focus inside it, or within 2 s of an interaction there). The default `'page'` keeps reporting every error.
