import { CargoDAO } from "../dao/CargoDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
export declare class CargoService {
    private _cargoDAO;
    constructor(cargoDAODependency: CargoDAO);
    create: (cargo: Cargo, funcionarioLogado: Funcionario) => Promise<Cargo>;
    findAll: (_funcionarioLogado: Funcionario) => Promise<Cargo[]>;
    findById: (idCargo: string, _funcionarioLogado: Funcionario) => Promise<Cargo | null>;
    update: (cargo: Cargo, _funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (cargo: Cargo, _funcionarioLogado: Funcionario) => Promise<boolean>;
    count: (_funcionarioLogado: Funcionario) => Promise<number>;
}
//# sourceMappingURL=CargoService.d.ts.map