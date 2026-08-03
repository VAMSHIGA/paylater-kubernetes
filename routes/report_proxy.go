package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// ReportProxyRoutes forwards report requests to the Reporting Service.
//
// Strangler routing:
//   GET /reports/merchant-fees → Reporting Service
//   GET /reports/customer-dues → Reporting Service
//   GET /reports/credit-limit  → Reporting Service
//   GET /reports/total-dues    → Reporting Service
//
// Local report routes are not registered; report APIs are owned by the Reporting Service.
func ReportProxyRoutes(router *gin.Engine, reportingServiceURL string) {
	target, err := url.Parse(reportingServiceURL)
	if err != nil {
		panic("invalid REPORTING_SERVICE_URL: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	router.GET("/reports/merchant-fees", gin.WrapH(proxy))
	router.GET("/reports/customer-dues", gin.WrapH(proxy))
	router.GET("/reports/credit-limit", gin.WrapH(proxy))
	router.GET("/reports/total-dues", gin.WrapH(proxy))
}
