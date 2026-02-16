_clean-galaxy:
    rm galaxy/bin/galaxy

_clean-pathfinder:
    cargo clean --manifest-path ./pathfinder/Cargo.toml     

_clean-proto-go:
    rm -f ./galaxy/genproto/*
    rmdir ./galaxy/genproto 2>/dev/null || true

clean-all: _clean-galaxy _clean-proto-go _clean-pathfinder

_build-galaxy:
    go build -C galaxy -o bin/galaxy .

_build-pathfinder:
    cargo build --manifest-path ./pathfinder/Cargo.toml

build-all: _gen-proto-go _build-galaxy _build-pathfinder

run-galaxy:
    go run -C galaxy .

run-pathfinder:
    cargo run --manifest-path ./pathfinder/Cargo.toml

_gen-proto-go: _clean-proto-go
    mkdir ./galaxy/genproto/
    protoc -I proto --go_out=./galaxy/genproto --go_opt=paths=source_relative proto/point.proto

