package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestPasscode(t *testing.T) {
	appInstance := SetupTestApp()
	defer CleanupTestDB()

	body, _ := json.Marshal(map[string]string{"email": "test@example.com"})
	req, _ := http.NewRequest("POST", "/auth/request-passcode", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	appInstance.Handlers.RegisterRoutes().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
}
