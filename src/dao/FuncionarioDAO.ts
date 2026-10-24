import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioDAO");

/** Executa consultas e alterações de funcionários no MongoDB. */
export class FuncionarioDAO {
    private _database: MongoDatabase;
    private _indexesPromise: Promise<void> | null = null;

    /** Recebe a conexão que será usada para acessar a coleção de funcionários. */
    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    /** Cria, uma única vez, o índice que torna o e-mail exclusivo. */
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

    /** Obtém a coleção de funcionários e prepara o índice necessário. */
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        const col = db.collection("funcionario");
        await this.ensureIndexes(col);
        return col;
    }

    // ======================== CRUD ========================

    /** Insere o funcionário e converte IDs de cargo para ObjectId do MongoDB. */
    public async create(objFuncionarioModel: Funcionario): Promise<Funcionario> {
        log.debug("create()", { email: objFuncionarioModel.email });
        const collection = await this.getCollection();

        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }

        // O DAO aceita o hash interno recuperado do banco ou a senha do modelo.
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

    /** Exclui o funcionário pelo ID e retorna se houve algum documento removido. */
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

    /** Atualiza somente os dados presentes no modelo, preservando senha omitida. */
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

    /** Lista funcionários e inclui os dados do cargo associado em cada resultado. */
    public async findAll(): Promise<Funcionario[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();

        // $lookup relaciona as coleções; $unwind transforma o cargo relacionado
        // em objeto único; $project escolhe os campos que serão devolvidos.
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

    /** Busca um funcionário por ID e carrega também os dados do seu cargo. */
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

    /** Pesquisa por um campo permitido e retorna os dados já associados ao cargo. */
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

    /** Conta todos os documentos da coleção de funcionários. */
    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }

    /** Conta funcionários cujo campo cargoId corresponde ao cargo informado. */
    public async countByCargoId(cargoId: string): Promise<number> {
        log.debug("countByCargoId()", { cargoId });
        const collection = await this.getCollection();
        return await collection.countDocuments({ cargoId: new ObjectId(cargoId) });
    }

    // ======================== AUXILIAR ========================

    /** Converte um documento agregado do MongoDB para os modelos da aplicação. */
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