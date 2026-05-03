import sys

with open("garden.yml", "r") as f:
    content = f.read()

search = """variables:
  fe_image: ${local.env.SW_FE_IMAGE || "ghcr.io/polecatworks/sward-warden-ui"}
  fe_tag: ${local.env.SW_FE_TAG || "main"}
  be_image: ${local.env.SW_BE_IMAGE || "ghcr.io/polecatworks/sward-warden-be"}
  be_tag: ${local.env.SW_BE_TAG || "main"}"""

replace = """variables:
  fe_image: ${local.env.SW_FE_IMAGE || "ghcr.io/polecatworks/sward-warden-fe"}
  fe_tag: ${local.env.SW_FE_TAG || "main"}
  be_image: ${local.env.SW_BE_IMAGE || "ghcr.io/polecatworks/sward-warden-be"}
  be_tag: ${local.env.SW_BE_TAG || "main"}"""

if search in content:
    content = content.replace(search, replace)
    with open("garden.yml", "w") as f:
        f.write(content)
    print("Patched garden.yml ui to fe")
else:
    print("garden.yml block not found")
