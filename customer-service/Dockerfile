# Multi-stage build for the PayLater Customer Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f customer-service/Dockerfile -t paylater-customer-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY customer-service/go.mod customer-service/go.sum ./customer-service/

WORKDIR /build/customer-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY customer-service/cmd/ ./customer-service/cmd/
COPY customer-service/internal/ ./customer-service/internal/
COPY customer-service/db/sqlc/ ./customer-service/db/sqlc/

WORKDIR /build/customer-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /customer-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /customer-service .

USER appuser

EXPOSE 8082

CMD ["./customer-service"]
