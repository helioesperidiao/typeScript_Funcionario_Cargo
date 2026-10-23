// src/logging/HttpLogger.ts
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { createLogger } from "./Logger";
import { requestStore } from "./requestStore";

const log = createLogger("HTTP");

const STATIC_EXTENSIONS = /\.(html?|css|js|mjs|map|ico|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|otf|pdf|txt|xml|json)$/i;

const isStaticAsset = (req: Request): boolean => {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    return STATIC_EXTENSIONS.test(req.path);
};

export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (isStaticAsset(req)) {
        return next();
    }

    const requestId = randomUUID().slice(0, 8);
    res.setHeader("X-Request-Id", requestId);

    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const meta = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
        };

        if (res.statusCode >= 500) log.error("request failed", meta);
        else if (res.statusCode >= 400) log.warn("request error", meta);
        else log.http("request", meta);
    });

    // Abre o contexto — tudo que rodar a partir de next() vê o mesmo requestId
    requestStore.run({ requestId, step: 0 }, () => next());

};