const https = require("https"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  port = process.argv[2] || 8443,
  mimeTypes = {
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    js: "text/javascript",
    wasm: "application/wasm",
    css: "text/css",
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

      fs.readFile(filename, "binary", function (err, file) {
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

        response.writeHead(200, {
          "Content-Type": mimeType,
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        });
        response.write(file, "binary");
        response.end();
      });
    });
  })
  .listen(parseInt(port, 10), '0.0.0.0');

console.log(
  "HTTPS Static file server running at\n  => https://34.222.216.56:" +
    port +
    "/\n  => https://localhost:" +
    port +
    "/\nCTRL + C to shutdown"
);
