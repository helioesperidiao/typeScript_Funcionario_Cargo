import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoDAO");

export class CargoDAO {
    private _database: MongoDatabase;
    private _indexesPromise: Promise<void> | null = null;

    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    private async ensureIndexes(collection: Collection<Document>): Promise<void> {
        if (!this._indexesPromise) {
            this._indexesPromise = (async () => {
                try {
                    await collection.createIndex(
                        { nomeCargo: 1 },
                        {
                            unique: true,
                            name: "nomeCargo_unique_ci",
                            collation: { locale: "pt", strength: 2 }
                        }
                    );
                } catch (err: any) {
                    log.warn("índice único de nomeCargo não criado", { error: err?.message });
                }
            })();
        }
        return this._indexesPromise;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        const col = db.collection("cargo");
        await this.ensureIndexes(col);
        return col;
    }

    private escapeRegex(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    public async create(cargo: Cargo): Promise<Cargo> {
        log.debug("create()", { nomeCargo: cargo.nomeCargo });
        const collection = await this.getCollection();
        const doc: OptionalId<Document> = { nomeCargo: cargo.nomeCargo };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }
        cargo.idCargo = result.insertedId.toString();
        log.info("cargo inserido", { idCargo: cargo.idCargo, nomeCargo: cargo.nomeCargo });
        return cargo;
    }

    public async delete(objCargoModel: Cargo): Promise<boolean> {
        log.debug("delete()", { idCargo: objCargoModel.idCargo });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const result = await collection.deleteOne(filter);
        const ok = result.deletedCount > 0;
        if (ok) log.info("cargo removido", { idCargo: objCargoModel.idCargo });
        else log.warn("cargo não encontrado para remoção", { idCargo: objCargoModel.idCargo });
        return ok;
    }

    public async update(objCargoModel: Cargo): Promise<boolean> {
        log.debug("update()", { idCargo: objCargoModel.idCargo });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = { $set: { nomeCargo: objCargoModel.nomeCargo } };
        const result = await collection.updateOne(filter, update);
        return result.matchedCount > 0;
    }

    public async findAll(): Promise<Cargo[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const docs = await collection.find({}).toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    public async findById(idCargo: string): Promise<Cargo | null> {
        log.debug("findById()", { idCargo });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idCargo) };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }

    public async findByField(field: string, value: any): Promise<Cargo[]> {
        const allowedFields = ["_id", "nomeCargo"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }

        const collection = await this.getCollection();
        let filter: Filter<Document> = {};

        if (field === "_id") {
            filter = { _id: new ObjectId(value) };
        } else if (field === "nomeCargo") {
            filter = {
                nomeCargo: { $regex: `^${this.escapeRegex(String(value))}$`, $options: "i" }
            };
        } else {
            filter = { [field]: value };
        }

        const docs = await collection.find(filter).toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }

    private toCargo(doc: any): Cargo {
        const cargo = new Cargo();
        cargo.idCargo = doc._id.toHexString();
        cargo.nomeCargo = doc.nomeCargo;
        return cargo;
    }
}