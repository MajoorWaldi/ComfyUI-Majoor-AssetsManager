import importlib.util
from pathlib import Path


def test_import_exposes_init_prompt_server():
    module_path = Path(__file__).resolve().parents[2] / "__init__.py"
    spec = importlib.util.spec_from_file_location("mjr_am_ext", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    assert hasattr(module, "init_prompt_server")
    assert callable(module.init_prompt_server)
