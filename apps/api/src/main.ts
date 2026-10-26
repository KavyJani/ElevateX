import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { csrfMatches } from "./auth/session";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.use((request: any, response: any, next: (error?: unknown) => void) => {
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(
      String(request.method).toUpperCase(),
    );
    if (
      mutating &&
      String(request.path).startsWith("/api/v1/") &&
      !csrfMatches(request)
    ) {
      response.status(403).json({
        statusCode: 403,
        error: "CsrfRejected",
        message:
          "A valid same-origin CSRF token is required. Refresh and retry the action.",
      });
      return;
    }
    next();
  });
  const cfg = new DocumentBuilder()
    .setTitle("ElevateX API")
    .setDescription(
      "Founder-investor discovery, review and forecast scenarios; no investment execution.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("/api/docs", app, SwaggerModule.createDocument(app, cfg));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
}
void bootstrap();
