package customerauth

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

func TestWriteOwnershipError_NoLinkedCustomer(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)

	if !WriteOwnershipError(c, ErrNoLinkedCustomer) {
		t.Fatal("expected response to be written")
	}

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}

	if !strings.Contains(recorder.Body.String(), ErrNoLinkedCustomer.Error()) {
		t.Fatalf("unexpected body: %s", recorder.Body.String())
	}
}

func TestEnforceCustomerAccessFromContext_CustomerMismatch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/transactions", nil)
	c.Set(constants.ContextKeyRole, constants.RoleCustomer)
	c.Set(constants.ContextKeyUserID, int64(10))

	err := EnforceCustomerAccessFromContext(c, 99, stubResolver{customerID: 5})
	if !errors.Is(err, platformerrors.ErrNotAuthorized) {
		t.Fatalf("expected ErrNotAuthorized, got %v", err)
	}
}
