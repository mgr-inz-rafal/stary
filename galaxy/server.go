package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"google.golang.org/protobuf/proto"
)

type Server struct {
	world *World
}

func (s *Server) handleGetGalaxy(c *gin.Context) {
	accept := c.GetHeader("Accept")

	if accept == "application/x-protobuf" {
		data, err := proto.Marshal(s.world.galaxy)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.Data(http.StatusOK, "application/x-protobuf", data)
		return
	}

	c.JSON(http.StatusOK, s.world.galaxy)
}

func (s *Server) Serve() error {
	r := gin.Default()
	r.Use(cors.Default())
	r.SetTrustedProxies(nil)
	api := r.Group("/api/v1")
	{
		api.GET("/galaxy", s.handleGetGalaxy)
	}
	log.Println("Server starting on port 8081")
	return r.Run(":8081")
}
