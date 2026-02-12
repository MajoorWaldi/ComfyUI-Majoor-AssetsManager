import importlib.util
import sys
import types
from pathlib import Path


def _load_extension_module(module_name: str = "mjr_am_ext_init_test"):
    module_path = Path(__file__).resolve().parents[2] / "__init__.py"
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_init_prompt_server_calls_registry_hooks(monkeypatch):
    calls = {"register_all_routes": 0, "install_observability": 0}

    registry = types.ModuleType("mjr_am_backend.routes.registry")

    def _register_all_routes():
        calls["register_all_routes"] += 1

    def _install_observability_on_prompt_server():
        calls["install_observability"] += 1

    registry.register_all_routes = _register_all_routes
    registry._install_observability_on_prompt_server = _install_observability_on_prompt_server

    monkeypatch.setitem(sys.modules, "mjr_am_backend.routes.registry", registry)
    monkeypatch.delitem(sys.modules, "server", raising=False)

    module = _load_extension_module("mjr_am_ext_prompt_test")
    module.init_prompt_server()

    assert calls["register_all_routes"] == 1
    assert calls["install_observability"] == 1


def test_init_with_app_calls_register_routes(monkeypatch):
    calls = {"register_routes": 0}

    registry = types.ModuleType("mjr_am_backend.routes.registry")

    def _register_routes(app):
        calls["register_routes"] += 1
        assert app == "fake_app"

    registry.register_routes = _register_routes
    registry.register_all_routes = lambda: None
    registry._install_observability_on_prompt_server = lambda: None

    monkeypatch.setitem(sys.modules, "mjr_am_backend.routes.registry", registry)
    monkeypatch.delitem(sys.modules, "server", raising=False)

    module = _load_extension_module("mjr_am_ext_app_test")
    module.init("fake_app")

    assert calls["register_routes"] == 1
