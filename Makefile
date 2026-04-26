.PHONY: all build-frontend build-backend helm-package helm-deploy test \
        sw-fe-dev sw-fe-docker sw-fe-docker-run \
        sw-be-dev sw-be-docker sw-be-docker-run \
        db-local

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

all: build-frontend build-backend helm-package

build-frontend:
	docker build -t sward-warden-frontend:latest sw-fe-container

build-backend:
	docker build -t sward-warden-backend:latest sw-be-container

helm-package:
	helm package $(HELM_DIR) -d charts

helm-deploy:
	helm upgrade --install $(HELM_CHART) $(HELM_DIR)

# --- Rust Backend Patterns ---

# Run development server
$(foreach app,$(RUST_APPS),$(app)-dev):%-dev:
	-@lsof -t -i :$($*_PORT) | xargs kill -9 2>/dev/null || true
	$(if $($*_HEALTH_PORT),-@lsof -t -i :$($*_HEALTH_PORT) | xargs kill -9 2>/dev/null || true)
	cd $*-container && \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__URL="postgres://localhost:5432/swarddb" \
	SP_BE__DATABASE__URL__USERNAME="postgres" \
	SP_BE__DATABASE__URL__PASSWORD="mysecretpassword" \
	cargo run -- serve

# Run tests
$(foreach app,$(RUST_APPS),$(app)-test):%-test:
	cd $*-container && \
	DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/swarddb" cargo test -- --test-threads=1

# --- Node/Frontend Patterns ---

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

# --- Docker ---

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
		pgvector/pgvector:pg15
