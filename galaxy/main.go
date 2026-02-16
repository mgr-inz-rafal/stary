package main

import (
    "encoding/json"
    "net/http"
    "log"
    "fmt"
    "galaxy/genproto"
)

// Response structure
type Response struct {
    Message string `json:"message"`
}

func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    resp := Response{Message: "Hello, world!"}
    json.NewEncoder(w).Encode(resp)
}

func main() {
    point := &genproto.Point{
        X: 10,
        Y: 20,
        Z: 0,
    }

    fmt.Printf("Point: %+v\n", point)

    http.HandleFunc("/", handler)

    port := ":8080" // Hardcoded port
    log.Printf("Server starting on port %s\n", port)
    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal(err)
    }
}
