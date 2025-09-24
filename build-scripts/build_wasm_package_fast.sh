#!/bin/sh -ex

# Ultra-optimized build for fast loading
cd ./libDF/

# Set Rust flags for maximum size optimization and performance
export RUSTFLAGS="-C target-feature=+simd128,+bulk-memory -C opt-level=z -C link-arg=-s -C link-arg=--gc-sections -C link-arg=--strip-all"

# Build with maximum optimizations
wasm-pack build --target no-modules --no-typescript --features "wasm"

# Check if wasm-opt is available and use it for additional size reduction
if command -v wasm-opt >/dev/null 2>&1; then
    echo "Running wasm-opt for additional size reduction..."
    wasm-opt pkg/df_bg.wasm -o pkg/df_bg.wasm -Oz --enable-simd --enable-bulk-memory --strip-debug --strip-producers
else
    echo "wasm-opt not found, skipping post-processing"
fi

echo "Fast-loading WASM package built successfully!"
