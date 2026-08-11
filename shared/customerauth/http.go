package customerauth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
	"paylater/shared/response"
)

// EnforceCustomerAccessFromContext reads JWT role/user_id from Gin context and
// enforces customer ownership when the caller has the customer role.
func EnforceCustomerAccessFromContext(
	c *gin.Context,
	requestedCustomerID int64,
	resolver Resolver,
) error {
	roleValue, roleExists := c.Get(constants.ContextKeyRole)
	if !roleExists {
		return platformerrors.ErrNotAuthorized
	}

	role, ok := roleValue.(string)
	if !ok {
		return platformerrors.ErrNotAuthorized
	}

	userIDValue, userIDExists := c.Get(constants.ContextKeyUserID)
	if !userIDExists {
		return platformerrors.ErrNotAuthorized
	}

	userID, ok := userIDValue.(int64)
	if !ok {
		return platformerrors.ErrNotAuthorized
	}

	return EnforceCustomerAccess(
		c.Request.Context(),
		role,
		userID,
		requestedCustomerID,
		resolver,
	)
}

// WriteOwnershipError maps ownership failures to HTTP responses.
//
// Returns true when a response was written and the handler should return.
func WriteOwnershipError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}

	if errors.Is(err, ErrNoLinkedCustomer) {
		response.Error(c, http.StatusForbidden, ErrNoLinkedCustomer.Error())
		return true
	}

	if errors.Is(err, platformerrors.ErrNotAuthorized) {
		response.Error(c, http.StatusForbidden, platformerrors.ErrNotAuthorized.Error())
		return true
	}

	response.InternalError(c, err)
	return true
}
