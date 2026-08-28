# PRD 0017: Payments and Subscriptions

## Overview
This document outlines the requirements and design choices for integrating a payment system into the application. The goal is to allow users on the minimal (free) tier to purchase upgrades (modules) that grant access to specific features for a set duration (e.g., 3 months, 1 year). To ensure reliability and fallback capability, the system will support at least two credit card payment gateway providers.

## 1. Objectives
- Enable users to purchase time-bound module upgrades using credit cards.
- Support multiple payment gateways (Primary and Fallback) to provide redundancy in the event of an outage.
- Restrict module access based on expiration dates.
- Keep payment processing secure and PCI compliant.

## 2. Payment Gateway Research & Selection
To meet the requirement of having two payment providers for fallback, the following top providers have been evaluated based on their developer experience, subscription capabilities, and broad credit card support:

### Stripe (Proposed Primary Gateway)
- **Pros:** Excellent developer experience, robust API, extensive documentation, built-in subscription and one-time payment logic. Stripe Elements provide highly customizable and PCI-compliant frontend UI components.
- **Cons:** While highly modular, setting up the entire billing stack can sometimes be complex if only simple one-off charges are needed.

### Braintree by PayPal (Proposed Secondary/Fallback Gateway)
- **Pros:** Strong support for credit cards, digital wallets, and native PayPal/Venmo integration. Offers a Drop-in UI which is easy to integrate. Proven reliability as a backup option.
- **Cons:** Developer tooling is slightly less modular compared to Stripe; however, it serves excellently as a flexible gateway.

### Recommendation
Use **Stripe** as the primary payment processor for its superior developer tools and subscription management, and implement **Braintree** as a fallback to ensure transactions can still be processed if Stripe experiences an outage.

## 3. Flows and Architecture

### Primary Payment Flow (Stripe)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Stripe
    participant Keycloak

    User->>Frontend: Select module & click upgrade
    Frontend->>Backend: POST /v0/payments/intent
    Backend->>Stripe: Create PaymentIntent
    Stripe-->>Backend: client_secret
    Backend-->>Frontend: return client_secret
    Frontend->>Stripe: Confirm Card Payment (Elements)
    Stripe-->>Frontend: Payment Success
    Stripe->>Backend: Webhook: payment_intent.succeeded
    Backend->>Backend: Update Local DB
    Backend->>Keycloak: Update user modules claim
    Backend-->>Stripe: 200 OK (Webhook Ack)
    Frontend->>Frontend: Reload UI / Token
    Frontend-->>User: Show Success & Unlocked Module
```

### Fallback Payment Flow (Braintree)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Braintree
    participant Keycloak

    User->>Frontend: Select module & click upgrade
    Frontend->>Frontend: Stripe Initialization Failed
    Frontend->>Backend: POST /v0/payments/intent (gateway=braintree)
    Backend->>Braintree: Generate Client Token
    Braintree-->>Backend: client_token
    Backend-->>Frontend: return client_token
    Frontend->>Braintree: Initialize Drop-in UI
    User->>Frontend: Submit Payment info
    Frontend->>Braintree: Request payment_method_nonce
    Braintree-->>Frontend: payment_method_nonce
    Frontend->>Backend: POST /v0/payments/checkout (nonce)
    Backend->>Braintree: Transaction.Sale(nonce)
    Braintree-->>Backend: Success Status
    Backend->>Backend: Update Local DB
    Backend->>Keycloak: Update user modules claim
    Backend-->>Frontend: Success Response
    Frontend->>Frontend: Reload UI / Token
    Frontend-->>User: Show Success & Unlocked Module
```

## 4. Design Choices to Resolve
Before implementing the code, the following design decisions must be finalized:

- **Purchase Model: Auto-Renewal vs. One-Off Time-Bound Purchases**
  - *Option A:* Subscriptions that automatically renew at the end of the term (e.g., 3 months, 1 year) requiring vaulting of payment methods.
  - *Option B:* One-off purchases that grant access for a fixed duration, requiring the user to manually repurchase when the term expires. (Simpler initial implementation, avoids complex cancellation flows).
- **Payment Abstraction Layer vs. Direct Integration**
  - *Option A:* Build a custom generic payment interface in the backend that abstractly routes requests to either Stripe or Braintree.
  - *Option B:* Direct, separate integrations in the frontend where the user manually selects the fallback option, or the application automatically switches the UI component if the primary gateway's API fails to initialize.
- **Handling Module Expiration**
  - *Option A:* A background cron job in the backend that daily checks for expired modules and removes the module claims from the database and Keycloak.
  - *Option B:* Real-time evaluation of module expiration dates during authentication and API access checks.

## 5. Backend Requirements
- **Data Models:**
  - Update user/tenant records or create a new `subscriptions` table to track purchased modules, transaction IDs, payment provider used, and expiration dates.
- **API Endpoints:**
  - `POST /v0/payments/intent`: Initialize a payment intent/session, dynamically selecting the active gateway (Stripe or Braintree) based on current system health or configuration.
  - `GET /v0/payments/history`: Retrieve the user's past purchases and current active modules.
- **Webhooks:**
  - Endpoints to receive asynchronous payment success/failure notifications from Stripe and Braintree.
  - Logic to securely verify webhook signatures before processing.
- **Keycloak Synchronization:**
  - Upon successful payment confirmation via webhook, update the local database.
  - Sync the newly acquired module and its expiration date to Keycloak (extending the logic defined in PRD 0013) so that the JWT claims reflect the purchased access.
- **Expiration Management:**
  - Mechanism (e.g., background job) to revoke module access in the database and Keycloak once the purchase duration expires.

## 6. Frontend Requirements
- **Upgrade UI:**
  - A module store or upgrade page where users can view available modules, pricing, and duration options (e.g., 3 months, 1 year).
- **Secure Checkout Components:**
  - Integration of **Stripe Elements** for the primary checkout flow to ensure PCI compliance (sensitive card data is sent directly to Stripe, not our servers).
  - Integration of **Braintree Drop-in UI** as the fallback mechanism.
- **Fallback Logic:**
  - Frontend error handling to detect if the Stripe SDK fails to load or initialize, automatically falling back to rendering the Braintree component.
- **Subscription Status View:**
  - A section in the user profile or settings page displaying active modules, their expiration dates, and a history of previous transactions.
- **Module Access Gating:**
  - Ensure UI navigation, sidebars, and components appropriately lock or unlock features based on the presence of the purchased module in the user's JWT claims.
