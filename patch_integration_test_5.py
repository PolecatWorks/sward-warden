import sys

with open(".github/workflows/integration-test.yaml", "r") as f:
    content = f.read()

search = """          if [[ "${{ steps.filter.outputs.frontend }}" == "true" ]]; then
            echo "SW_FE_IMAGE=ghcr.io/${REPO_LOWER}-ui/dev" >> $GITHUB_ENV
            echo "SW_FE_TAG=pr-${PR_NUMBER}" >> $GITHUB_ENV
          else
            echo "SW_FE_IMAGE=ghcr.io/${REPO_LOWER}-ui" >> $GITHUB_ENV
            echo "SW_FE_TAG=main" >> $GITHUB_ENV
          fi"""

replace = """          if [[ "${{ steps.filter.outputs.frontend }}" == "true" ]]; then
            echo "SW_FE_IMAGE=ghcr.io/${REPO_LOWER}-fe/dev" >> $GITHUB_ENV
            echo "SW_FE_TAG=pr-${PR_NUMBER}" >> $GITHUB_ENV
          else
            echo "SW_FE_IMAGE=ghcr.io/${REPO_LOWER}-fe" >> $GITHUB_ENV
            echo "SW_FE_TAG=main" >> $GITHUB_ENV
          fi"""

if search in content:
    content = content.replace(search, replace)
    with open(".github/workflows/integration-test.yaml", "w") as f:
        f.write(content)
    print("Patched integration-test.yaml ui to fe")
else:
    print("integration-test.yaml block not found")
