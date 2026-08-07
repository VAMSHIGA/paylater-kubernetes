# Multi-stage build for the PayLater API Gateway (module paylater, root main.go).
# Build context: repository root. Only gateway source is copied into the builder.

# --- Builder stage: compile the Go binary ---
FROM golang:1.25.1-alpine AS builder

WORKDIR /build

# Dependency layer (cached when go.mod / go.sum are unchanged)
COPY go.mod go.sum ./
RUN go mod download

# Gateway source only (no microservices or shared module)
COPY main.go ./
COPY config/ config/
COPY routes/ routes/

# Static Linux binary for a minimal runtime image
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /api-gateway .

# --- Runtime stage: lightweight image with only the binary ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /api-gateway .

EXPOSE 8080

CMD ["./api-gateway"]
