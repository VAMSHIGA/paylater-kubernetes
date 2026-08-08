# Multi-stage build for the PayLater Identity Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f identity-service/Dockerfile -t paylater-identity-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY identity-service/go.mod identity-service/go.sum ./identity-service/

WORKDIR /build/identity-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY identity-service/cmd/ ./identity-service/cmd/
COPY identity-service/internal/ ./identity-service/internal/
COPY identity-service/db/sqlc/ ./identity-service/db/sqlc/

WORKDIR /build/identity-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /identity-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /identity-service .

USER appuser

EXPOSE 8081

CMD ["./identity-service"]
