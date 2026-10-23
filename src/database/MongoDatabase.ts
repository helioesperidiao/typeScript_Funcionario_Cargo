import { MongoClient, Db, MongoClientOptions } from "mongodb";
import dotenv from "dotenv";
import { createLogger } from "../logging/Logger";

dotenv.config();

const log = createLogger("MongoDatabase");

export class MongoDatabase {
    private static _client: MongoClient | null = null;
    private static _db: Db | null = null;

    private _uri: string;
    private _databaseName: string;
    private _options: MongoClientOptions;

    constructor(config: { uri?: string; database?: string; options?: MongoClientOptions } = {}) {
        const envUri = process.env.MONGO_URI;
        const envDatabase = process.env.MONGO_DATABASE;
        const envMaxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE || '');
        const envMinPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE || '');
        const envConnectTimeout = parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS || '');
        const envSocketTimeout = parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '');

        this._uri = config.uri || envUri || "mongodb://localhost:27017";
        this._databaseName = config.database || envDatabase || "faltas_cti";

        this._options = {
            maxPoolSize: config.options?.maxPoolSize || (isNaN(envMaxPoolSize) ? 50 : envMaxPoolSize),
            minPoolSize: config.options?.minPoolSize || (isNaN(envMinPoolSize) ? 10 : envMinPoolSize),
            connectTimeoutMS: config.options?.connectTimeoutMS || (isNaN(envConnectTimeout) ? 5000 : envConnectTimeout),
            socketTimeoutMS: config.options?.socketTimeoutMS || (isNaN(envSocketTimeout) ? 45000 : envSocketTimeout),
            ...config.options,
        };

        log.debug("configurado", {
            uri: this._uri,
            database: this._databaseName,
            maxPoolSize: this._options.maxPoolSize,
            minPoolSize: this._options.minPoolSize,
        });
    }

    public async connect(): Promise<MongoClient> {
        if (!MongoDatabase._client) {
            try {
                MongoDatabase._client = new MongoClient(this._uri, this._options);
                await MongoDatabase._client.connect();
                MongoDatabase._db = MongoDatabase._client.db(this._databaseName);
                log.info("conectado ao MongoDB", { database: this._databaseName });
            } catch (error: any) {
                log.error("falha ao conectar ao MongoDB", { error: error.message });
                process.exit(1);
            }
        }
        return MongoDatabase._client;
    }

    public async getClient(): Promise<MongoClient> {
        return await this.connect();
    }

    public async getDb(): Promise<Db> {
        await this.connect();
        return MongoDatabase._db!;
    }

    public async close(): Promise<void> {
        if (MongoDatabase._client) {
            await MongoDatabase._client.close();
            MongoDatabase._client = null;
            MongoDatabase._db = null;
            log.info("conexão com MongoDB fechada");
        }
    }
}