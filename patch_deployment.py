with open("charts/sward-warden/templates/be-deployment.yaml", "r") as f:
    content = f.read()

# Init container
search_init = """          command: ["/usr/local/bin/sw-be-container", "--config-path", "/etc/sw-be/config.yaml", "--secrets-dir", "/etc/sw-be/secrets", "migrate"]"""
replace_init = """          command: ["/usr/local/bin/sw-be-container", "--config-path", "/etc/sw-be/config.yaml", "--secrets-dir", "/etc/sw-be/secrets", "migrate"]
          {{- with .Values.be.initContainer.env }}
          env:
            {{- toYaml . | nindent 12 }}
          {{- end }}"""
content = content.replace(search_init, replace_init)

# Main container
search_main = """          command: ["/usr/local/bin/sw-be-container", "--config-path", "/etc/sw-be/config.yaml", "--secrets-dir", "/etc/sw-be/secrets", "serve"]"""
replace_main = """          command: ["/usr/local/bin/sw-be-container", "--config-path", "/etc/sw-be/config.yaml", "--secrets-dir", "/etc/sw-be/secrets", "serve"]
          {{- with .Values.be.env }}
          env:
            {{- toYaml . | nindent 12 }}
          {{- end }}"""
content = content.replace(search_main, replace_main)

with open("charts/sward-warden/templates/be-deployment.yaml", "w") as f:
    f.write(content)

print("Deployment patched")
