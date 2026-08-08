# Multi-stage build for the PayLater Reporting Service.
# Build from repository root (required for paylater/shared local module):
#   docker build -f reporting-service/Dockerfile -t paylater-reporting-service .

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when module files are unchanged)
COPY shared/go.mod shared/go.sum ./shared/
COPY reporting-service/go.mod reporting-service/go.sum ./reporting-service/

WORKDIR /build/reporting-service
RUN go mod download

# Source required for compilation (replace paylater/shared => ../shared)
WORKDIR /build
COPY shared/ ./shared/
COPY reporting-service/cmd/ ./reporting-service/cmd/
COPY reporting-service/internal/ ./reporting-service/internal/
COPY reporting-service/db/sqlc/ ./reporting-service/db/sqlc/

WORKDIR /build/reporting-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /reporting-service ./cmd/server

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /reporting-service .

USER appuser

EXPOSE 8086

CMD ["./reporting-service"]
