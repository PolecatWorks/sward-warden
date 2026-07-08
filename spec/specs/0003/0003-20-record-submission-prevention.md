# Spec 0003-20: Core Form Submission & Double Submit Prevention

## Status
Complete

## Target PRD
PRD 0003

## Overview
This specification details the frontend behavior and automated integration testing requirements for ensuring that user profile, farm management, and field management forms handle submissions without causing duplicate records.

## Requirements

### Frontend Implementation
1. **Forms**: Use standard `<form>` elements with `(ngSubmit)` handlers to manage submissions.
2. **Inputs**: Input fields must not contain redundant `(keydown.enter)` or `(keyup.enter)` event handlers. Instead, the native browser form submission behavior triggered by the `Enter` key must be delegated entirely to the `ngSubmit` handler.
3. **Buttons**: Submit buttons must be styled and typed as `type="submit"`. They should be disabled while the form is invalid.
4. **Form Action**: Submission must only result in a single REST API call to create or update the resource, and precisely one record should be created/updated.

### Automated Tests (Robot Framework)
Integration tests must separately and independently test:
1. Submitting the form by clicking the **Save** button.
2. Submitting the form by pressing the **Enter** key while focused on an input element.
3. In each test case, the test must fetch the list of records from the backend API to verify that:
   - Exactly one new record is created.
   - No duplicates are produced.
