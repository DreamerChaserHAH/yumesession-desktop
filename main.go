package main

import (
	"context"
	"embed"
	_ "io"
	"log"
	"net"
	"net/http"

	"nhooyr.io/websocket"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func vncWebSocketProxy(w http.ResponseWriter, r *http.Request) {
	vncConn, err := net.Dial("tcp", "localhost:5900")
	if err != nil {
		http.Error(w, "Failed to connect to VNC server", http.StatusInternalServerError)
		return
	}
	defer vncConn.Close()

	wsConn, err := websocket.Accept(w, r, nil)
	if err != nil {
		log.Println("WebSocket accept error:", err)
		return
	}
	defer wsConn.Close(websocket.StatusInternalError, "Internal error")

	ctx := context.Background()

	// WebSocket -> TCP
	go func() {
		for {
			_, data, err := wsConn.Read(ctx)
			if err != nil {
				vncConn.Close()
				return
			}
			vncConn.Write(data)
		}
	}()

	// TCP -> WebSocket
	buf := make([]byte, 4096)
	for {
		n, err := vncConn.Read(buf)
		if err != nil {
			break
		}
		wsConn.Write(ctx, websocket.MessageBinary, buf[:n])
	}
	wsConn.Close(websocket.StatusNormalClosure, "")
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	go func() {
		http.HandleFunc("/vncws", vncWebSocketProxy)
		log.Println("WebSocket proxy listening on :8080/vncws")
		log.Fatal(http.ListenAndServe(":8080", nil))
	}()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "myproject",
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
