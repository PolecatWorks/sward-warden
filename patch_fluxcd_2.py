with open("fluxcd-dev/sward-warden.yaml", "r") as f:
    content = f.read()

search = """    imagePullSecrets:
      - name: ghcr-docker-auth
    be:
      image:"""

replace = """    imagePullSecrets:
      - name: ghcr-docker-auth
    be:
      initContainer:
        env:
          - name: SP_BE__DEBUGGING__FAIL_DEBUG_DELAY
            value: "60s"
      image:"""

content = content.replace(search, replace)

with open("fluxcd-dev/sward-warden.yaml", "w") as f:
    f.write(content)

print("Fluxcd patched")
