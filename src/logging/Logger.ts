// src/logging/Logger.ts
import 'dotenv/config';
import winston from "winston";
import { requestStore } from "./requestStore";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

// Injeta requestId + número de sequência em cada linha do request
const injectRequestId = winston.format((info) => {
    const ctx = requestStore.getStore();
    if (ctx) {
        info.requestId = ctx.requestId;
        ctx.step += 1;
        info.step = String(ctx.step).padStart(2, "0");
    }
    return info;
});

export const Logger = winston.createLogger({
    level: logLevel,
    levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
    format: isProduction
        ? winston.format.combine(
              injectRequestId(),
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
          )
        : winston.format.combine(
              injectRequestId(),
              winston.format.colorize({ level: true }),
              winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
              winston.format.printf((info: any) => {
                  const { level, message, timestamp, layer, requestId, step, ...meta } = info;
                  const rid = requestId ? `[${requestId}] ` : "";
                  const stepTag = step ? `#${step} ` : "";
                  const layerTag = layer ? `[${layer}]` : "";
                  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
                  return `${timestamp} ${level} ${rid}${stepTag}${layerTag} ${message}${extra}`;
              })
          ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/app.log" }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    ],
    exitOnError: false,
});

export const createLogger = (layer: string) => Logger.child({ layer });