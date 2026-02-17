package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

type Server struct {
	world *World
}

func (s *Server) handleGetPoint(c *gin.Context) {
	c.JSON(http.StatusOK, s.world.galaxy)
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next(w, r)
	}
}

func (s *Server) Serve() error {
	r := gin.Default()
	r.Use(cors.Default())
	r.SetTrustedProxies(nil)
	r.GET("/", s.handleGetPoint)

	log.Println("Server starting on port 8081")
	return r.Run(":8081")
}
