.PHONY: all build-frontend build-backend helm-package helm-deploy test

HELM_CHART := slurry-manager
HELM_DIR := charts/$(HELM_CHART)

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
