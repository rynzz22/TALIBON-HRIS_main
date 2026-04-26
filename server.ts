import "reflect-metadata";
import express from "express";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { createServer as createViteServer } from "vite";
import path from "path";
import { AppModule } from "./src/server/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn", "log", "debug", "verbose"] });
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use((req: any, res: any, next: any) => {
      if (req.url.startsWith("/api")) return next();
      vite.middlewares(req, res, next);
    });
  } else {
    const expressApp = app.getHttpAdapter().getInstance();
    const distPath = path.join(process.cwd(), "dist");
    expressApp.use(express.static(distPath));
    expressApp.get("*", (req: any, res: any, next: any) => {
      if (req.url.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await app.listen(port, "0.0.0.0", () => {
    Logger.log(`HRIS API online at port ${port}`, "Bootstrap");
  });
}

bootstrap();
