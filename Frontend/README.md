# Knotify Frontend

A peer-to-peer neckwear marketplace built exclusively for Covenant University students to reserve, buy, and sell chapel and class-compliant ties with direct residence hall pickup.

---

## 🚀 Session Changelog & UI Fixes

In this development session, major UI/UX refinements, aesthetic polish, and workflow modernizations were completed across the platform:

### 1. Hero & Visual Redesign
- **Smooth Image Transitions:** Enhanced the lookbook hero model carousel with smooth, seamless fade transitions across all devices.
- **Minimalist Controls:** Removed redundant manual carousel controller overlays for an uncluttered aesthetic.
- **Copy Modernization:** Updated copy to reflect 100% CU approval for both class and chapel wear (*"Walk around with confidence, in class and chapel"*).
- **Logo Presentation:** Replaced heavy decorative graphics in modals and sidebars with the clean vector Knotify logo.

### 2. Product Detail Experience
- **Simplified Modal:** Streamlined product details modal, removing the obsolete multi-step pickup process tabs and FAQs in favor of clear material details and pricing.
- **Direct Reservation:** Streamlined the purchase action into a direct, focused reservation button with responsive quantity controls.

### 3. Streamlined Checkout & Payment Flow
- **Minimalist Layout:** Eliminated harsh grey block backgrounds across checkout sections in favor of clean, bordered cream-card aesthetics.
- **Dedicated Step Flow:** Polished the bag review and delivery details steps with direct hall selection and room numbering.
- **Pre-Payment Confirmation Modal:** Added a clear order confirmation modal prior to dispatching to the Flutterwave payment gateway (*"Pay"*, not *"Pay to Flutterwave"*).
- **Animated Receipt Printing:** Built an authentic receipt printer roll-out animation upon successful order confirmation, complete with:
  - Download / Print receipt action
  - Native Web Share / Clipboard copy functionality
  - Order reference tracking with quick-copy actions
- **Cleaned Test Features:** Completely removed the sample account quick-fill and payment simulation shortcuts for production readiness.

### 4. Authentication & Post-Signup Onboarding
- **Universal Email Authentication:** Changed login and signup fields from strict "student email" to universal "Email" allowing flexible account management.
- **Post-Signup Onboarding Flow:** Introduced an automatic onboarding step immediately following registration to capture the student's residence hall, room number, and WhatsApp contact for smooth order fulfillment.

### 5. Profile & Dashboard Refinements
- **Privacy & Clean Data Display:** Removed hardcoded fallback values—user profile pills (residence hall, room, phone, WhatsApp) only render if provided by the user.
- **Badge Cleanup:** Removed unnecessary "Verified Student" tags, maintaining focused badges solely for approved tie merchants.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 (Vite + TypeScript) |
| **Styling** | Tailwind CSS |
| **Smooth Scrolling** | Lenis |
| **Motion & Animations** | Framer Motion & GSAP |
| **Icons** | Lucide React |
| **Payments** | Flutterwave Standard Gateway |

---

## 💻 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production
npm run build
```
