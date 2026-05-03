import sys

with open(".github/workflows/integration-test.yaml", "r") as f:
    content = f.read()

search = """      - name: Install GitHub CLI
        run: |
          GH_VERSION=$(curl -s https://api.github.com/repos/cli/cli/releases/latest | jq -r .tag_name | sed 's/v//')
          curl -sSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.tar.gz" -o gh.tar.gz
          tar xzf gh.tar.gz
          # Move it to a folder in your PATH (like /usr/local/bin) or just add it to GITHUB_PATH
          sudo mv gh_${GH_VERSION}_linux_amd64/bin/gh /usr/local/bin/
          gh --version"""

replace = """      - name: Install GitHub CLI
        run: |
          GH_VERSION=$(curl -s https://api.github.com/repos/cli/cli/releases/latest | jq -r .tag_name | sed 's/v//')
          curl -sSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.tar.gz" -o gh.tar.gz
          tar xzf gh.tar.gz
          # Add it to GITHUB_PATH so subsequent steps can use it
          echo "$(pwd)/gh_${GH_VERSION}_linux_amd64/bin" >> $GITHUB_PATH
          # Also move to /usr/local/bin for good measure
          sudo mv gh_${GH_VERSION}_linux_amd64/bin/gh /usr/local/bin/ || true
          gh --version"""

if search in content:
    content = content.replace(search, replace)
    with open(".github/workflows/integration-test.yaml", "w") as f:
        f.write(content)
    print("Patched GH CLI in integration-test.yaml")
else:
    print("GH CLI block not found")
