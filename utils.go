package main

import (
	"encoding/json"
	"net/http"
)

// HealthCheckResult represents the response from the Python backend health check
type HealthCheckResult struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// HealthCheck calls the Python backend /health endpoint
func HealthCheck() (string, string, error) {
	resp, err := http.Get("http://localhost:8000/health")
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	var result HealthCheckResult
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return "", "", err
	}

	return result.Status, result.Message, nil
}

func (a *App) HealthCheckForFrontend() (string, string, error) {
	status, message, err := HealthCheck()
	if err != nil {
		return "", "", err
	}
	return status, message, nil
}
