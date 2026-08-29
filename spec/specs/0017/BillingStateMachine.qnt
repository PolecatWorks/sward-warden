module BillingStateMachine {
    type State = str
    type Gateway = str

    var gateway: Gateway
    var intent_created: bool
    var state: State
    var payment_successful: bool
    var stripe_tried: bool
    var braintree_tried: bool

    action init = all {
        gateway' = "none",
        intent_created' = false,
        state' = "INITIAL",
        payment_successful' = false,
        stripe_tried' = false,
        braintree_tried' = false,
    }

    action generate_intent = all {
        state == "INITIAL",
        any {
            all {
                not(stripe_tried),
                not(braintree_tried),
                any { gateway' = "stripe", gateway' = "braintree" },
                state' = "INTENT_CREATED",
                intent_created' = true,
                payment_successful' = payment_successful,
                stripe_tried' = stripe_tried,
                braintree_tried' = braintree_tried,
            },
            all {
                stripe_tried,
                not(braintree_tried),
                gateway' = "braintree",
                state' = "INTENT_CREATED",
                intent_created' = true,
                payment_successful' = payment_successful,
                stripe_tried' = stripe_tried,
                braintree_tried' = braintree_tried,
            },
            all {
                not(stripe_tried),
                braintree_tried,
                gateway' = "stripe",
                state' = "INTENT_CREATED",
                intent_created' = true,
                payment_successful' = payment_successful,
                stripe_tried' = stripe_tried,
                braintree_tried' = braintree_tried,
            },
            all {
                stripe_tried,
                braintree_tried,
                gateway' = "none",
                state' = "FAILED",
                intent_created' = intent_created,
                payment_successful' = payment_successful,
                stripe_tried' = stripe_tried,
                braintree_tried' = braintree_tried,
            }
        }
    }

    action process_payment = all {
        state == "INTENT_CREATED",
        any {
            // Success case
            all {
                state' = "SUCCESS",
                payment_successful' = true,
                gateway' = gateway,
                intent_created' = intent_created,
                stripe_tried' = stripe_tried,
                braintree_tried' = braintree_tried,
            },
            // Failure case
            all {
                state' = "INITIAL",
                intent_created' = false,
                payment_successful' = payment_successful,
                gateway' = gateway,
                any {
                    all { gateway == "stripe", stripe_tried' = true, braintree_tried' = braintree_tried },
                    all { gateway == "braintree", braintree_tried' = true, stripe_tried' = stripe_tried }
                }
            }
        }
    }

    action step = any {
        generate_intent,
        process_payment
    }

    val Safety = implies(state == "SUCCESS", payment_successful) and implies(payment_successful, state == "SUCCESS")
}