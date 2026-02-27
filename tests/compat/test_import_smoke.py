import importlib.util
from pathlib import Path


def test_import_exposes_expected_public_symbols():
    module_path = Path(__file__).resolve().parents[2] / "__init__.py"
    spec = importlib.util.spec_from_file_location("mjr_am_ext", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    assert hasattr(module, "init_prompt_server")
    assert callable(module.init_prompt_server)
    assert hasattr(module, "NODE_CLASS_MAPPINGS")
    assert isinstance(module.NODE_CLASS_MAPPINGS, dict)
    assert hasattr(module, "WEB_DIRECTORY")
    assert isinstance(module.WEB_DIRECTORY, str)
    assert hasattr(module, "__version__")
    assert isinstance(module.__version__, str)
