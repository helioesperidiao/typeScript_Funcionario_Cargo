import { Funcionario } from "../models/Funcionario";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class FuncionarioDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(objFuncionarioModel: Funcionario): Promise<Funcionario>;
    delete(objFuncionarioModel: Funcionario): Promise<boolean>;
    update(objFuncionarioModel: Funcionario): Promise<boolean>;
    findAll(): Promise<Funcionario[]>;
    findById(idFuncionario: string): Promise<Funcionario | null>;
    findByField(field: string, value: any): Promise<Funcionario[]>;
    findByEmail(email: string): Promise<Funcionario | null>;
    count(): Promise<number>;
    countByCargoId(cargoId: string): Promise<number>;
    private toFuncionario;
}
//# sourceMappingURL=FuncionarioDAO.d.ts.map