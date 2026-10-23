import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioDAO");

export class FuncionarioDAO {
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
                        { email: 1 },
                        { unique: true, name: "email_unique" }
                    );
                } catch (err: any) {
                    log.warn("índice único de email não criado", { error: err?.message });
                }
            })();
        }
        return this._indexesPromise;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        const col = db.collection("funcionario");
        await this.ensureIndexes(col);
        return col;
    }

    // ======================== CRUD ========================

    public async create(objFuncionarioModel: Funcionario): Promise<Funcionario> {
        log.debug("create()", { email: objFuncionarioModel.email });
        const collection = await this.getCollection();

        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }

        const senha = (objFuncionarioModel as any)._senha || objFuncionarioModel.senha || '';

        const doc: OptionalId<Document> = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            senha,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
            cargoId: new ObjectId(objFuncionarioModel.cargo.idCargo),
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir funcionário");
        }

        objFuncionarioModel.idFuncionario = result.insertedId.toHexString();
        log.info("funcionário inserido", {
            idFuncionario: objFuncionarioModel.idFuncionario,
            email: objFuncionarioModel.email,
            cargoId: objFuncionarioModel.cargo.idCargo,
        });
        return objFuncionarioModel;
    }

    public async delete(objFuncionarioModel: Funcionario): Promise<boolean> {
        log.debug("delete()", { idFuncionario: objFuncionarioModel.idFuncionario });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };
        const result = await collection.deleteOne(filter);
        const ok = result.deletedCount > 0;
        if (ok) log.info("funcionário removido", { idFuncionario: objFuncionarioModel.idFuncionario });
        else log.warn("funcionário não encontrado para remoção", { idFuncionario: objFuncionarioModel.idFuncionario });
        return ok;
    }

    public async update(objFuncionarioModel: Funcionario): Promise<boolean> {
        log.debug("update()", { idFuncionario: objFuncionarioModel.idFuncionario });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };

        const updateData: any = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
        };

        const senha = (objFuncionarioModel as any)._senha || objFuncionarioModel.senha;
        if (senha) {
            updateData.senha = senha;
        }

        if (objFuncionarioModel.cargo?.idCargo) {
            updateData.cargoId = new ObjectId(objFuncionarioModel.cargo.idCargo);
        }

        const update: UpdateFilter<Document> = { $set: updateData };
        const result = await collection.updateOne(filter, update);
        const matched = result.matchedCount > 0;
        if (!matched) log.warn("funcionário não encontrado para atualização", { idFuncionario: objFuncionarioModel.idFuncionario });
        return matched;
    }

    // ======================== CONSULTAS ========================

    public async findAll(): Promise<Funcionario[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();

        const pipeline = [
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            { $unwind: { path: "$cargoInfo", preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const docs = await collection.aggregate(pipeline).toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    public async findById(idFuncionario: string): Promise<Funcionario | null> {
        log.debug("findById()", { idFuncionario });
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idFuncionario) };

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            { $unwind: { path: "$cargoInfo", preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const docs = await collection.aggregate(pipeline).toArray();
        if (docs.length === 0) return null;
        return this.toFuncionario(docs[0]);
    }

    public async findByField(field: string, value: any): Promise<Funcionario[]> {
        const allowedFields = ["_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }

        const collection = await this.getCollection();
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = { _id: new ObjectId(value) };
        } else {
            filter = { [field]: value };
        }

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            { $unwind: { path: "$cargoInfo", preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const docs = await collection.aggregate(pipeline).toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    /** Usado apenas no login: inclui a senha (hash) para comparação com bcrypt. */
    public async findByEmail(email: string): Promise<Funcionario | null> {
        log.debug("findByEmail()", { email });
        const collection = await this.getCollection();

        const pipeline = [
            { $match: { email } },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            { $unwind: { path: "$cargoInfo", preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const docs = await collection.aggregate(pipeline).toArray();
        if (docs.length === 0) return null;
        return this.toFuncionario(docs[0]);
    }

    // ======================== CONTAGENS ========================

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }

    public async countByCargoId(cargoId: string): Promise<number> {
        log.debug("countByCargoId()", { cargoId });
        const collection = await this.getCollection();
        return await collection.countDocuments({ cargoId: new ObjectId(cargoId) });
    }

    // ======================== AUXILIAR ========================

    private toFuncionario(doc: any): Funcionario {
        const cargo = new Cargo();
        cargo.idCargo = doc.cargo.idCargo.toHexString ? doc.cargo.idCargo.toHexString() : doc.cargo.idCargo;
        cargo.nomeCargo = doc.cargo.nomeCargo;

        const funcionario = new Funcionario();
        funcionario.idFuncionario = doc.idFuncionario.toHexString ? doc.idFuncionario.toHexString() : doc.idFuncionario;
        funcionario.nomeFuncionario = doc.nomeFuncionario;
        funcionario.email = doc.email;
        (funcionario as any)._senha = doc.senha || '';
        funcionario.recebeValeTransporte = doc.recebeValeTransporte;
        funcionario.cargo = cargo;

        return funcionario;
    }
}