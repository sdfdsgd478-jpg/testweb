const https = require("https"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  zlib = require("zlib"),
  port = process.argv[2] || 8443,
  mimeTypes = {
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    js: "text/javascript",
    wasm: "application/wasm",
    css: "text/css",
    gz: "application/gzip",
  };

// Generate self-signed certificate for development
const { execSync } = require('child_process');

function generateSelfSignedCert() {
  const keyPath = './server.key';
  const certPath = './server.crt';
  
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating self-signed certificate...');
    try {
      execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=34.222.216.56"`);
      console.log('Self-signed certificate generated successfully');
    } catch (error) {
      console.error('Error generating certificate:', error.message);
      process.exit(1);
    }
  }
  
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
}

const sslOptions = generateSelfSignedCert();

// Cache for compressed files
const compressionCache = new Map();

function compressFile(filePath, content) {
  if (compressionCache.has(filePath)) {
    return compressionCache.get(filePath);
  }
  
  const compressed = zlib.gzipSync(content);
  compressionCache.set(filePath, compressed);
  return compressed;
}

https
  .createServer(sslOptions, function (request, response) {
    const uri = url.parse(request.url).pathname;
    let filename = path.join(process.cwd(), uri);

    fs.exists(filename, function (exists) {
      if (!exists) {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) filename += "/index.html";

      fs.readFile(filename, function (err, file) {
        if (err) {
          response.writeHead(500, {
            "Content-Type": "text/plain",
            "Cross-Origin-Opener-Policy": "same-origin unsafe-allow-outgoing",
          });
          response.write(err + "\n");
          response.end();
          return;
        }

        let mimeType = mimeTypes[filename.split(".").pop()];
        if (!mimeType) {
          mimeType = "text/plain";
        }

        // Check if client accepts gzip compression
        const acceptEncoding = request.headers['accept-encoding'] || '';
        const shouldCompress = acceptEncoding.includes('gzip') && 
                              (filename.endsWith('.wasm') || filename.endsWith('.js') || 
                               filename.endsWith('.html') || filename.endsWith('.css'));

        if (shouldCompress) {
          const compressed = compressFile(filename, file);
          response.writeHead(200, {
            "Content-Type": mimeType,
            "Content-Encoding": "gzip",
            "Content-Length": compressed.length,
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cache-Control": "public, max-age=31536000", // 1 year cache for static assets
          });
          response.write(compressed);
        } else {
          response.writeHead(200, {
            "Content-Type": mimeType,
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cache-Control": "public, max-age=31536000",
          });
          response.write(file);
        }
        response.end();
      });
    });
  })
  .listen(parseInt(port, 10), '0.0.0.0');

console.log(
  "HTTPS Static file server with compression running at\n  => https://34.222.216.56:" +
    port +
    "/\n  => https://localhost:" +
    port +
    "/\nCTRL + C to shutdown"
);
