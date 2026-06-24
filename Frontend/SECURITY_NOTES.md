# TrueEd — Security Notes

## npm Audit Results
**Last audited:** June 2026  
**Result:** ✅ 0 vulnerabilities found

No HIGH or CRITICAL vulnerabilities detected. All packages are clean.

## Outdated Packages (as of June 2026)
The following packages have newer major versions available but are NOT updated to avoid breaking changes:

| Package | Current | Latest | Reason for Not Updating |
|---------|---------|--------|------------------------|
| react | 18.3.1 | 19.x | React 19 has breaking API changes. Wait for ecosystem compatibility. |
| react-dom | 18.3.1 | 19.x | Must match react version. |
| react-router-dom | 6.30.4 | 7.x | v7 has breaking route API changes. Requires migration effort. |
| tailwindcss | 3.4.19 | 4.x | Tailwind v4 has completely new config system. Major refactor needed. |
| vite | 6.4.3 | 8.x | Vite 8 has breaking plugin API changes. |
| @vitejs/plugin-react | 4.7.0 | 6.x | Must match vite version compatibility. |

**Recommended action:** Keep current versions stable. Schedule major version upgrades as a separate task with proper testing.

## Frontend Security Measures Implemented
1. **Input Validation** — All form fields have character-type restrictions, length limits, and inline error messages
2. **XSS Prevention** — HTML/script tag stripping on all search inputs, no `dangerouslySetInnerHTML` usage
3. **Error Monitoring** — Sentry initialized with ErrorBoundary for unhandled exceptions
4. **Environment Variables** — All sensitive config values moved to `.env` (excluded from git)
5. **Cookie Consent** — GDPR-compliant banner with granular preference management
6. **Analytics** — Microsoft Clarity placeholder ready for production
