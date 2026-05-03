import sys

with open(".github/workflows/integration-test.yaml", "r") as f:
    content = f.read()

search = """          version: 'latest'

      - name: Login to GitHub Container Registry"""

replace = """          version: 'latest'

      - name: Configure Helm Token
        run: echo "GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}" >> $GITHUB_ENV

      - name: Login to GitHub Container Registry"""

if search in content:
    content = content.replace(search, replace)
    with open(".github/workflows/integration-test.yaml", "w") as f:
        f.write(content)
    print("Patched Helm Token in integration-test.yaml")
else:
    print("Helm Token block not found")
