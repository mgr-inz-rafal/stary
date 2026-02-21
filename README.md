# Star-y

This is a little pet project to explore ways of interoperability between services written in different languages where protobuf is used on wire. This is in a very early, PoC state and shouldn't be used as a base for any production-grade projects. 

## Disclaimer
Many corners have been cut during the development as I was mostly focusing on getting the functionality done.

## Services
Currently it consists of the following elements:

1. `viz` [**TypeScript**] - Visualization Service
2. `galaxy` [**Go**] - Generates stars, connects them with Hyperlines using Minimum Spanning Tree. Broadcasts the Galaxy Weather Change events via WebSocket.
3. `pathfinder` [**Rust**] - (_In progress_) Service to look for the shortest path in between two stars
4. `storyteller` [**Python**] - Uses the Anthropic LLM to generate a story for a given galaxy
5. `viz-backend` [**Rust**] - Backend for the GUI App (`viz`). `storyteller` can be accessed by `viz-backend` only, after proper authentication

Additional stuff
1. `nginx` - Config file for nginx which is used to serve the frontend
2. `proto` - Protobuf definition file

## Auxiliary notes
### Ports

`viz` - 8080

`galaxy` - 8081

`pathfinder` - 8082

`storyteller` - 8083

`viz-backend` - 8084

### Tools

#### TypeScript
```
npm install --save-dev ts-proto
```

#### Python
```
pip install uvicorn
pip install fastapi
pip install httpx
```

#### Other dependencies
```
apt-get install libnss3-tools
```

### Curl
```
curl -i -X POST http://localhost:8084/login   -H "Content-Type: application/json"   -d '{"username":"admin","password":"*****"}
```

```
curl -i -X GET http://localhost:8084/api/v1/story/new   -H "Authorization: Bearer XXX.YYY.ZZZ"
```

Connect to Weather websocket in Galaxy service:
```
websocat ws://localhost:8081/api/v1/ws
```

Trigger debug weather change event:
```
curl http://localhost:8081/api/v1/debug/triggerWeatherChange
```

