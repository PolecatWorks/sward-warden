#!/bin/bash
set -ex

# Use Garden's provided namespace if available, otherwise fallback to the PR pattern
NS="${GARDEN_NAMESPACE:-sward-warden-pr-${PR_NUMBER:-local}}"

echo "Using namespace: $NS"

if [ -n "$PR_NUMBER" ]; then
  DNS_HOST="sw-pr-${PR_NUMBER}.dev.k8s"
else
  DNS_HOST="sw-${USER:-local}.dev.k8s"
fi

EXTERNAL_DNS_URL="http://${DNS_HOST}"
echo "External DNS URL: $EXTERNAL_DNS_URL"

POD_NAME="robot-test-runner"

# Ensure kubectl is in the path
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Wait for the pod to be ready
kubectl wait --for=condition=Ready pod/$POD_NAME -n $NS --timeout=300s

# Install required library synchronously
echo "Installing robotframework-requests..."
kubectl exec $POD_NAME -n $NS -- /bin/bash -c "pip install robotframework-requests"
echo "pip install finished."

# Extract backend pod IP
BE_POD_IP=$(kubectl get pods -l app.kubernetes.io/name=be -n $NS -o jsonpath='{.items[0].status.podIP}')
echo "Backend Pod IP: $BE_POD_IP"

# Create target directory and copy tests
kubectl exec $POD_NAME -n $NS -- rm -rf /tmp/robot-tests /tmp/reports
kubectl exec $POD_NAME -n $NS -- mkdir -p /tmp/robot-tests /tmp/reports
kubectl cp ./tests $POD_NAME:/tmp/robot-tests -n $NS

# Execute tests
TEST_EXIT_CODE=0
kubectl exec $POD_NAME -n $NS -- /bin/bash -c "
  export HOME=/home/pwuser
  cd /tmp
  # Try to find robot in common paths if not in PATH
  export PATH=\$PATH:/home/pwuser/.local/bin:/home/pwuser/.venv/bin

  robot --variable BE_POD_IP:$BE_POD_IP --variable EXTERNAL_DNS_URL:$EXTERNAL_DNS_URL --loglevel DEBUG -d /tmp/reports /tmp/robot-tests
" || TEST_EXIT_CODE=$?

# Pull reports back
echo "Pulling reports back from the robot runner..."
rm -rf ./reports
kubectl cp $NS/$POD_NAME:/tmp/reports ./reports || echo "Failed to copy reports"

exit $TEST_EXIT_CODE
