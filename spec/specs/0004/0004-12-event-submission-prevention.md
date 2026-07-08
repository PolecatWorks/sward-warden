# Spec 0004-12: Event Form Submission & Double Submit Prevention

## Status
Complete

## Target PRD
PRD 0004

## Overview
This specification details the frontend behavior and automated integration testing requirements for agricultural event logging forms to ensure that event submission prevents double submits and saves exactly one record.

## Requirements

### Frontend Implementation
1. **Forms**: All event forms (Planting, Fertiliser, Spraying, Organic Manure, and General) must use standard `<form>` elements with `(ngSubmit)` handlers to process the submission.
2. **Inputs**: Avoid binding redundant `(keydown.enter)` or `(keyup.enter)` events to inputs inside event logging forms.
3. **Buttons**: Ensure submit buttons are of type `submit`.
4. **Form Action**: Submission must only trigger a single API call, ensuring that exactly one event record is saved.

### Automated Tests (Robot Framework)
Verify that:
- Pressing Enter in an event form field submission triggers form submission exactly once.
- Submitting the form via the save/submit button works correctly and creates exactly one event record.
