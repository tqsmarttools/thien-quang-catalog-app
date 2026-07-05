const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 4273);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function safeResolve(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const target = cleanPath === "" ? "index.html" : cleanPath;
  const resolved = path.resolve(ROOT, target);
  return resolved.startsWith(ROOT) ? resolved : null;
}

const server = http.createServer((req, res) => {
  const resolved = safeResolve(req.url || "/");
  if (!resolved) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let filePath = resolved;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      if (!path.extname(filePath)) {
        const fallback = path.join(ROOT, "index.html");
        fs.readFile(fallback, (fallbackError, fallbackBuffer) => {
          if (fallbackError) {
            res.writeHead(500);
            res.end("Internal Server Error");
            return;
          }
          res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
          res.end(fallbackBuffer);
        });
        return;
      }

      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not Found" : "Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(buffer);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Thiên Quang Catalog App available at http://127.0.0.1:${PORT}`);
});
