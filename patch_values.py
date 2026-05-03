with open("charts/sward-warden/values.yaml", "r") as f:
    content = f.read()

search = """be:
  replicaCount: 1"""

replace = """be:
  replicaCount: 1
  env: []
  initContainer:
    env: []"""

content = content.replace(search, replace)

with open("charts/sward-warden/values.yaml", "w") as f:
    f.write(content)

print("Values patched")
