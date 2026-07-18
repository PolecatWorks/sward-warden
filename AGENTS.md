# Development Workflow and Patterns

This file describes the workflow and development patterns for our agents to follow. Any new guidance regarding project methodology should be captured here or in the PRD files.

## Workflow

1. **PRD Creation**:
   - Product Requirements Documents are added to `spec/prds/`.
   - Before proceeding, new PRD files must be carefully analyzed to ensure there are no contradictions or ambiguities.

2. **Specification Breakdown**:
   - Once a PRD is verified, break it down into detailed specifications.
   - Store these spec files in `spec/specs/` as markdown files.

3. **Development phase**:
   - **Important**: Only when we have good specs can we begin actual development.
   - Development strictly follows a Test-Driven Development (TDD) pattern.

## Guidelines for Agents
- Read and understand the PRDs and specs thoroughly before writing code.
- Analyze PRDs for ambiguities and contradictions; raise issues or resolve them if found.
- As you pick up new guidance on workflow or best practices, capture it in this `agents.md` file or within the PRD files appropriately.
- If you have a new requirement or are defining what the application does based on user requests, you must update the PRD files to reflect the user requirement.
- Do not update prd files and spec files in the same pr.
- Do not update spec file content and code in the same PR. However, it is expected that the status of the spec file (e.g. changing from "Open" to "Complete") is modified at the same time as code is modified, to allow code and spec files to remain in sync.
- Only implement 1 spec file at a time in a PR.
- Prd files should be numbered. Spec files should be numbers deriving from the prd it is from.
- Spec files must be sorted into subdirectories based on their PRD number (e.g., `spec/specs/0001/`).
- The specs readme (`spec/specs/readme.md`) must show a summary of all specs as a table with columns for the Specification (link) and Status (state).
- **Testing before Push**: Before pushing changes to the repository, you MUST run the integration tests using `make robot-test` and confirm that all tests are passing successfully.
- **Integration Test Best Practices**: Do NOT use Angular-specific debugging utilities such as `ng.getComponent` or `ng.applyChanges` within integration tests (e.g. Robot / Playwright scripts). These APIs are stripped and disabled in production builds (such as CI), leading to runtime `ReferenceError: ng is not defined` failures. Always interact with components via standard user input simulations (clicks, keystrokes, form fields).

- **NOTE**: PRD files can mutate over time. Spec files are immutable, however when a spec file has updates and it is not complete (ie still in open state) then it can be modified and does not need to be superceeded. Spec files can be in the following states: Open / Complete / Deprecated / Superceeded.

## Integration with Agent Planning Mode

When working with agentic assistants (like Antigravity) that use an automated planning/execution mode, align the project specifications with the agent's native planning files as follows:

1. **Mapping Project Specs to Agent Plans**:
   - **Project Specification (`spec/specs/`)**: This is the permanent, version-controlled source of truth in the repository describing *what* needs to be built and *how* it should function.
   - **Agent Implementation Plan (`implementation_plan.md`)**: When the agent enters Planning Mode, it creates this file in its workspace session. It serves as the chat-specific execution roadmap, detailing the exact file edits, commands, and verification steps the agent will perform *during this specific session* to implement the active project specification.
   - **Agent Task List (`task.md`)**: The agent's session TODO list, used to track mechanical progress during development.
   - **Agent Walkthrough (`walkthrough.md`)**: The final summary of changes, test outputs, and verification results for the current session.

2. **Sequential Workflow for Agents**:
   - **Step 1: Reference / Create Specs**: Read the PRD (`spec/prds/`) and retrieve or create/modify the Specification (`spec/specs/`) for the feature.
   - **Step 2: Generate Agent Plan**: Initialize the agent's Planning Mode. The `implementation_plan.md` must clearly trace its proposed changes back to the active Project Specification.
   - **Step 3: User Approval**: Present the agent plan to the user for explicit approval before running code-modifying commands.
   - **Step 4: Execute & Verify**: Implement the specifications using TDD, tracking progress in `task.md`.
   - **Step 5: Document Results**: Complete the task by updating the status of the Spec file in both the file header and `spec/specs/readme.md` (e.g., from "Open" or "In Progress" to "Complete"), then detail the verification in `walkthrough.md`.

## Development Environment

When running locally, the following default services are available and auto-recompile on changes:
- **Frontend URL**: `http://localhost:4200`
- **Backend API URL**: `http://localhost:8080`

When building Docker images, always use the specific container targets:
- **Frontend Docker Image**: `make sw-fe-docker`
- **Backend Docker Image**: `make sw-be-docker`
