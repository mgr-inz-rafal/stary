package main

import (
	"galaxy/genproto"
	"log"
	"math/rand/v2"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins as this is a publicly accessible API
		return true
	},
}

type Server struct {
	world *World
	hub   *Hub
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

func (s *Server) handleWebSocket(c *gin.Context) {
	log.Println("Inside handleWebSocket")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte, 16),
	}
	s.hub.register <- client
	log.Println("Registered client:", client)

	// If we broadcast into "client.send" in the Hub, it will be send to this client through the wire
	go func() {
		defer func() {
			s.hub.unregister <- client
			log.Println("Unregistered client:", client)
			conn.Close()
		}()
		for msg := range client.send {
			log.Println("Sending message through the wire")
			if err := conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
				return
			}
		}
	}()

	// The keepalive loop
	go func() {
		defer func() {
			s.hub.unregister <- client
			log.Println("Unregistered client:", client)
			conn.Close()
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()
}

func (s *Server) Serve() error {
	r := gin.Default()
	r.Use(cors.Default())
	r.SetTrustedProxies(nil)

	go s.hub.Run()

	api := r.Group("/api/v1")
	{
		api.GET("/galaxy", s.handleGetGalaxy)
		api.GET("/ws", s.handleWebSocket)
		api.GET("/debug/triggerWeatherChange", func(c *gin.Context) {
			broadCastRandomWeather(s.world, s)
			c.Status(http.StatusNoContent)
		})
	}
	log.Println("Server starting on port 8081")
	return r.Run(":8081")
}

func (s *Server) startWeatherLoop(w *World) {
	log.Println("Weather loop started")
	for {
		random_second_count := (rand.IntN(5) + 3)
		duration := time.Duration(random_second_count) * time.Second
		time.Sleep(duration)

		broadCastRandomWeather(w, s)
	}
}

func broadCastRandomWeather(w *World, s *Server) {
	random_star_id := w.GetRandomStarId()
	random_weather := GetRandomWeather()
	log.Println("Broadcasting weather change: star=", random_star_id, "weather=", random_weather)
	event := genproto.StarWeather{
		StarId:  &random_star_id,
		Weather: &random_weather,
	}
	data, err := proto.Marshal(&event)
	log.Println("Marshaled bytes:", data, "len:", len(data), "err:", err)
	s.hub.Broadcast(data)
}
