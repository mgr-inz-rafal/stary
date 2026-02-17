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

func (s *Server) Serve() error {
	r := gin.Default()
	r.Use(cors.Default())
	r.SetTrustedProxies(nil)
	api := r.Group("/api/v1")
	{
		api.GET("/galaxy", s.handleGetPoint)
	}
	log.Println("Server starting on port 8081")
	return r.Run(":8081")
}
