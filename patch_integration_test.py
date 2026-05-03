import sys

with open(".github/workflows/integration-test.yaml", "r") as f:
    content = f.read()

search = """permissions:
  contents: read
  packages: read
  id-token: write"""

replace = """permissions:
  contents: read
  pull-requests: read
  packages: read
  id-token: write"""

if search in content:
    content = content.replace(search, replace)
    with open(".github/workflows/integration-test.yaml", "w") as f:
        f.write(content)
    print("Patched permissions in integration-test.yaml")
else:
    print("Permissions block not found")
