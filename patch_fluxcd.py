with open("fluxcd-dev/sward-warden.yaml", "r") as f:
    content = f.read()

search = """      be:
      imagePullSecrets:"""

replace = """      be:
        initContainer:
          env:
            - name: SP_BE__DEBUGGING__FAIL_DEBUG_DELAY
              value: "60s"
      imagePullSecrets:"""

content = content.replace(search, replace)

with open("fluxcd-dev/sward-warden.yaml", "w") as f:
    f.write(content)

print("Fluxcd patched")
