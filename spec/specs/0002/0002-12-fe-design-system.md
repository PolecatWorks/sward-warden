# Specification 0002-12: Front-End Design System and UI Shell

**State**: Complete

## 1. Overview
This specification details the UI/UX design system rules, layout guidelines, and structural navigation shell for the Sward Warden Front-End application. All front-end components must adhere to these standards to maintain visual consistency, responsiveness, and a premium aesthetic.

## 2. Design Tokens and Typography
- **Design System Identity**: "FieldMetric".
- **Typography**:
  - Primary Font: **Work Sans** (imported from Google Fonts).
  - Browser fallback: Sans-Serif.
  - Weight definitions: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold).
- **Iconography**:
  - Library: **Material Symbols Outlined** (imported from Google Fonts Icons).
- **Curated HSL Color Palette**:
  - Primary/Brand: `hsl(116, 54%, 17%)` (Hex `#154212`)
  - Primary Hover: `hsl(116, 54%, 22%)`
  - Background: `hsl(48, 20%, 98%)` (Hex `#faf9f5` - warm white)
  - Surface: `hsl(0, 0%, 100%)` (Hex `#ffffff`)
  - Border: `hsl(48, 10%, 90%)`
  - Text Primary: `hsl(116, 10%, 10%)`
  - Text Secondary: `hsl(116, 10%, 40%)`
  - Accent/Alert: `hsl(38, 92%, 50%)` (Amber)
  - Danger/Breach: `hsl(0, 75%, 45%)` (Soft red)

## 3. Core Layout and Components
- **Card-Based Components**:
  - All dashboard widgets, forms, and list items must be enclosed in card containers.
  - Corner rounding: **xl** (12px) or **2xl** (16px) border-radius.
- **Bento Grid Dashboard**:
  - The main dashboard uses a CSS Grid layout with varying column/row spans (Bento Grid layout) to organize information (e.g., weather widget, inventory status, active alerts, quick actions).
- **Timeline View (Activity Logs)**:
  - Event logs must use a high-contrast vertical timeline layout.
  - Nodes on the timeline represent event types (Planting, Spraying, spreading events) with distinct status colors.

## 4. UI Shell and Navigation
- **Unified Navigation Shell (`MainLayoutComponent`)**:
  - Structure must prevent page reflow and layout jitter during routing.
  - Top: `TopAppBar` displaying application branding, active farm context selector, and user profile avatar.
  - Bottom (Mobile) / Side (Desktop): Navigation container containing links to Dashboard, Records, Maps, and Settings.
  - Content: Center `<router-outlet>` wrapper.
- **Glassmorphic Bottom Navigation**:
  - Mobile bottom navigation bar uses a translucent glass effect:
    - CSS: `background: hsla(0, 0%, 100%, 0.7);`
    - Blur: `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
- **Micro-Animations**:
  - All interactive elements (buttons, navigation links, toggle cards) must incorporate micro-animations.
  - Active/Press State: Scale down slightly (`transform: scale(0.97)` or Tailwind `active:scale-95`) with smooth transitions (`transition: transform 0.15s ease-in-out`).

## 5. Outdoor Visibility Mode
- **High-Contrast Styling**:
  - Add support for an high-contrast mode tailored for outdoor, direct-sunlight usage.
  - Increase text-to-background contrast ratios using deeper blacks and vibrant warning colors.
