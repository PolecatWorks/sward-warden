.PHONY: all build-frontend build-backend helm-package helm-deploy test \
        sp-fe-dev sp-fe-docker sp-fe-docker-run \
        sp-be-dev sp-be-docker sp-be-docker-run \
        db-local

BASE_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

HELM_CHART := slurry-manager
HELM_DIR := charts/$(HELM_CHART)

RUST_APPS := sp-be
NODE_APPS := sp-fe
APPS := $(RUST_APPS) $(NODE_APPS)

sp-be_PORT := 8080
sp-be_HEALTH_PORT := 8079
sp-fe_PORT := 4200

sp-be_INTERNAL_PORT := 8080
sp-be_INTERNAL_HEALTH_PORT := 8079
sp-fe_INTERNAL_PORT := 80

# Original commands
test:
	cd sp-be-container && cargo test -- --test-threads=1

all: build-frontend build-backend helm-package

build-frontend:
	docker build -t slurry-manager-frontend:latest sp-fe-container

build-backend:
	docker build -t slurry-manager-backend:latest sp-be-container

helm-package:
	helm package $(HELM_DIR) -d charts

helm-deploy:
	helm upgrade --install $(HELM_CHART) $(HELM_DIR)

# --- Rust Backend Patterns ---

# Run development server
$(foreach app,$(RUST_APPS),$(app)-dev):%-dev:
	cd $*-container && \
	cargo run -- serve

# Run tests
$(foreach app,$(RUST_APPS),$(app)-test):%-test:
	cd $*-container && \
	cargo test -- --test-threads=1

# --- Node/Frontend Patterns ---

# Install dependencies (Node)
$(foreach app,$(NODE_APPS),$(app)-container/node_modules):%-container/node_modules:%-container/package.json
	cd $*-container && npm install

# Run dev server (Node)
$(foreach app,$(NODE_APPS),$(app)-dev):%-dev:%-container/node_modules
	cd $*-container && npm start

# Run tests (Node)
$(foreach app,$(NODE_APPS),$(app)-test):%-test:%-container/node_modules
	cd $*-container && npm test -- --watch=false --browsers=ChromeHeadless

# --- Docker ---

$(foreach app,$(APPS),$(app)-docker):%-docker:
	cd $*-container && docker build -t slurry-manager-$*:latest .

# Docker Run
$(foreach app,$(APPS),$(app)-docker-run):%-docker-run:%-docker
	docker run -it --rm --name slurry-manager-$* \
		-p ${$*_PORT}:${$*_INTERNAL_PORT} \
		$(if ${$*_HEALTH_PORT},-p ${$*_HEALTH_PORT}:${$*_INTERNAL_HEALTH_PORT}) \
		slurry-manager-$*:latest

.PHONY: tests
tests: $(foreach app,$(APPS),$(app)-test)

# --- Database ---
compose-db:
	docker compose -f docker-compose/postgres.yaml up || echo "compose file missing"

db-local:
	docker container stop slurry-postgres || true
	@echo "Starting Postgres on port 5432"
	docker run -it --rm --name slurry-postgres \
		-e POSTGRES_PASSWORD=mysecretpassword \
		-e POSTGRES_DB=slurrydb \
		-p 5432:5432 \
		pgvector/pgvector:pg15
