import os
from pathlib import Path


def get_base_dir() -> Path:
    """Retorna o diretório onde o script está localizado."""
    return Path(__file__).resolve().parent


def build_tree(directory: Path, exclude: Path, prefix: str = "") -> list[str]:
    """Monta a árvore de diretórios/pastas em formato visual."""
    lines = []
    # Ordena: primeiro pastas, depois arquivos, tudo em ordem alfabética
    entries = sorted(
        [e for e in directory.iterdir() if e != exclude],
        key=lambda e: (e.is_file(), e.name.lower()),
    )

    for i, entry in enumerate(entries):
        last = i == len(entries) - 1
        connector = "└── " if last else "├── "
        name = entry.name + ("/" if entry.is_dir() else "")
        lines.append(prefix + connector + name)

        if entry.is_dir():
            extension = "    " if last else "│   "
            lines.extend(build_tree(entry, exclude, prefix + extension))

    return lines


def export_project(base_dir: Path, output_file: Path) -> None:
    """Salva hierarquia do projeto e conteúdo dos arquivos .ts no arquivo de saída."""
    with open(output_file, "w", encoding="utf-8") as out:
        # ---------- 1. HIERARQUIA ----------
        out.write("=" * 80 + "\n")
        out.write("HIERARQUIA DO PROJETO\n")
        out.write("=" * 80 + "\n")
        out.write(base_dir.name + "/\n")
        for line in build_tree(base_dir, exclude=output_file):
            out.write(line + "\n")
        out.write("\n\n")

        # ---------- 2. CONTEÚDO DOS .ts ----------
        out.write("=" * 80 + "\n")
        out.write("CONTEÚDO DOS ARQUIVOS .ts\n")
        out.write("=" * 80 + "\n\n")

        ts_files = sorted(base_dir.rglob("*.ts"))
        # Ignora arquivos dentro de node_modules (opcional, remover se não quiser)
        ts_files = [f for f in ts_files if "node_modules" not in f.parts]

        if not ts_files:
            out.write("Nenhum arquivo .ts encontrado.\n")
            return

        for ts_file in ts_files:
            rel_path = ts_file.relative_to(base_dir)
            out.write("\n" + "-" * 80 + "\n")
            out.write(f"ARQUIVO: {rel_path}\n")
            out.write("-" * 80 + "\n")
            try:
                with open(ts_file, "r", encoding="utf-8", errors="replace") as f:
                    out.write(f.read())
            except Exception as e:
                out.write(f"[ERRO ao ler arquivo: {e}]\n")
            out.write("\n")


if __name__ == "__main__":
    base_dir = get_base_dir()
    output_file = base_dir / "projeto_exportado.txt"
    export_project(base_dir, output_file)
    print(f"✔ Arquivo gerado com sucesso: {output_file}")