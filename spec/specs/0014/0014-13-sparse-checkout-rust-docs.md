Created At: 2026-07-14T15:53:00Z
Completed At: 2026-07-14T16:04:30Z
File Path: `file:///Users/bengreene/Development/polecatworks/sward-warden/spec/specs/0014/0014-13-sparse-checkout-rust-docs.md`
Total Lines: 20

# 0014-13 Sparse Checkout Optimization for Rust Docs

**State**: Complete

## Scope
This specification defines the optimization of the GitHub Pages checkout and deployment steps for Rust documentation in `.github/workflows/sw-be-docker-publish.yml`. The objective is to use Git's `sparse-checkout` and shallow fetch features to only pull the `docs/rust` directory from the `gh-pages` branch, avoiding full clones of the historically large branch.

## Requirements
1. **Initialize Repositories Sparsely**:
   - Rather than using `peaceiris/actions-gh-pages` which performs a full fetch/checkout of the `gh-pages` branch, initialize an empty git repository locally for deployment.
   - Configure Git credentials/remote with authentication.
   - Enable `core.sparseCheckout`.
   - Use `git sparse-checkout init --no-cone` and `git sparse-checkout set "docs/rust"` to check out only the target path.
2. **Shallow Fetch**:
   - Fetch the branch with `--depth 1` to minimize fetched pack sizes.
3. **Rust Doc Deployment**:
   - Clean the `docs/rust` subdirectory in the sparse checkout directory.
   - Copy the newly generated cargo documentation from `./sw-be-container/target/doc` to the sparsely checked-out `docs/rust` directory.
4. **Retry Loop and Push Compatibility**:
   - Use a retry loop (up to 5 attempts) to handle push conflicts.
   - Within the loop: commit, push, and run `git pull --rebase origin gh-pages` on failure before retrying.
