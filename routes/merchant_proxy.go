package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// MerchantProxyRoutes forwards merchant requests to the Merchant Service.
//
// Strangler routing:
//
//	POST /merchants     → Merchant Service
//	GET  /merchants/me  → Merchant Service
//	GET  /merchants/me/dashboard → Merchant Service
//	PUT /merchants/:id  → Merchant Service
//
// Local merchant routes are not registered; merchant APIs are owned by the Merchant Service.
func MerchantProxyRoutes(router *gin.Engine, merchantServiceURL string) {
	target, err := url.Parse(merchantServiceURL)
	if err != nil {
		panic("invalid MERCHANT_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	router.POST("/merchants", gin.WrapH(proxy))
	router.GET("/merchants/me", gin.WrapH(proxy))
	router.GET("/merchants/me/dashboard", gin.WrapH(proxy))
	router.PUT("/merchants/:id", gin.WrapH(proxy))
}
