# DeepFilterNet Optimized - Multi-Mode WASM Demo

A high-performance web demo of DeepFilterNet with three optimization modes, featuring SIMD optimizations, fast loading, and real-time audio processing.

## 🚀 Features

### Three Optimization Modes
- **Original (8.9MB)** - Standard WASM build
- **Optimized (5.2MB)** - SIMD + size optimizations (42% smaller)
- **Fast Loading (5.2MB)** - Ultra-optimized with additional flags

### Performance Improvements
- **42% smaller file size** with SIMD optimizations
- **85% smaller download** with gzip compression (5.2MB → 1.3MB)
- **Real-time mode switching** without page reload
- **Loading progress indicators** with detailed status
- **Browser caching** for instant repeat loads

### Technical Features
- HTTPS server with self-signed certificates
- SharedArrayBuffer support for high-performance audio processing
- Web Workers for non-blocking audio processing
- AudioWorklet integration
- Cross-origin isolation headers

## 📁 Project Structure

```
deepfilternet-optimized/
├── web-demo/                    # Web application
│   ├── index.html              # Main demo page
│   ├── script.js               # Application logic
│   ├── worker.js               # Web Worker for audio processing
│   ├── audio-processor.js      # AudioWorklet processor
│   ├── ringbuffer.js           # Ring buffer implementation
│   ├── utils.js                # Utility functions
│   ├── https_server.js         # HTTPS server
│   ├── https_server_compressed.js # Server with gzip compression
│   ├── pkg/                    # Original WASM package (8.9MB)
│   ├── pkg_optimized/          # SIMD optimized package (5.2MB)
│   └── pkg_fast/               # Ultra-optimized package (5.2MB)
├── build-scripts/              # Build scripts for all modes
│   ├── build_wasm_package.sh           # Original build
│   ├── build_wasm_package_optimized.sh # SIMD optimized build
│   └── build_wasm_package_fast.sh      # Ultra-optimized build
└── README.md                   # This file
```

## 🛠️ Build Scripts

### Original Build
```bash
bash build-scripts/build_wasm_package.sh
```
- Standard WASM build
- 8.9MB file size
- Compatible with all browsers

### Optimized Build
```bash
bash build-scripts/build_wasm_package_optimized.sh
```
- SIMD instructions enabled
- Size optimizations
- 5.2MB file size (42% smaller)

### Fast Loading Build
```bash
bash build-scripts/build_wasm_package_fast.sh
```
- Maximum size optimization
- Additional linker flags
- 5.2MB file size with better compression

## 🚀 Quick Start

### Prerequisites
- Node.js (for the web server)
- Rust and wasm-pack (for building WASM packages)
- Modern browser with SharedArrayBuffer support

### Running the Demo

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd deepfilternet-optimized
   ```

2. **Start the HTTPS server**
   ```bash
   cd web-demo
   node https_server.js
   ```

3. **Access the demo**
   - Open `https://localhost:8443/` in your browser
   - Accept the self-signed certificate warning
   - Select optimization mode from dropdown
   - Click "Toggle Sound" to start audio processing

### Building from Source

1. **Clone DeepFilterNet repository**
   ```bash
   git clone https://github.com/Rikorose/DeepFilterNet.git
   cd DeepFilterNet
   ```

2. **Copy build scripts**
   ```bash
   cp ../deepfilternet-optimized/build-scripts/* scripts/
   ```

3. **Build optimized packages**
   ```bash
   bash scripts/build_wasm_package_optimized.sh
   bash scripts/build_wasm_package_fast.sh
   ```

4. **Copy packages to web demo**
   ```bash
   cp -r libDF/pkg ../deepfilternet-optimized/web-demo/pkg_optimized/
   cp -r libDF/pkg ../deepfilternet-optimized/web-demo/pkg_fast/
   ```

## 🔧 Configuration

### Cargo.toml Optimizations
The build scripts include these optimizations:
```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
```

### Rust Flags
```bash
RUSTFLAGS="-C target-feature=+simd128,+bulk-memory -C opt-level=z -C link-arg=-s"
```

## 📊 Performance Comparison

| Mode | File Size | Download Size | Performance |
|------|-----------|---------------|-------------|
| Original | 8.9MB | 8.9MB | Baseline |
| Optimized | 5.2MB | 5.2MB | SIMD + 42% smaller |
| Fast Loading | 5.2MB | 1.3MB | Ultra-optimized + gzip |

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full support with SharedArrayBuffer
- **Firefox**: Full support with SharedArrayBuffer
- **Safari**: Full support with SharedArrayBuffer
- **HTTPS Required**: SharedArrayBuffer requires secure context

## 🔒 Security

- Self-signed certificates for development
- Cross-origin isolation headers
- Secure context requirements for SharedArrayBuffer

## 📝 License

Based on DeepFilterNet (MIT/Apache-2.0 license)
Original repository: https://github.com/Rikorose/DeepFilterNet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test all three optimization modes
5. Submit a pull request

## 📞 Support

For issues related to:
- **DeepFilterNet**: https://github.com/Rikorose/DeepFilterNet
- **This optimization**: Create an issue in this repository

## 🎯 Use Cases

- Real-time audio noise reduction
- Web-based audio processing
- Performance comparison studies
- WASM optimization research
- Audio processing education
