# Multi-stage build for the PayLater Transaction Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f transaction-service/Dockerfile -t paylater-transaction-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY transaction-service/go.mod transaction-service/go.sum ./transaction-service/

WORKDIR /build/transaction-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY transaction-service/cmd/ ./transaction-service/cmd/
COPY transaction-service/internal/ ./transaction-service/internal/
COPY transaction-service/db/sqlc/ ./transaction-service/db/sqlc/

WORKDIR /build/transaction-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /transaction-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /transaction-service .

USER appuser

EXPOSE 8084

CMD ["./transaction-service"]
