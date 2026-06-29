# Specification 0016-07: Empty State Alignment

**State**: Complete

## 1. Overview
This specification details the structural fix to ensure the empty states on list pages (like Fields) are consistently center-aligned and not constrained by the grid layouts used for populated items.

## 2. Requirements Address
*   **REQ-6 (Empty States)**: This update implements the revised requirement that empty states must span the full page width and avoid being wrapped inside item grid layouts.

## 3. Changes
*   **`sw-fe-container/src/app/home/fields/fields.component.html`**:
    *   Applied `*ngIf="fields.length > 0"` to the `.grid` container element holding the field cards.
    *   Extracted the empty state block (`<div *ngIf="fields.length === 0" ...>`) and placed it as a sibling element outside and following the `.grid` container. This allows the empty state to break out of the first grid column and utilize the full available width to center its content correctly, matching the behavior implemented in the farms list.