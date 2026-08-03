package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// CustomerProxyRoutes forwards customer requests to the Customer Service.
//
// Strangler routing:
//   POST /customers → Customer Service
//   GET /customers  → Customer Service
//
// Local customer routes are not registered; customer APIs are owned by the Customer Service.
func CustomerProxyRoutes(router *gin.Engine, customerServiceURL string) {
	target, err := url.Parse(customerServiceURL)
	if err != nil {
		panic("invalid CUSTOMER_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	router.POST("/customers", gin.WrapH(proxy))
	router.GET("/customers", gin.WrapH(proxy))
}
