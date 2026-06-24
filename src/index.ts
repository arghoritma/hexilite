import HyperExpress from "hyper-express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Routers from "./routes";
import { checkDatabaseConnection } from "./config/database";
import { RedisService } from "./services/redis";
import { WebSocketService } from "./services/websocket";

dotenv.config();

const app = new HyperExpress.Server();

app.use(async (req, res) => {
  if (req.headers["content-type"]?.includes("application/json")) {
    (req as any).body = await req.json();
  }
});

app.use("/api", Routers);

const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api")) return next();
    const filePath = req.path === "/" ? "/index.html" : req.path;
    const fullPath = path.join(publicDir, filePath);
    if (!fullPath.startsWith(publicDir)) return next();
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).slice(1);
        if (ext) res.type(ext);
        res.send(content);
      } else {
        next();
      }
    } catch {
      next();
    }
  });
}

const PORT = parseInt(process.env.PORT || "3000", 10);

const wsService = new WebSocketService(app);

export { wsService };

const redisService = new RedisService();

(async () => {
  if (await redisService.isReallyAvailable()) {
    console.log("⚡ Redis connected successfully");
  } else {
    console.warn("⚠️ Redis connection failed - continuing without Redis");
  }
  await checkDatabaseConnection();
})();

app
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server attached.`);
  })
  .catch((error: any) => {
    console.error(
      `Failed to start server on port ${PORT}:`,
      error?.message || error,
    );
    process.exit(1);
  });
