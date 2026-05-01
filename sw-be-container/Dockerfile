FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS buildcache
COPY --from=planner /app/recipe.json recipe.json

FROM buildcache AS dev
# Install dev tools
RUN cargo install cargo-watch
# Grab dependencies into target
RUN cargo chef cook --recipe-path recipe.json
# This enables us to keep /app/target inside the container when we mount /app from host
VOLUME /app/target
# So we hold the daemon mode of docker run
CMD ["sleep", "infinity"]

FROM buildcache AS buildcacherelease
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json

FROM buildcacherelease AS build
COPY . .
RUN cargo test -- --test-threads=1
RUN cargo build --release

# We do not need the Rust toolchain to run the binary!
FROM debian:bookworm-slim AS runtime

# Install common runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY config/ /app/config/
COPY --from=build /app/target/release/sw-be-container /usr/local/bin/

EXPOSE 8080 8079

ENTRYPOINT ["/usr/local/bin/sw-be-container"]
CMD ["serve"]
