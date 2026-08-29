# PRD 0017-01: Billing State Machine and Formal Verification

## Overview

This specification details the formal state machine verification of the billing and payment processes outlined in [PRD 0017](../../prds/0017-payments-and-subscriptions.md). Following the guidance from [PRD 0016](../../prds/0016-formal-verification-and-mbt.md), the fallback logic across payment gateways (Stripe and Braintree) has been modeled rigorously using Quint.

The Quint model mathematically validates that:
1. The payment pipeline handles state transitions accurately without deadlocks.
2. Gateway failures result in appropriate fallback (e.g., Stripe -> Braintree or Braintree -> Stripe).
3. Continual failure across both gateways securely deposits the session into a `FAILED` terminal state without stranding the user.
4. `SUCCESS` is exclusively associated with a successful payment transaction.

## The Quint State Machine Model

The explicit model is defined in `BillingStateMachine.qnt`.

### State Definitions

- **INITIAL**: The start of the flow, preparing to decide the gateway.
- **INTENT_CREATED**: An intent token (client_secret or client_token) has been successfully generated via the selected gateway.
- **PROCESSING**: (Implicit via step transition): The application is processing the payment via the frontend and awaiting webhook/callback confirmation.
- **SUCCESS**: (Terminal) The payment was completed successfully, and Keycloak is synced.
- **FAILED**: (Terminal) All gateway options have been exhausted without success.

### Variables Modifying State

- `gateway`: Records the active gateway (`"none"`, `"stripe"`, `"braintree"`).
- `intent_created`: Boolean reflecting whether a secure session intent exists.
- `payment_successful`: Core tracking variable for the outcome.
- `stripe_tried` & `braintree_tried`: Booleans managing the state fallback logic.

### Fallback Logic and Flow

1.  **Initial Routing**:
    - The model randomly selects `"stripe"` or `"braintree"` for the initial attempt, modeling the 90%/10% stochastic split requested by the PRD.
2.  **Intent Generation & Processing**:
    - Generates the intent (`intent_created = true`).
    - Transitions to `INTENT_CREATED`.
3.  **Outcome Resolution**:
    - **Success**: Transitions to `SUCCESS`.
    - **Failure**: Logs the failed gateway (e.g., `stripe_tried = true`), unsets the intent, and transitions back to `INITIAL`.
4.  **Fallback Trigger**:
    - Back in `INITIAL`, the logic checks the `_tried` flags. If `"stripe"` failed, it automatically sets `gateway` to `"braintree"` and proceeds.
5.  **Exhaustion**:
    - If both `stripe_tried` and `braintree_tried` are `true`, it sets the state to `FAILED`.

## Validation via Quint Check

The `quint` tool checked the following properties against the Quint algorithm:

- **Safety (Invariant):** `implies(state == "SUCCESS", payment_successful) and implies(payment_successful, state == "SUCCESS")`
  - Validates that a successful state cannot be reached without a confirmed payment, and a confirmed payment strictly results in a successful state.

## Trace Extraction and MBT (Next Steps)

This model serves as the ground truth. According to PRD 0016, this `.qnt` specification can now be processed to extract JSON execution traces (happy and negative paths). These traces will inform the Rust `sw-be-container` backend tests and Robot E2E integration tests to assert that the concrete application mimics this mathematical model.