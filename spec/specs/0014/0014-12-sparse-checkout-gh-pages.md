# 0014-12 Sparse Checkout Optimization for GitHub Pages

**State**: Complete

## Scope
This specification defines the optimization of the GitHub Pages checkout and deployment steps in `.github/workflows/integration-test.yaml`. The objective is to use Git's `sparse-checkout` and shallow fetch features to only pull the files required for the current PR report or main branch run, avoiding full clones of the historically large `gh-pages` branch.

## Requirements
1. **Initialize Repositories Sparsely**:
   - Rather than using `git clone` for the full `gh-pages` branch, initialize an empty repository and set the origin.
   - Enable `core.sparseCheckout`.
   - Use `git sparse-checkout init --no-cone` and `git sparse-checkout set "$TARGET_DIR" "pr/*/.timestamp"` to check out only the target path (e.g., `pr/123` or `main`) and the timestamps of other PRs for pruning. Non-cone mode is required to support wildcard patterns.
2. **Shallow Fetch**:
   - Fetch the branch with `--depth 1` to minimize fetched pack sizes.
3. **Report Pruning**:
   - Retain the pruning logic to remove PR folders older than 7 days, which is made possible by checking out the `.timestamp` files under `pr/*/`.
4. **Retry Loop and Push Compatibility**:
   - The retry loop, pull with rebase, and commit/push flow must remain intact and work within the sparsely checked out repository.
