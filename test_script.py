import re

file_path = "integration-tests/tests/test_sward_movements.robot"
with open(file_path, "r") as f:
    content = f.read()

content = re.sub(r'Click\s+button\[type="submit"\]\s+force=\$\{True\}', r'Click    button[type="submit"]', content)

with open(file_path, "w") as f:
    f.write(content)
