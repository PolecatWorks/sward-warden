# Specification 0017-06: Dev User Deletion

**State**: Complete

## 1. Overview
This specification details the design and implementation of deleting a development user account directly from the fake login screen.

## 2. Requirements

- **Backend User Deletion API**:
  - Expose a `DELETE /v0/users/{id}` endpoint.
  - The endpoint must delete the user from the database. This will trigger cascade deletion of their farms, fields, and records due to foreign key constraints.
  - The endpoint must clear the cached farms for the deleted user.
  - Deletion must be forbidden in production environments (returning `403 Forbidden`). It is only allowed in `"development"` or `"testing"` environments.

- **Frontend User Deletion UX**:
  - Render a trashcan button on each user card in the dev login screen.
  - Clicking this button must stop event propagation to prevent triggering user login.
  - Clicking the button must open a confirmation dialog (e.g., standard browser `confirm`) stating: "Are you sure you want to delete the user \"{user.name}\"? This will delete all of their farms, fields, and records."
  - If confirmed, send a DELETE request to `/v0/users/{id}` and refresh the user list on success.
