import bcrypt from "bcrypt";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { MeuTokenJWT } from "../http/MeuTokenJWT";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioService");

export class FuncionarioService {
    private _funcionarioDAO: FuncionarioDAO;
    private _cargoDAO: CargoDAO;

    constructor(funcionarioDAODependency: FuncionarioDAO, cargoDAODependency: CargoDAO) {
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
    }

    public initializeDefaultAdmin = async (): Promise<Funcionario | void> => {
        log.debug("initializeDefaultAdmin()");

        const total = await this._funcionarioDAO.count();
        if (total > 0) {
            log.info("já existem funcionários cadastrados; pulando criação do admin padrão");
            return;
        }

        const cargoAdmin = await this._cargoDAO.findByField("nomeCargo", "Administrador");
        let cargoId: string;
        if (cargoAdmin && cargoAdmin.length > 0) {
            cargoId = cargoAdmin[0].idCargo;
        } else {
            const cargo = new Cargo();
            cargo.nomeCargo = "Administrador";
            const cargoCriado = await this._cargoDAO.create(cargo);
            cargoId = cargoCriado.idCargo;
            log.info("cargo Administrador criado", { idCargo: cargoId });
        }

        const adminName = process.env.DEFAULT_ADMIN_NAME || "Hélio Esperidião";
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "helioesperidiao@gmail.com";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "@Helio123456";
        const adminValeTransporte = parseInt(process.env.DEFAULT_ADMIN_VALE_TRANSPORTE || "0");

        const funcionarioAdmin = new Funcionario();
        funcionarioAdmin.nomeFuncionario = adminName;
        funcionarioAdmin.email = adminEmail;
        funcionarioAdmin.senha = await bcrypt.hash(adminPassword, 12);
        funcionarioAdmin.recebeValeTransporte = adminValeTransporte;

        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        funcionarioAdmin.cargo = cargo;

        const novoAdmin = await this._funcionarioDAO.create(funcionarioAdmin);
        log.info("administrador padrão criado", {
            idFuncionario: novoAdmin.idFuncionario,
            email: novoAdmin.email,
        });
        return novoAdmin;
    };

    public create = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<Funcionario> => {
        log.debug("create()", { email: funcionario.email });

        if (funcionarioLogado.cargo?.nomeCargo !== "Administrador") {
            log.warn("criação de funcionário negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a criar funcionários.`
            });
        }

        if (!funcionario.senha || funcionario.senha.trim() === "") {
            throw new ErrorResponse(400, "Senha é obrigatória");
        }

        const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse(400, "O cargo informado não existe");
        }

        const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um funcionário com este email");
        }

        funcionario.senha = await bcrypt.hash(funcionario.senha, 12);

        try {
            const novo = await this._funcionarioDAO.create(funcionario);
            log.info("funcionário criado", {
                idFuncionario: novo.idFuncionario,
                email: novo.email,
                cargo: novo.cargo.nomeCargo,
                criadoPor: funcionarioLogado.email,
            });
            return novo;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
            log.error("falha ao criar funcionário", { email: funcionario.email, error: err });
            throw err;
        }
    };

    public loginFuncionario = async (funcionario: Funcionario): Promise<{ user: Funcionario; token: string }> => {
        log.debug("loginFuncionario()", { email: funcionario.email });

        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            log.warn("login falhou", { email: funcionario.email, motivo: "email não encontrado" });
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        const senhaValida = await bcrypt.compare(funcionario.senha, funcionarioBanco.senha);
        if (!senhaValida) {
            log.warn("login falhou", { email: funcionario.email, motivo: "senha inválida" });
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);
        log.info("login efetuado", { idFuncionario: funcionarioBanco.idFuncionario });
        return { user: funcionarioBanco, token };
    };

    public findAll = async (_funcionarioLogado: Funcionario): Promise<Funcionario[]> => {
        log.debug("findAll()");
        return await this._funcionarioDAO.findAll();
    };

    public findById = async (idFuncionario: string, _funcionarioLogado: Funcionario): Promise<Funcionario> => {
        log.debug("findById()", { idFuncionario });
        const funcionario = await this._funcionarioDAO.findById(idFuncionario);
        if (!funcionario) {
            throw new ErrorResponse(404, "Funcionário não encontrado");
        }
        return funcionario;
    };

    public updateFuncionario = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("updateFuncionario()", { idFuncionario: funcionario.idFuncionario });

        if (funcionario.senha && funcionario.senha.trim() !== "") {
            const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(funcionario.senha);
            if (!isBcryptHash) {
                funcionario.senha = await bcrypt.hash(funcionario.senha, 12);
            }
        }

        if (funcionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== funcionario.idFuncionario) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }

        if (funcionario.cargo?.idCargo) {
            const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse(400, "O cargo informado não existe");
            }
        }

        try {
            const atualizou = await this._funcionarioDAO.update(funcionario);
            if (atualizou) {
                log.info("funcionário atualizado", {
                    idFuncionario: funcionario.idFuncionario,
                    atualizadoPor: funcionarioLogado.email,
                });
            }
            return atualizou;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
            throw err;
        }
    };

    public deleteFuncionario = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("deleteFuncionario()", { idFuncionario: funcionario.idFuncionario });
        const excluiu = await this._funcionarioDAO.delete(funcionario);
        if (excluiu) {
            log.info("funcionário excluído", {
                idFuncionario: funcionario.idFuncionario,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    public count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("count()");
        return await this._funcionarioDAO.count();
    };

    public countByCargoId = async (cargoId: string, _funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("countByCargoId()", { cargoId });
        return await this._funcionarioDAO.countByCargoId(cargoId);
    };
}