#!/bin/sh -ex

# look at DeepFilterNet/.github/workflows/build_wasm.yml for enviroment setup
cd ./libDF/

# Set Rust flags to enable WASM SIMD instructions and optimize for size.
export RUSTFLAGS="-C target-feature=+simd128,+bulk-memory -C opt-level=z -C link-arg=-s"

wasm-pack build --target no-modules --no-typescript --features "wasm"
