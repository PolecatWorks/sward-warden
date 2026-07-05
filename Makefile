.PHONY: all build-fe build-be helm-package helm-deploy test \
        sw-fe-dev sw-fe-docker sw-fe-docker-run \
        sw-be-dev sw-be-docker sw-be-docker-run \
        db-local \
        robot-test robot-test-be robot-test-fe robot-test-nav robot-test-hold

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

# Run development server
$(foreach app,$(RUST_APPS),$(app)-dev):%-dev:
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	$(if $($*_HEALTH_PORT),-@lsof -t -i :$($*_HEALTH_PORT) | xargs kill -9 2>/dev/null || true)
	cd $*-container && \
	RUST_LOG=debug \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__URL="postgres://localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__USERNAME="postgres" \
	SP_BE__DATABASE__URL__PASSWORD="mysecretpassword" \
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

# Run dev server (Node)
$(foreach app,$(NODE_APPS),$(app)-dev):%-dev:%-container/node_modules
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
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
compose-db:
	@if docker ps --format '{{.Names}}' | grep -Eq "^sward-postgres$$"; then \
		echo "Container sward-postgres is already running. Attaching to logs..."; \
		docker logs -f sward-postgres; \
	else \
		docker compose -f docker-compose/postgres.yaml up; \
	fi

db-local:
	docker container stop sward-postgres || true
	@echo "Starting Postgres on port 5432"
	docker run -it --rm --name sward-postgres \
		-e POSTGRES_PASSWORD=mysecretpassword \
		-e POSTGRES_DB=swarddb \
		-p 5432:5432 \
		postgis/postgis:15-3.3

# --- Robot Integration Tests (Local Dev) ---
# Prerequisites: make compose-db, make sw-be-dev, make sw-fe-dev

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
		echo "Could not find a commit older than 8 days. Exiting."; \
		exit 1; \
	fi; \
	echo "Found commit: $$HASH"; \
	echo "Creating temporary orphan branch at $$HASH..."; \
	git checkout --orphan temp-branch $$HASH; \
	echo "Removing content older than 8 days..."; \
	python3 -c ' \
import os, time, shutil \
now = time.time() \
for folder in ["pr", "merge-group"]: \
    if os.path.exists(folder): \
        for entry in os.listdir(folder): \
            path = os.path.join(folder, entry) \
            if os.path.isdir(path): \
                ts_file = os.path.join(path, ".timestamp") \
                if os.path.exists(ts_file): \
                    try: \
                        with open(ts_file, "r") as f: \
                            ts = float(f.read().strip()) \
                            if now - ts > 8 * 24 * 3600: \
                                print(f"Pruning old folder: {path}") \
                                shutil.rmtree(path) \
                    except Exception as e: \
                        print(f"Error checking {path}: {e}") \
'; \
	git add -A; \
	echo "Creating base commit..."; \
	PRE_COMMIT_ALLOW_NO_CONFIG=1 git commit --no-verify -m "Squashed history older than 8 days"; \
	echo "Rebasing recent commits onto the new base..."; \
	git rebase --onto temp-branch $$HASH gh-pages; \
	echo "Cleaning up temp branch..."; \
	git branch -D temp-branch; \
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
