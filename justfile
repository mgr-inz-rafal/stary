_start-nginx:
    docker compose up nginx

_stop-nginx:
    docker compose down nginx

_clean-galaxy:
    rm galaxy/bin/galaxy

_clean-pathfinder:
    cargo clean --manifest-path ./pathfinder/Cargo.toml     

_clean-viz-backend:
    cargo clean --manifest-path ./viz-backend/Cargo.toml

_clean-viz: _stop-nginx
    rm -f ./viz/genproto/*
    rmdir ./viz/genproto 2>/dev/null || true
    rm -f ./viz/build/*
    rmdir ./viz/build 2>/dev/null || true

_clean-proto-go:
    rm -f ./galaxy/genproto/*
    rmdir ./galaxy/genproto 2>/dev/null || true

_clean-proto-ts:
    rm -f ./viz/genproto/*
    rmdir ./viz/genproto 2>/dev/null || true

clean-all: _clean-galaxy _clean-pathfinder _clean-viz _clean-proto-go _clean-proto-ts _clean-viz-backend

_build-galaxy:
    go build -C galaxy -o bin/galaxy .

_build-pathfinder:
    cargo build --quiet --manifest-path ./pathfinder/Cargo.toml

_build-viz-backend:
    cargo build --quiet --manifest-path ./viz-backend/Cargo.toml

_build-viz:
    npm run build:client --prefix ./viz

_build-storyteller:
    cd storyteller && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    pip install -r requirements.txt
    
_build-proto-ts: _clean-proto-ts
    mkdir ./viz/genproto/
    protoc -I proto --plugin=./viz/node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./viz/genproto --ts_proto_opt=esModuleInterop=true proto/types.proto

_build-proto-go: _clean-proto-go
    mkdir ./galaxy/genproto/
    protoc -I proto --go_out=./galaxy/genproto --go_opt=paths=source_relative proto/types.proto

build-all: _build-proto-go _build-proto-ts _build-galaxy _build-pathfinder _build-viz _build-viz-backend

run-galaxy:
    go run -C galaxy .

run-pathfinder:
    cargo run --manifest-path ./pathfinder/Cargo.toml

run-viz-backend:
    cargo run --manifest-path ./viz-backend/Cargo.toml

run-viz: _start-nginx

run-storyteller:
    cd storyteller && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    uvicorn server:app --reload --port 8083