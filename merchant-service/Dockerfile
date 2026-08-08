# Multi-stage build for the PayLater Merchant Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f merchant-service/Dockerfile -t paylater-merchant-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY merchant-service/go.mod merchant-service/go.sum ./merchant-service/

WORKDIR /build/merchant-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY merchant-service/cmd/ ./merchant-service/cmd/
COPY merchant-service/internal/ ./merchant-service/internal/
COPY merchant-service/db/sqlc/ ./merchant-service/db/sqlc/

WORKDIR /build/merchant-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /merchant-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /merchant-service .

USER appuser

EXPOSE 8083

CMD ["./merchant-service"]
