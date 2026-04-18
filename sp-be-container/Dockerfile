FROM rust:1.75 AS build
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/sp-be-container /app/sp-be-container
EXPOSE 8080 8079
ENTRYPOINT ["/app/sp-be-container"]
CMD ["serve"]