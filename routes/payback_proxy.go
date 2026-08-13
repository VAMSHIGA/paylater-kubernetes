package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// PaybackProxyRoutes forwards payback requests to the Payback Service.
//
// Strangler routing:
//
//	POST /paybacks → Payback Service
//	GET  /paybacks → Payback Service
//
// Local payback routes are not registered; payback APIs are owned by the Payback Service.
func PaybackProxyRoutes(router *gin.Engine, paybackServiceURL string) {
	target, err := url.Parse(paybackServiceURL)
	if err != nil {
		panic("invalid PAYBACK_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	router.POST("/paybacks", gin.WrapH(proxy))
	router.GET("/paybacks", gin.WrapH(proxy))
}
