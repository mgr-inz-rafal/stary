package main

import (
	"galaxy/genproto"
	"math/rand/v2"
)

type World struct {
	galaxy *genproto.Galaxy
}

func RandomStar() *genproto.Star {
	offset := rand.Int32N(MaxStarOffset*2) - MaxStarOffset

	x := rand.Int32N(MaxX)
	y := rand.Int32N(MaxY)

	return &genproto.Star{
		Pos: &genproto.Point2D{
			X: x,
			Y: y,
		},
		Z: int32(offset),
	}
}

func NewGalaxy() *genproto.Galaxy {
	num_stars := rand.Int32N(MaxStars-MinStars) + MinStars

	galaxy := &genproto.Galaxy{}
	for i := 0; i < int(num_stars); i++ {
		galaxy.Stars = append(galaxy.Stars, RandomStar())
	}

	return galaxy
}
