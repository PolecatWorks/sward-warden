# Rust Rules Engine Proposition

## Overview

The goal is to integrate a business rules engine into the Rust backend (`sw-be-container`) to evaluate evolving business rules (e.g., nitrate compliance). The key requirement is that these rules must be **configurable** rather than hardcoded, allowing them to be added, versioned, and updated over time without requiring application redeployments.

After evaluating the Rust ecosystem, three main candidates stand out:
1. **zen-engine** (Gorules)
2. **datalogic-rs** (JSONLogic)
3. **rust-rule-engine** (Grule Rule Language)

Below is an analysis of each engine and a final recommendation.

---

## Candidates

### 1. Zen Engine (zen-engine)
**Link**: [zen-engine on crates.io](https://crates.io/crates/zen-engine) | [Gorules.io](https://gorules.io/)

Zen Engine is a cross-platform Business Rules Engine (BRE) that executes the JSON Decision Model (JDM). JDM represents business rules, decision tables, and decision graphs in JSON format.

* **Format**: JSON (JDM - JSON Decision Model)
* **Configuration Approach**: Decision Trees / Decision Tables authored in JSON.
* **Pros**:
  * Highly structured, visual approach. Very well suited for business users.
  * Supports complex "Decision Graphs" (chaining multiple rule tables/nodes together).
  * Has a dedicated [React-based visual editor](https://github.com/gorules/jdm-editor) available open-source, which could eventually be integrated into the frontend (`sw-fe-container` or `sw-admin-container`) allowing non-technical users to build and modify rules.
  * Very active development and enterprise-grade backing.
* **Cons**:
  * JDM structure can be verbose to hand-write; relies heavily on using the visual editor to generate the JSON.

### 2. Datalogic (datalogic-rs)
**Link**: [datalogic-rs on crates.io](https://crates.io/crates/datalogic-rs) | [JSONLogic](https://jsonlogic.com/)

A high-performance implementation of [JSONLogic](https://jsonlogic.com/), a standard for writing rules as a JSON tree.

* **Format**: JSON (JSONLogic syntax)
* **Configuration Approach**: AST-like JSON arrays/objects representing operators and operands.
  * Example: `{"and" : [ {"<" : [{"var" : "temp"}, 110]}, {"==" : [{"var" : "pie.filling"}, "apple"]} ] }`
* **Pros**:
  * Simple, standardized, and portable.
  * Easy to store in a PostgreSQL `JSONB` column and update via API.
  * Very fast execution (nanoseconds).
  * Good for simple to medium complexity conditions (e.g., "if nitrate_level > 50 and farm_zone == 'A'").
* **Cons**:
  * "Code disguised as JSON" — as rules get complex, the JSON becomes deeply nested and very hard to read for humans.
  * Lack of standard visual editors for complex multi-step decision workflows.

### 3. Rust Rule Engine (rust-rule-engine)
**Link**: [rust-rule-engine on crates.io](https://crates.io/crates/rust-rule-engine)

A high-performance rule engine based on the RETE algorithm, supporting forward and backward chaining. It uses GRL (Grule Rule Language), which is similar to Java code or expression languages.

* **Format**: GRL (Grule Rule Language - Text/String)
* **Configuration Approach**: Text-based rule definitions.
  * Example: `rule CheckNitrate "Check if nitrate > 50" { when nitrate > 50 then Reject(); }`
* **Pros**:
  * Excellent performance for evaluating many rules simultaneously against a dataset (RETE algorithm).
  * Syntax is readable and resembles normal programming languages (like Java or JS).
  * Supports streaming, time-windows, and advanced stateful matching.
* **Cons**:
  * Relies on string-based GRL syntax. Harder to parse, validate, and manipulate programmatically via an API compared to JSON.
  * Requires learning a custom DSL (Domain Specific Language).
  * Harder to build a robust GUI for rule management compared to JSON-based engines.

---

## Proposition & Recommendation

For the requirements of managing compliance rules (like nitrate levels) that evolve over time and need to be configurable:

**Recommendation: Use `zen-engine` (Gorules)**

### Why `zen-engine`?
1. **JSON Native**: Rules are stored as JSON (JDM), making them trivial to store in PostgreSQL (using `JSONB`), version control, and transmit via the existing Rust backend APIs.
2. **Visual Editor Integration**: The availability of the open-source Gorules JDM Editor is a massive advantage. While you might start by authoring the JSON rules manually or via simple scripts, you can eventually embed the React editor into the frontend (`sw-admin-container`). This allows domain experts (agronomists, compliance officers) to visually build and update nitrate rules using Decision Tables without writing code.
3. **Structured Flow**: Nitrate compliance often involves multi-step logic (e.g., *Check Region -> Check Season -> Calculate Limits -> Assess Farm Data*). Zen Engine's Decision Graphs allow routing data through these discrete steps elegantly, whereas standard JSONLogic or GRL often becomes a tangled mess for multi-step processes.
4. **Rust Native**: It is written in pure Rust, integrating perfectly into `sw-be-container` with high performance.

### Implementation Concept
1. **Database**: Create a `business_rules` table in PostgreSQL with columns `id`, `name`, `version`, `jdm_content` (JSONB), and `is_active`.
2. **Backend**: Provide CRUD APIs to update the `jdm_content`. When a farm's data needs evaluation (e.g., for nitrate runoff), the backend fetches the active rule JSON, instantiates a `DecisionEngine` using `zen-engine`, passes in the farm's context (e.g., slope, applied fertilizers, region), and returns the compliance evaluation result.
3. **Frontend**: Initially, manage these via basic API calls or a raw JSON editor text box. Later, implement the visual Decision Table editor.
