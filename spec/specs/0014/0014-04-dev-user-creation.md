# Technical Specification: Dev User Creation & Login Error Handling

**State**: Complete

## 1. Overview
This specification details the frontend changes required to support creating new users directly from the development login view and handling server-side connection errors gracefully.

## 2. Changes

### 2.1. `sw-fe-container/src/app/login/login.component.ts`
- Import `ReactiveFormsModule`, `FormBuilder`, `FormGroup`, and `Validators`.
- Implement `createUserForm` with fields:
  - `name`: string (required)
  - `email`: string (required, email format)
  - `role`: string (required, defaults to `'user'`)
  - `phone`: string (optional)
  - `description`: string (optional)
- Implement `users$` refresh mechanism using a `BehaviorSubject` reload trigger.
- Implement error message capturing on fetch failure.
- Implement `onSubmitUser()` method:
  - Check validation.
  - Submit using `FarmManagementService.addUser()`.
  - On success, reload users, reset form, and toggle form visibility.
  - On error, capture the error message to display in the UI.

### 2.2. `sw-fe-container/src/app/login/login.component.html`
- Show a dismissible error/warning alert block if `errorMsg` is set.
- Show an empty list message when `users.length === 0` and there is no error.
- Implement a toggle button for "Create New User".
- Implement the inline creation form styled with Tailwind CSS matching the primary theme, featuring input validations and disable state during submission.

### 2.3. `sw-fe-container/src/app/login/login.component.spec.ts`
- Implement unit tests covering:
  - Component initialization.
  - Correct rendering of loading state, empty list state, and loaded users list.
  - Rendering of error state when user fetch fails.
  - Form validation for required fields.
  - Successful user creation and list refresh.
  - Error state handling during user creation failure.

## 3. Testing
- Run all frontend unit tests using `make sw-fe-test`.
