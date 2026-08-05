.PHONY: all build-fe build-be helm-package helm-deploy test \
        sw-fe-dev sw-fe-dev-keycloak sw-fe-docker sw-fe-docker-run \
        sw-be-dev sw-be-dev-keycloak sw-be-docker sw-be-docker-run \
        compose-db-up compose-db-down compose-db-clean garden-up garden-test garden-down \
        robot-test robot-test-keycloak robot-test-be robot-test-fe robot-test-nav robot-test-hold

KEYCLOAK_URL ?= http://keycloak.k8s
KEYCLOAK_REALM_URL ?= $(KEYCLOAK_URL)/auth/realms/sw-dev

BASE_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

HELM_CHART := sward-warden
HELM_DIR := charts/$(HELM_CHART)

RUST_APPS := sw-be
NODE_APPS := sw-fe sw-admin
APPS := $(RUST_APPS) $(NODE_APPS)

sw-be_PORT := 8080
sw-be_HEALTH_PORT := 8079
sw-fe_PORT := 4200
sw-admin_PORT := 4201

sw-be_INTERNAL_PORT := 8080
sw-be_INTERNAL_HEALTH_PORT := 8079
sw-fe_INTERNAL_PORT := 80
sw-admin_INTERNAL_PORT := 80

# Original commands
test:
	cd sw-be-container && cargo test -- --test-threads=1

all: build-fe build-be helm-package

build-fe:
	docker build -t sward-warden-fe:latest sw-fe-container

build-be:
	docker build -t sward-warden-be:latest sw-be-container

helm-package:
	helm package $(HELM_DIR) -d charts

helm-deploy:
	helm upgrade --install $(HELM_CHART) $(HELM_DIR)

# --- Rust Be Patterns ---

# Run development server (Standalone / Mock Auth mode)
$(foreach app,$(RUST_APPS),$(app)-dev):%-dev:
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	$(if $($*_HEALTH_PORT),-@lsof -t -i :$($*_HEALTH_PORT) | xargs kill -9 2>/dev/null || true)
	cd $*-container && \
	RUST_LOG=debug \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__URL="postgres://localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__USERNAME="postgres" \
	SP_BE__DATABASE__URL__PASSWORD="mysecretpassword" \
	SP_BE__DEBUGGING__ENABLE_DEV_AUTH=true \
	cargo watch -x 'run -- --config-path config/default.yaml --secrets-dir config/ serve'

# Run development server with Keycloak OIDC authentication flow
$(foreach app,$(RUST_APPS),$(app)-dev-keycloak):%-dev-keycloak:
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	$(if $($*_HEALTH_PORT),-@lsof -t -i :$($*_HEALTH_PORT) | xargs kill -9 2>/dev/null || true)
	cd $*-container && \
	RUST_LOG=debug \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__URL="postgres://localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__USERNAME="postgres" \
	SP_BE__DATABASE__URL__PASSWORD="mysecretpassword" \
	SP_BE__DEBUGGING__ENABLE_DEV_AUTH=false \
	SP_BE__KEYCLOAK__BASE_URL="$(KEYCLOAK_REALM_URL)" \
	SP_BE__KEYCLOAK__REALM="sw-dev" \
	cargo watch -x 'run -- --config-path config/default.yaml --secrets-dir config/ serve'

# Run migrations
$(foreach app,$(RUST_APPS),$(app)-migrate):%-migrate:
	cd $*-container && \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__URL="postgres://localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__USERNAME="postgres" \
	SP_BE__DATABASE__URL__PASSWORD="mysecretpassword" \
	cargo run -- --config-path config/default.yaml --secrets-dir config/ migrate

# Run tests
$(foreach app,$(RUST_APPS),$(app)-test):%-test:
	cd $*-container && \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" cargo test -- --test-threads=1

# --- Node/Fe Patterns ---

# Install dependencies (Node)
$(foreach app,$(NODE_APPS),$(app)-container/node_modules):%-container/node_modules:%-container/package.json
	cd $*-container && npm install

# Run dev server (Node - Standalone / Mock Auth mode)
$(foreach app,$(NODE_APPS),$(app)-dev):%-dev:%-container/node_modules
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	@if [ "$*" = "sw-fe" ]; then \
		node -e ' \
			const fs = require("fs"); \
			const path = "sw-fe-container/src/assets/contents/app-config.json"; \
			const cfg = JSON.parse(fs.readFileSync(path, "utf8")); \
			cfg.auth = null; \
			fs.writeFileSync(path, JSON.stringify(cfg, null, 2)); \
		'; \
	fi
	cd $*-container && npm start

# Run dev server (Node - Keycloak Auth mode)
$(foreach app,$(NODE_APPS),$(app)-dev-keycloak):%-dev-keycloak:%-container/node_modules
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	@if [ "$*" = "sw-fe" ]; then \
		node -e ' \
			const fs = require("fs"); \
			const path = "sw-fe-container/src/assets/contents/app-config.json"; \
			const cfg = JSON.parse(fs.readFileSync(path, "utf8")); \
			cfg.auth = { \
				issuer: process.env.KEYCLOAK_REALM_URL || "$(KEYCLOAK_REALM_URL)", \
				clientId: "sward-warden-fe", \
				scope: "openid profile email", \
				requireHttps: false, \
				skipIssuerCheck: true \
			}; \
			fs.writeFileSync(path, JSON.stringify(cfg, null, 2)); \
		'; \
	fi
	cd $*-container && npm start

# Run tests (Node)
$(foreach app,$(NODE_APPS),$(app)-test):%-test:%-container/node_modules
	cd $*-container && npm test -- --watch=false --browsers=ChromeHeadless

# --- Docker ---sw

$(foreach app,$(APPS),$(app)-docker):%-docker:
	cd $*-container && docker build -t sward-warden-$*:latest .

# Docker Run
$(foreach app,$(APPS),$(app)-docker-run):%-docker-run:%-docker
	docker run -it --rm --name sward-warden-$* \
		-p $($*_PORT):$($*_INTERNAL_PORT) \
		$(if $($*_HEALTH_PORT),-p $($*_HEALTH_PORT):$($*_INTERNAL_HEALTH_PORT)) \
		sward-warden-$*:latest

.PHONY: tests
tests: $(foreach app,$(APPS),$(app)-test)

# --- Database ---
compose-db-up:
	@if docker ps --format '{{.Names}}' | grep -Eq "^sward-postgres$$"; then \
		echo "Container sward-postgres is already running. Attaching to logs..."; \
		docker logs -f sward-postgres; \
	else \
		docker compose -f docker-compose/postgres.yaml up; \
	fi

compose-db-down:
	@echo "Stopping and removing local Postgres database container..."
	docker compose -f docker-compose/postgres.yaml down

compose-db-clean:
	@echo "Stopping Postgres container and removing database volumes..."
	docker compose -f docker-compose/postgres.yaml down -v

# --- Garden ---
garden-up:
	@echo "Logging Helm into GHCR and running Garden deploy..."
	@echo "$${GHCR_TOKEN}" | helm registry login ghcr.io -u "$${GHCR_USER:-bengreen}" --password-stdin 2>/dev/null || true
	garden deploy

garden-test: garden-up
	@echo "Running Garden tests..."
	garden test
	@echo "Copying test reports to $(ROBOT_REPORT_DIR)..."
	@mkdir -p $(ROBOT_REPORT_DIR)
	@NS="sward-warden-$${USER:-local}"; \
	kubectl cp $$NS/robot-test-runner:/tmp/reports $(ROBOT_REPORT_DIR) 2>/dev/null || true
	@if [ -f "$(ROBOT_REPORT_DIR)/log.html" ]; then \
		echo "Opening test report log.html..."; \
		open $(ROBOT_REPORT_DIR)/log.html || true; \
	fi

garden-down:
	@echo "Tearing down Garden environment..."
	garden cleanup env

# --- Robot Integration Tests (Local Dev) ---
# Prerequisites: make compose-db-up, make sw-be-dev, make sw-fe-dev

# LOCAL_BE_URL ?= http://127.0.0.1:8080/sward
# LOCAL_FE_URL ?= http://127.0.0.1:4200
LOCAL_BE_URL ?= http://localhost:8080/sward
LOCAL_FE_URL ?= http://localhost:4200
ROBOT_VENV := $(BASE_DIR).venv
ROBOT := $(ROBOT_VENV)/bin/robot
ROBOT_REPORT_DIR := $(BASE_DIR)integration-tests/reports
ROBOT_TEST_DIR := $(BASE_DIR)integration-tests/tests
ROBOT_HOLD_DIR := $(BASE_DIR)integration-tests/test_hold

# Create venv and install robot test dependencies
$(ROBOT_VENV)/bin/robot:
	python3 -m venv $(ROBOT_VENV)
	$(ROBOT_VENV)/bin/pip install robotframework robotframework-requests robotframework-browser
	$(ROBOT_VENV)/bin/python -m Browser.entry init

# --- GitHub Pages Cleanup ---
.PHONY: squash-gh-pages
squash-gh-pages:
	@set -e; \
	if [ "$$CONFIRM_SQUASH" != "true" ]; then \
		echo "ERROR: You must set CONFIRM_SQUASH=true to execute this action."; \
		exit 1; \
	fi; \
	echo "Checking out gh-pages..."; \
	git checkout gh-pages; \
	git pull origin gh-pages || true; \
	echo "Squashing history older than 8 days on gh-pages..."; \
	HASH=$$(git log --before="8 days ago" --format="%h" -1); \
	if [ -z "$$HASH" ]; then \
		echo "No commits older than 8 days found. Falling back to the oldest commit..."; \
		HASH=$$(git log --reverse --format="%h" | head -n 1); \
	fi; \
	if [ -z "$$HASH" ]; then \
		echo "Could not find any commits. Exiting."; \
		exit 1; \
	fi; \
	echo "Found commit: $$HASH"; \
	echo "Creating temporary orphan branch at $$HASH..."; \
	git branch -D temp-branch || true; \
	git checkout --orphan temp-branch $$HASH; \
	echo "Creating base commit..."; \
	PRE_COMMIT_ALLOW_NO_CONFIG=1 git commit --no-verify -m "Squashed history older than 8 days"; \
	echo "Rebasing recent commits onto the new base..."; \
	git rebase --onto temp-branch $$HASH gh-pages; \
	echo "Cleaning up temp branch..."; \
	git branch -D temp-branch; \
	echo "Removing content older than 8 days..."; \
	printf '%s\n' \
		'import os, time, shutil' \
		'now = time.time()' \
		'for folder in ["pr", "merge-group"]:' \
		'    if os.path.exists(folder):' \
		'        for entry in os.listdir(folder):' \
		'            path = os.path.join(folder, entry)' \
		'            if os.path.isdir(path):' \
		'                ts_file = os.path.join(path, ".timestamp")' \
		'                if os.path.exists(ts_file):' \
		'                    try:' \
		'                        with open(ts_file, "r") as f:' \
		'                            ts = float(f.read().strip())' \
		'                            if now - ts > 8 * 24 * 3600:' \
		'                                print(f"Pruning old folder: {path}")' \
		'                                shutil.rmtree(path)' \
		'                    except Exception as e:' \
		'                        print(f"Error checking {path}: {e}")' \
		> prune.py; \
	python3 prune.py; \
	rm prune.py; \
	git add -u; \
	if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "Committing pruned content..."; \
		PRE_COMMIT_ALLOW_NO_CONFIG=1 git commit --no-verify -m "Prune reports older than 8 days"; \
	fi; \
	echo "Force pushing to origin..."; \
	git push -f origin gh-pages; \
	echo "Done."

# --- Service Waiting Targets ---
.PHONY: wait-all
wait-all: $(ROBOT_VENV)/bin/robot
	$(ROBOT_VENV)/bin/python integration-tests/wait_for_services.py $(LOCAL_BE_URL) $(LOCAL_FE_URL)

# Run all robot integration tests against local dev
.PHONY: robot-test
robot-test: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running all robot integration tests against local dev..."
	$(ROBOT) \
		--variable BE_BASE_URL:${LOCAL_BE_URL} \
		--variable FE_BASE_URL:${LOCAL_FE_URL} \
		--variable EXTERNAL_DNS_URL:${LOCAL_FE_URL} \
		--variable BE_POD_IP: \
		--exclude k8s_only \
		--loglevel DEBUG \
		-d "${ROBOT_REPORT_DIR}" \
		$(ROBOT_TEST_DIR); \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc

# Run all robot integration tests with Keycloak enabled against local dev
.PHONY: robot-test-keycloak
robot-test-keycloak: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running all robot integration tests with Keycloak enabled..."
	$(ROBOT) \
		--variable BE_BASE_URL:${LOCAL_BE_URL} \
		--variable FE_BASE_URL:${LOCAL_FE_URL} \
		--variable EXTERNAL_DNS_URL:${LOCAL_FE_URL} \
		--variable BE_POD_IP: \
		--variable ENABLE_KEYCLOAK:true \
		--exclude k8s_only \
		--loglevel DEBUG \
		-d "${ROBOT_REPORT_DIR}" \
		$(ROBOT_TEST_DIR); \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc

# Run a specific robot test file or test case (e.g. make robot-test-single TEST=test_field_topology.robot)
.PHONY: robot-test-single
robot-test-single: $(ROBOT_VENV)/bin/robot wait-all
	@if [ -z "$(TEST)" ]; then \
		echo "ERROR: Please specify the test file or test case name, e.g.: make robot-test-single TEST=test_field_topology.robot"; \
		exit 1; \
	fi
	@echo "Running robot test: $(TEST)..."
	$(ROBOT) \
		--variable BE_BASE_URL:${LOCAL_BE_URL} \
		--variable FE_BASE_URL:${LOCAL_FE_URL} \
		--variable EXTERNAL_DNS_URL:${LOCAL_FE_URL} \
		--variable BE_POD_IP: \
		--exclude k8s_only \
		--loglevel DEBUG \
		-d "${ROBOT_REPORT_DIR}" \
		$(shell if [ -f "$(ROBOT_TEST_DIR)/$(TEST)" ]; then echo "$(ROBOT_TEST_DIR)/$(TEST)"; elif [ -f "$(TEST)" ]; then echo "$(TEST)"; else echo --test "$(TEST)" "$(ROBOT_TEST_DIR)"; fi); \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc


# Run only backend API tests (RequestsLibrary-based)
.PHONY: robot-test-be
robot-test-be: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running backend API robot tests..."
	$(ROBOT) \
		--variable BE_BASE_URL:$(LOCAL_BE_URL) \
		--variable BE_POD_IP: \
		--loglevel DEBUG \
		-d $(ROBOT_REPORT_DIR) \
		$(ROBOT_TEST_DIR)/test_be.robot; \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc

# Clean up stale/orphaned test data from backend API
.PHONY: robot-test-cleanup
robot-test-cleanup: $(ROBOT_VENV)/bin/robot
	@echo "Cleaning up stale test data..."
	$(ROBOT_VENV)/bin/python integration-tests/tests/cleanup_stale_test_data.py $(LOCAL_BE_URL)


# Run only frontend HTTP tests (RequestsLibrary-based)
.PHONY: robot-test-fe
robot-test-fe: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running frontend HTTP robot tests..."
	$(ROBOT) \
		--variable FE_BASE_URL:$(LOCAL_FE_URL) \
		--loglevel DEBUG \
		-d $(ROBOT_REPORT_DIR) \
		$(ROBOT_TEST_DIR)/test_fe.robot; \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc

# Run browser-based navigation tests (Browser library)
.PHONY: robot-test-nav
robot-test-nav: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running browser navigation robot tests..."
	$(ROBOT) \
		--variable EXTERNAL_DNS_URL:$(LOCAL_FE_URL) \
		--loglevel DEBUG \
		-d $(ROBOT_REPORT_DIR) \
		$(ROBOT_TEST_DIR)/test_navigation.robot; \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc

# Run test_hold tests (e.g. field flow end-to-end)
.PHONY: robot-test-hold
robot-test-hold: $(ROBOT_VENV)/bin/robot wait-all
	@echo "Running test_hold robot tests..."
	$(ROBOT) \
		--variable BE_BASE_URL:$(LOCAL_BE_URL) \
		--variable FE_BASE_URL:$(LOCAL_FE_URL) \
		--variable EXTERNAL_DNS_URL:$(LOCAL_FE_URL) \
		--variable BE_POD_IP: \
		--loglevel DEBUG \
		-d $(ROBOT_REPORT_DIR) \
		$(ROBOT_HOLD_DIR); \
		rc=$$?; if [ -t 1 ]; then open $(ROBOT_REPORT_DIR)/log.html; fi; exit $$rc
