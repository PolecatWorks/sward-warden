# Spec: Test Submission Methods for Inventory and Storage

## 1. Description
This specification outlines the testing requirements for inventory and storage entity forms to ensure that submitting a form via the "Save" button and submitting via the "Enter" key both result in the creation or modification of a **single** record.

## 2. Testing Requirements

### 2.1 Storage Capacity E2E Journey (`test_storage_capacity.robot`)
- The UI integration test must include storage facility creation flows.
- **Scenario A (Button Submit):** Open the add storage form, fill in the details, and click the "Save" button. Verify that exactly one storage record is created in the backend database.
- **Scenario B (Enter Key Submit):** Open the add storage form, fill in the details, and press the Enter key while focused on an input field. Verify that exactly one storage record is created in the backend database.
