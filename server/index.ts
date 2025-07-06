import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./database";
import { restackService } from "../src/services/restackService.js";

const app = express();

// Security and CORS for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  
  // CORS configuration
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin || '')) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database before starting server
  await initializeDatabase();
  
  // Initialize Restack AI service
  try {
    await restackService.initialize();
    log(`✅ Restack AI service initialized`);
  } catch (error) {
    log(`⚠️ Restack AI service initialization failed: ${error.message}`);
    log(`📝 App will continue without Restack AI features`);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment variables for Restack.io compatibility
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  
  server.listen({
    port,
    host,
  }, () => {
    log(`🚀 AsphaltTracker serving on ${host}:${port}`);
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🔗 Health check: http://${host}:${port}/health`);
    log(`🤖 Restack AI: ${restackService.getHealthStatus().initialized ? 'Enabled' : 'Disabled'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    log('🛑 SIGTERM received, shutting down gracefully...');
    await restackService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log('🛑 SIGINT received, shutting down gracefully...');
    await restackService.shutdown();
    process.exit(0);
  });
})();
