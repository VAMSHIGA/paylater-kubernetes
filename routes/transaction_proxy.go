package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// TransactionProxyRoutes forwards transaction requests to the Transaction Service.
//
// Strangler routing:
//
//	POST /transactions → Transaction Service
//	GET  /transactions → Transaction Service
//
// Local transaction routes are not registered; transaction APIs are owned by the Transaction Service.
func TransactionProxyRoutes(router *gin.Engine, transactionServiceURL string) {
	target, err := url.Parse(transactionServiceURL)
	if err != nil {
		panic("invalid TRANSACTION_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	router.POST("/transactions", gin.WrapH(proxy))
	router.GET("/transactions", gin.WrapH(proxy))
}
