package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

// SummarizeResult represents the response from the Python backend
type SummarizeResult struct {
	Summary string `json:"summary"`
	Error   string `json:"error"`
}

// SummarizeDocument calls the Python backend to summarize a document at the given file path
func SummarizeDocument(filePath string) (string, error) {
	url := "http://localhost:8000/summarize"
	payload := map[string]string{"file_path": filePath}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result SummarizeResult
	err = json.Unmarshal(body, &result)
	if err != nil {
		return "", err
	}

	if result.Error != "" {
		return "", fmt.Errorf(result.Error)
	}

	return result.Summary, nil
}

// Expose to Wails frontend
func (a *App) SummarizeDocumentForFrontend(filePath string) (string, error) {
	return SummarizeDocument(filePath)
}
