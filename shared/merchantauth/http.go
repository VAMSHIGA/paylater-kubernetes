package merchantauth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
	"paylater/shared/response"
)

func EnforceMerchantAccessFromContext(
	c *gin.Context,
	requestedMerchantID int64,
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

	return EnforceMerchantAccess(
		c.Request.Context(),
		role,
		userID,
		requestedMerchantID,
		resolver,
	)
}

func WriteOwnershipError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}

	if errors.Is(err, ErrNoLinkedMerchant) {
		response.Error(c, http.StatusForbidden, ErrNoLinkedMerchant.Error())
		return true
	}

	if errors.Is(err, platformerrors.ErrNotAuthorized) {
		response.Error(c, http.StatusForbidden, platformerrors.ErrNotAuthorized.Error())
		return true
	}

	response.InternalError(c, err)
	return true
}

func OwnedMerchantIDFromContext(c *gin.Context, resolver Resolver) (int64, error) {
	roleValue, roleExists := c.Get(constants.ContextKeyRole)
	if !roleExists {
		return 0, platformerrors.ErrNotAuthorized
	}

	role, ok := roleValue.(string)
	if !ok || role != constants.RoleMerchant {
		return 0, platformerrors.ErrNotAuthorized
	}

	userIDValue, userIDExists := c.Get(constants.ContextKeyUserID)
	if !userIDExists {
		return 0, platformerrors.ErrNotAuthorized
	}

	userID, ok := userIDValue.(int64)
	if !ok {
		return 0, platformerrors.ErrNotAuthorized
	}

	return resolver.GetMerchantIDByUserID(c.Request.Context(), userID)
}
