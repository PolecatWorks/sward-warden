import sys

with open(".github/workflows/integration-test.yaml", "r") as f:
    content = f.read()

search = """      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: 'latest'"""

replace = """      - name: Set up Helm
        uses: azure/setup-helm@v3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          version: 'latest'"""

if search in content:
    content = content.replace(search, replace)
    with open(".github/workflows/integration-test.yaml", "w") as f:
        f.write(content)
    print("Patched setup-helm in integration-test.yaml")
else:
    print("setup-helm block not found")
