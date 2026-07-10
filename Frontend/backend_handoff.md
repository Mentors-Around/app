# Frontend to Backend Handoff Summary

This document summarizes the frontend architecture, refactoring, and state management patterns implemented in the TrueEd platform. This serves as a guide for the backend team to understand the current frontend state and where API integrations are required.

## 1. Architectural Refactors

### Profile Pages (`StudentProfile.jsx`, `TeacherProfile.jsx`)
- **Simplified Layout**: Profile pages have been strictly limited to public-facing and learning-specific information. 
- **Inline Editing**: Profile editing is now handled *inline* without modal popups. Users can click "Edit Profile" to modify their Name, City, Class, Goals, Subjects, etc., and save directly on the page.
- **Account Data Removed**: Sensitive account data (Email, Phone, Status) has been entirely removed from the Profile pages to prevent redundancy.

### Settings Pages (`StudentSettings.jsx`, `TeacherSettings.jsx`)
- **Sidebar Layout**: Settings have been refactored into a scalable two-column layout with a left sidebar navigation menu (Notifications, Security, Account, Privacy, Sessions, Help & Support, etc.).
- **Centralized Account Details**: The `Account Details` (Email, Phone, Status, Member Since) now live exclusively under the **Settings → Account** tab.

## 2. Security & Verification Flows

### OTP Verification (`OTPModal.jsx`)
- **Sensitive Field Updates**: Changing an Email or Phone Number requires a 2-step OTP verification. 
- **Current Flow**: The user clicks "Change Email" in Settings, which opens the `OTPModal`. Currently, this uses mock validation.
- **Backend Requirement**: The backend team will need to connect the `OTPModal` to actual `Send OTP` and `Verify OTP` endpoints.

## 3. Data & State Management (Action Required)

### `localStorage` Replacements
To allow for rapid prototyping, the frontend currently relies heavily on `localStorage` to mock persistent state. The backend team will need to replace these calls with proper API requests:
- **Wallet Balances**: (e.g., `trueed_student_wallet`) Used to track user funds.
- **Reviews**: (e.g., `trueed_reviews`) Pre-seeded mock reviews.
- **Profile Photos**: (e.g., `trueed_student_photo_...`) Currently stored as base64 strings in local storage. Needs to be migrated to an S3/Cloud storage solution with image URLs.

## 4. Known Logic Bugs & Pending Flows

### Query Token Purchase Flow
- **Current State**: There is a known logic flaw in the Query Token purchase flow. Clicking a token package (e.g., 5 Tokens - ₹19) instantly executes the purchase and deducts the mock wallet balance.
- **Intended State**: The flow *must* intercept the click, check the wallet balance, and display a confirmation modal. The purchase should only execute when the user explicitly clicks "Pay from Wallet" inside the modal. The backend should strictly enforce this 2-step validation.

## 5. Build System Constraints
- The project is configured with Vite and utilizes `vite-plugin-singlefile`. 
- Ensure that any new dependencies or backend SDK integrations do not break the single-file build constraint if it is still a requirement for deployment.
