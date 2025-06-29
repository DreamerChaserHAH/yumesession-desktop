package main

import (
	"embed"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"io/fs"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed python/main.py
var corePythonScript embed.FS

//go:embed python/requirements.txt
var corePythonRequirements embed.FS

// Helper to extract an embedded file to disk
func extractFile(fsys fs.FS, name, target string) error {
	data, err := fs.ReadFile(fsys, name)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(target, data, 0644)
}

// Helper to extract an embedded directory (recursively) to disk
func extractDir(fsys fs.FS, embedRoot, target string) error {
	return fs.WalkDir(fsys, embedRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(embedRoot, path)
		if err != nil || relPath == "." {
			return nil // skip the root
		}
		targetPath := filepath.Join(target, relPath)
		if d.IsDir() {
			return os.MkdirAll(targetPath, 0755)
		}
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			return err
		}
		return ioutil.WriteFile(targetPath, data, 0755)
	})
}

func ensureVenv(basePath, venvPath, reqPath string) {
	if _, err := os.Stat(venvPath); os.IsNotExist(err) {
		log.Println("Creating Python virtual environment...")
		// Try python3, fallback to python if not found
		pythonExe := "python3"
		if _, err := exec.LookPath("python3"); err != nil {
			pythonExe = "python"
		}
		cmd := exec.Command(pythonExe, "-m", "venv", venvPath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			log.Fatalf("Failed to create venv: %v", err)
		}
		log.Println("Installing Python requirements...")
		var pipPath string
		if os.PathSeparator == '\\' {
			// Windows
			pipPath = filepath.Join(venvPath, "Scripts", "pip.exe")
		} else {
			// POSIX
			pipPath = filepath.Join(venvPath, "bin", "pip")
		}
		cmd = exec.Command(pipPath, "install", "-r", reqPath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			log.Fatalf("Failed to install requirements: %v", err)
		}
	}
}

func startPythonServer(basePath, venvPath string) {
	pythonBin := ""
	if os.PathSeparator == '\\' {
		// Windows
		pythonBin = filepath.Join(venvPath, "Scripts", "python.exe")
	} else {
		// POSIX
		pythonBin = filepath.Join(venvPath, "bin", "python3")
		if _, err := os.Stat(pythonBin); os.IsNotExist(err) {
			pythonBin = filepath.Join(venvPath, "bin", "python")
		}
	}

	cmd := exec.Command(pythonBin, "-m", "uvicorn", "yumesession.python.main:app")
	if err := cmd.Start(); err != nil {
		log.Printf("Failed to start Python script: %v", err)
	}
}

func main() {
	basePath := "yumesession/python"
	venvPath := filepath.Join(basePath, ".venv")
	mainPyPath := filepath.Join(basePath, "main.py")
	reqPath := filepath.Join(basePath, "requirements.txt")

	os.MkdirAll(basePath, 0755)

	extractFile(corePythonScript, "python/main.py", mainPyPath)
	extractFile(corePythonRequirements, "python/requirements.txt", reqPath)

	// Ensure venv and install requirements if needed (blocking)
	ensureVenv(basePath, venvPath, reqPath)

	// Start Python server (non-blocking, not tracked)
	startPythonServer(basePath, venvPath)

	// Initialize database
	if err := InitDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create an instance of the app structure
	app := NewApp()

	// Initialize WebSocket connection
	/*go func() {
		// Wait a bit for the app to start
		time.Sleep(2 * time.Second)
		if err := app.InitializeWebSocket(); err != nil {
			log.Printf("Failed to initialize WebSocket: %v", err)
		}
	}()
	*/

	/*
		// Initialize transcription server
		go func() {
			// Wait a bit for the app to start
			time.Sleep(1 * time.Second)
			if err := app.InitializeTranscriptionServer(); err != nil {
				log.Printf("Failed to initialize transcription server: %v", err)
			}
		}()
	*/

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "YumeSession",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
