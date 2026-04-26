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
- If you have a new requirement update the prd files.
- Do not update prd files and spec files in the same pr.
- Do not update spec file content and code in the same PR. However, it is expected that the status of the spec file (e.g. changing from "Open" to "Complete") is modified at the same time as code is modified, to allow code and spec files to remain in sync.
- Only implement 1 spec file at a time in a PR.
- Prd files should be numbered. Spec files should be numbers deriving from the prd it is from.
- Spec files should be sorted into subdirectories based on their PRD number.
- The specs readme (`spec/specs/readme.md`) should show a summary of the specs as a table, noting their state.

- **NOTE**: PRD files can mutate over time. Spec files are immutable, however when a spec file has updates and it is not complete (ie still in open state) then it can be modified and does not need to be superceeded. Spec files can be in the following states: Open / Complete / Deprecated / Superceeded.
