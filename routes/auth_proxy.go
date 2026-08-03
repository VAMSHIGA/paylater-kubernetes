// Package routes registers strangler reverse-proxy routes on the API gateway.
//
// Each file maps a public path group to one microservice using
// httputil.ReverseProxy. Authentication and authorization are not applied here;
// the destination service enforces JWT and roles. Used exclusively by the
// monolith gateway (main.go on :8080).
package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// AuthProxyRoutes forwards authentication requests to the Identity Service.
//
// Strangler routing:
//   POST /auth/register → Identity Service
//   POST /auth/login    → Identity Service
//
// Local AuthHandler routes are not registered; auth code remains in the monolith
// for a future cleanup phase.
func AuthProxyRoutes(router *gin.Engine, identityServiceURL string) {
	target, err := url.Parse(identityServiceURL)
	if err != nil {
		panic("invalid IDENTITY_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	auth := router.Group("/auth")
	auth.POST("/register", gin.WrapH(proxy))
	auth.POST("/login", gin.WrapH(proxy))
}
