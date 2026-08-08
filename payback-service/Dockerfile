# Multi-stage build for the PayLater Payback Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f payback-service/Dockerfile -t paylater-payback-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY payback-service/go.mod payback-service/go.sum ./payback-service/

WORKDIR /build/payback-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY payback-service/cmd/ ./payback-service/cmd/
COPY payback-service/internal/ ./payback-service/internal/
COPY payback-service/db/sqlc/ ./payback-service/db/sqlc/

WORKDIR /build/payback-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /payback-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /payback-service .

USER appuser

EXPOSE 8085

CMD ["./payback-service"]
