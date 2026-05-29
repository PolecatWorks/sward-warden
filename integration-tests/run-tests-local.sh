#!/bin/bash
set -e

# Local test runner for robot tests against local dev services.
# Expects:
#   - Backend running on localhost:8080 (make sw-be-dev)
#   - Frontend running on localhost:4200 (make sw-fe-dev)
#   - Database running (make compose-db)
#
# Usage:
#   ./run-tests-local.sh                     # Run all tests
#   ./run-tests-local.sh tests/test_be.robot # Run specific test file
#   ./run-tests-local.sh test_hold/          # Run test_hold directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Local service URLs (overridable via environment)
LOCAL_BE_URL="${LOCAL_BE_URL:-http://localhost:8080}"
LOCAL_FE_URL="${LOCAL_FE_URL:-http://localhost:4200}"

# Report output directory
REPORT_DIR="${SCRIPT_DIR}/reports"
rm -rf "${REPORT_DIR}"
mkdir -p "${REPORT_DIR}"

# Default test path (can be overridden via first argument)
TEST_PATH="${1:-${SCRIPT_DIR}/tests}"

# Resolve relative paths
if [[ ! "${TEST_PATH}" = /* ]]; then
    TEST_PATH="${SCRIPT_DIR}/${TEST_PATH}"
fi

echo "=============================================="
echo " Robot Tests - Local Dev Runner"
echo "=============================================="
echo "Backend URL:  ${LOCAL_BE_URL}"
echo "Frontend URL: ${LOCAL_FE_URL}"
echo "Test Path:    ${TEST_PATH}"
echo "Report Dir:   ${REPORT_DIR}"
echo "=============================================="

# Pre-flight checks
echo ""
echo "Running pre-flight checks..."

if curl -sf "${LOCAL_BE_URL}/v0/hello" > /dev/null 2>&1; then
    echo "  ✓ Backend is responding at ${LOCAL_BE_URL}"
else
    echo "  ✗ Backend is NOT responding at ${LOCAL_BE_URL}"
    echo "    Start it with: make sw-be-dev"
    exit 1
fi

if curl -sf "${LOCAL_FE_URL}" > /dev/null 2>&1; then
    echo "  ✓ Frontend is responding at ${LOCAL_FE_URL}"
else
    echo "  ✗ Frontend is NOT responding at ${LOCAL_FE_URL}"
    echo "    Start it with: make sw-fe-dev"
    exit 1
fi

echo ""
echo "Starting robot tests..."
echo ""

# Variable overrides for local dev:
#   BASE_URL          -> backend API URL (test_be.robot)
#   FE_BASE_URL       -> frontend URL for HTTP tests (test_fe.robot)
#   BASE_URL_FE       -> frontend URL for browser tests (test_field_flow.robot)
#   EXTERNAL_DNS_URL  -> frontend URL for browser/DNS tests (test_navigation.robot, test_external_dns.robot)
#   BE_POD_IP         -> empty to skip pod-IP-only tests (not applicable locally)
robot \
    --variable BASE_URL:${LOCAL_BE_URL} \
    --variable FE_BASE_URL:${LOCAL_FE_URL} \
    --variable BASE_URL_FE:${LOCAL_FE_URL} \
    --variable EXTERNAL_DNS_URL:${LOCAL_FE_URL} \
    --variable BE_POD_IP: \
    --loglevel DEBUG \
    -d "${REPORT_DIR}" \
    "${TEST_PATH}"
