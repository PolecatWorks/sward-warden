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