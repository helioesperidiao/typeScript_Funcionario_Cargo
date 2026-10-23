// ============================================================================
// src/index.ts
// ============================================================================
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "./Server";
import { createLogger } from "./logging/Logger";

const log = createLogger("Bootstrap");

const startServer = async (): Promise<void> => {
    try {
        const rawPort = process.env.PORT;
        const parsedPort = rawPort ? parseInt(rawPort, 10) : NaN;
        const PORT: number = !Number.isNaN(parsedPort) ? parsedPort : 3000;

        const server = new Server(PORT);
        await server.init();
        server.run();
    } catch (error) {
        log.error("falha ao iniciar o servidor", { error });
        process.exit(1);
    }
};

startServer();