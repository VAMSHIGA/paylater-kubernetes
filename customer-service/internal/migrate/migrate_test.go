package migrate

import (
	"testing"
)

func TestApplyUserIDLinkageRequiresDatabase(t *testing.T) {
	t.Parallel()

	err := ApplyUserIDLinkage(t.Context(), nil, "identity_db")
	if err == nil {
		t.Fatal("expected error when db is nil")
	}
}
