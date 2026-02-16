_clean-galaxy:
    rm galaxy/bin/galaxy

_clean-proto-go:
    rm -f ./galaxy/genproto/*
    rmdir ./galaxy/genproto 2>/dev/null || true

clean-all: _clean-galaxy _clean-proto-go

_build-galaxy:
    go build -C galaxy -o bin/galaxy .

build-all: _gen-proto-go _build-galaxy

run-galaxy:
    go run -C galaxy .

_gen-proto-go: _clean-proto-go
    mkdir ./galaxy/genproto/
    protoc -I proto --go_out=./galaxy/genproto --go_opt=paths=source_relative proto/point.proto

