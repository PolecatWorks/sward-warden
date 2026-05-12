# Spec 0014-02: Parallelize Hams Preflight and Shutdown Checks

## 1. Description
This specification outlines the performance optimization of the `Checks::preflight` and `Checks::shutdown` methods in `sw-be-container/src/hams.rs`. The checks previously executed HTTP requests to target URLs sequentially, creating an unnecessary cumulative delay, particularly during failure/retry scenarios.

## 2. Acceptance Criteria
1. **Parallel Execution**: Both `preflight` and `shutdown` checks must process all target URLs concurrently.
2. **Independent Budgets**: Each target URL must be allocated its own independent retry budget (`self.fails`), not shared with other targets.
3. **Fail-Fast for Preflight**: If any target URL completely exhausts its retry budget during `preflight`, the method must immediately return an error without waiting for the remaining checks.
4. **Join-All for Shutdown**: The `shutdown` method must await the completion of all target URL checks, regardless of individual success or failure, and only return an aggregated failure status at the end if any targets failed.
5. **No Regressions**: Existing functionality and test assertions must remain valid.

## 3. Implementation Steps
1. Refactor `Checks::preflight` to map target URLs into an array of async futures. Utilize `futures::future::try_join_all` to execute them concurrently and return an error eagerly on the first failure.
2. Refactor `Checks::shutdown` to map target URLs into an array of async futures. Utilize `futures::future::join_all` to execute them concurrently, aggregate the results, and return an error if any of the checks exhausted their retry budget.
3. Update unit and integration tests (or verify manually via performance benchmark assertions) to confirm the reduction in elapsed time corresponding to parallel execution over sequential execution.

## 4. State
Complete
