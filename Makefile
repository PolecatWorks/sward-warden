.PHONY: all build test run

all: build test

build:
	cd sp-be-container && cargo build

test:
	cd sp-be-container && cargo test -- --test-threads=1

run:
	cd sp-be-container && cargo run
