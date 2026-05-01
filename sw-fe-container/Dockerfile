FROM node:22-alpine AS build

WORKDIR /app

# Switch to app directory
COPY package.json package-lock.json .npmrc* ./
RUN --mount=type=secret,id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN \
    npm ci

# Copy application code
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Add OCI labels
LABEL org.opencontainers.image.title="Slurry-pal FE"
LABEL org.opencontainers.image.description="Slurry-pal User Interface (Angular)"
LABEL org.opencontainers.image.authors="Ben Greene <BenJGreene@gmail.com>"
LABEL org.opencontainers.image.source="https://github.com/PolecatWorks/Slurry-pal"

COPY --from=build /app/dist/sw-fe-container/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
