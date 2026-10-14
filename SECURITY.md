# Security Policy

## Supported versions

Security fixes are released for the latest minor version of `formatir`.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| older   | ❌        |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report them privately through GitHub:
[**Report a vulnerability**](https://github.com/YanisFerecean/formatir/security/advisories/new)
(Security tab -> *Report a vulnerability*).

Please include:

- the affected version and entry point (`formatir`, `formatir/server`, ...)
- a description of the issue and its impact
- steps or a minimal reproduction

You can expect an acknowledgement within a few days. Once the issue is
confirmed, a fix is prepared and released, and you are credited in the
advisory unless you prefer otherwise.

## What counts

Formatir promises never to transmit what users type. Anything that makes the
SDK send field values, clipboard content or other personal data - or that lets
a crafted batch harm a `formatir/server` deployment - is a security issue.
