_clean-galaxy:
    rm galaxy/bin/galaxy

_clean-pathfinder:
    cargo clean --manifest-path ./pathfinder/Cargo.toml     

_clean-viz:
    rm -f ./viz/build/*
    rmdir ./viz/build 2>/dev/null || true

_clean-proto-go:
    rm -f ./galaxy/genproto/*
    rmdir ./galaxy/genproto 2>/dev/null || true

clean-all: _clean-galaxy _clean-proto-go _clean-pathfinder _clean-viz

_build-galaxy:
    go build -C galaxy -o bin/galaxy .

_build-pathfinder:
    cargo build --quiet --manifest-path ./pathfinder/Cargo.toml

_build-viz:
    npm run build:client --prefix ./viz    

_build-proto-go: _clean-proto-go
    mkdir ./galaxy/genproto/
    protoc -I proto --go_out=./galaxy/genproto --go_opt=paths=source_relative proto/types.proto

build-all: _build-proto-go _build-galaxy _build-pathfinder _build-viz

run-galaxy:
    go run -C galaxy .

run-pathfinder:
    cargo run --manifest-path ./pathfinder/Cargo.toml

run-viz:
    npm start --prefix ./viz    

