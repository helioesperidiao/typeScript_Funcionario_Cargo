"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const Cargo_1 = require("../models/Cargo");
const Funcionario_1 = require("../models/Funcionario");
const ErrorResponse_1 = require("../http/ErrorResponse");
const MeuTokenJWT_1 = require("../http/MeuTokenJWT");
class FuncionarioService {
    _funcionarioDAO;
    _cargoDAO;
    constructor(funcionarioDAODependency, cargoDAODependency) {
        console.log("⬆️  FuncionarioService.constructor()");
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
        this.initializeDefaultAdmin();
    }
    initializeDefaultAdmin = async () => {
        console.log("🟣 FuncionarioService.initializeDefaultAdmin()");
        const funcionarios = await this._funcionarioDAO.count();
        if (funcionarios > 0) {
            console.log("✅ Já existem funcionários cadastrados. Pulando criação do admin padrão.");
            return;
        }
        const cargoAdmin = await this._cargoDAO.findByField("nomeCargo", "Administrador");
        let cargoId;
        if (cargoAdmin && cargoAdmin.length > 0) {
            cargoId = cargoAdmin[0].idCargo;
            console.log(`🔍 Cargo "Administrador" encontrado com ID: ${cargoId}`);
        }
        else {
            const cargo = new Cargo_1.Cargo();
            cargo.nomeCargo = "Administrador";
            const cargoCriado = await this._cargoDAO.create(cargo);
            cargoId = cargoCriado.idCargo;
            console.log(`🆕 Cargo "Administrador" criado com ID: ${cargoId}`);
        }
        const adminName = process.env.DEFAULT_ADMIN_NAME || "Hélio Esperidião";
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "helioesperidiao@gmail.com";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "@Helio123456";
        const adminValeTransporte = parseInt(process.env.DEFAULT_ADMIN_VALE_TRANSPORTE || "0");
        const funcionarioAdmin = new Funcionario_1.Funcionario();
        funcionarioAdmin.nomeFuncionario = adminName;
        funcionarioAdmin.email = adminEmail;
        funcionarioAdmin.senha = await bcrypt_1.default.hash(adminPassword, 12);
        funcionarioAdmin.recebeValeTransporte = adminValeTransporte;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = cargoId;
        funcionarioAdmin.cargo = cargo;
        const novoAdmin = await this._funcionarioDAO.create(funcionarioAdmin);
        console.log(`✅ Administrador padrão criado com ID: ${novoAdmin.idFuncionario}`);
        return novoAdmin;
    };
    create = async (funcionario, _funcionarioLogado) => {
        console.log("🟣 FuncionarioService.create()");
        const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "O cargo informado não existe");
        }
        const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Já existe um funcionário com este email");
        }
        const senhaHash = await bcrypt_1.default.hash(funcionario.senha, 12);
        funcionario.senha = senhaHash;
        const novoFuncionario = await this._funcionarioDAO.create(funcionario);
        return novoFuncionario;
    };
    loginFuncionario = async (funcionario) => {
        console.log("🟣 FuncionarioService.loginFuncionario()");
        console.log("🔍 Email recebido:", funcionario.email);
        console.log("🔍 Senha recebida (tamanho):", funcionario.senha ? funcionario.senha.length : "vazia");
        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            console.log("❌ Funcionário não encontrado com email:", funcionario.email);
            throw new ErrorResponse_1.ErrorResponse(401, "Usuário ou senha inválidos");
        }
        console.log("🔍 Hash armazenado (primeiros 10 caracteres):", funcionarioBanco.senha.substring(0, 10));
        const senhaValida = await bcrypt_1.default.compare(funcionario.senha, funcionarioBanco.senha);
        console.log("🔍 Senha válida?", senhaValida);
        if (!senhaValida) {
            throw new ErrorResponse_1.ErrorResponse(401, "Usuário ou senha inválidos");
        }
        const jwt = new MeuTokenJWT_1.MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);
        return { user: funcionarioBanco, token };
    };
    findAll = async (_funcionarioLogado) => {
        console.log("🟣 FuncionarioService.findAll()");
        return await this._funcionarioDAO.findAll();
    };
    findById = async (idFuncionario, _funcionarioLogado) => {
        const funcionario = await this._funcionarioDAO.findById(idFuncionario);
        if (!funcionario) {
            throw new ErrorResponse_1.ErrorResponse(404, "Funcionário não encontrado");
        }
        return funcionario;
    };
    updateFuncionario = async (funcionario, _funcionarioLogado) => {
        console.log(`🟣 FuncionarioService.updateFuncionario(${funcionario.idFuncionario})`);
        if (funcionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== funcionario.idFuncionario) {
                throw new ErrorResponse_1.ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }
        if (funcionario.cargo?.idCargo) {
            const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse_1.ErrorResponse(400, "O cargo informado não existe");
            }
        }
        return await this._funcionarioDAO.update(funcionario);
    };
    deleteFuncionario = async (funcionario, _funcionarioLogado) => {
        return await this._funcionarioDAO.delete(funcionario);
    };
    count = async (_funcionarioLogado) => {
        console.log("🟣 FuncionarioService.count()");
        return await this._funcionarioDAO.count();
    };
    countByCargoId = async (cargoId, _funcionarioLogado) => {
        console.log(`🟣 FuncionarioService.countByCargoId(${cargoId})`);
        return await this._funcionarioDAO.countByCargoId(cargoId);
    };
}
exports.FuncionarioService = FuncionarioService;
//# sourceMappingURL=FuncionarioService.js.map