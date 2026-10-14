---
'formatir': patch
---

A selector `root` is now matched on every event instead of once at `init()`. Tracking keeps working when a framework replaces the element, and a selector that matches nothing no longer falls back to tracking the whole document.
