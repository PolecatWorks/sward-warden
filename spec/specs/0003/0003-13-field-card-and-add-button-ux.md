# Specification: Field Card Layout and Centred Add Button UX

## Status
Complete

## Source PRD
[PRD 0003 - Fields-First UX](../../prds/0003-core-domain-users-farms-fields.md) — REQ-10, REQ-11

## Overview

This specification defines the visual layout of field list cards and the placement of the "Add Field" / "Add Farm" action buttons when lists are populated, ensuring visual consistency with the farm card design.

---

## Requirements

### REQ-10: Field Card Layout

Each field card on the `/fields` and `/farms/:farmId/fields` list pages must use the following layout:

```
┌────────────────────────────────────────────────┐
│                                                │
│    [Image Header - h-40, object-cover]        │ ← field.image_url or default fallback
│    Gradient overlay: from-black/60 to-transparent│
│    Field name (bottom-left, text-white bold)   │
│    Farm name (bottom-left, text-xs opacity-90) │
│                                                │
├────────────────────────────────────────────────┤
│  [Area]       [Hectares label]   [▶ Chevron]  │ ← bottom drawer
└────────────────────────────────────────────────┘
```

- **Default image URL**: A single fallback agricultural landscape image URL is used for all fields if `field.image_url` is not present.
- **Full-card click**: The entire card element navigates to `/fields/:fieldId` using Angular `[routerLink]`.
- **No "View Details" button**: The separate "View Details" button is removed entirely.
- **Edit button**: The pencil/edit button in the bottom drawer must stop click event propagation so the card-level navigation is not triggered.
- **Card classes**: `bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow cursor-pointer`

### REQ-11: Centred Add Button for Populated Lists

When the fields list or farms list is **not empty** (has one or more items):

- A large, centred **"Add Field"** button (fields page) or **"Add Farm"** button (farms page) must appear **below the list** content area.
- The button must be styled similarly to the empty-state add button: `px-8 py-3 rounded-full bg-primary text-on-primary font-semibold`.
- The button must be wrapped in a `flex justify-center` container with appropriate top margin.
- The existing small floating action button (FAB, `w-14 h-14 rounded-full fixed right-6`) is **removed** for the primary add action.
- The map FAB on the fields page is retained.

---

## Acceptance Criteria

- [ ] Field cards have an image header with a fallback default image.
- [ ] Clicking anywhere on the field card navigates to `/fields/:id`.
- [ ] No "View Details" button is visible on field cards.
- [ ] When the fields list is populated, a large centred "Add Field" button appears below the list.
- [ ] When the farms list is populated, a large centred "Add Farm" button appears below the list.
- [ ] No small floating "+" FAB for adding fields or farms when lists are populated.
