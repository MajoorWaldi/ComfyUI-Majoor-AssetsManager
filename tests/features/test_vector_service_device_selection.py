import logging
import sys
import types

import pytest
from mjr_am_backend.features.index import vector_service as m


class _FakeHFLogging:
    @staticmethod
    def get_verbosity():
        return 0

    @staticmethod
    def set_verbosity_error():
        return None

    @staticmethod
    def set_verbosity(_value):
        return None


class _FakeModel:
    def __init__(self):
        self.moved_to = None
        self.eval_called = False
        self.config = None

    def to(self, device):
        self.moved_to = device
        return self

    def eval(self):
        self.eval_called = True
        return self


def test_vector_service_auto_device_prefers_cuda(monkeypatch):
    fake_torch = types.SimpleNamespace(
        cuda=types.SimpleNamespace(is_available=lambda: True),
        backends=types.SimpleNamespace(mps=types.SimpleNamespace(is_available=lambda: False)),
    )
    monkeypatch.setitem(sys.modules, "torch", fake_torch)

    vs = m.VectorService()

    assert vs._device == "cuda"


def test_vector_service_explicit_device_is_preserved():
    vs = m.VectorService(device="cpu")

    assert vs._device == "cpu"


def test_load_siglip_components_moves_model_to_resolved_device():
    fake_model = _FakeModel()

    class _FakeAutoProcessor:
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            return object()

    class _FakeAutoModel:
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            return fake_model

    vs = m.VectorService(device="cuda")

    _processor, loaded_model = m._load_siglip_components(
        vs,
        _FakeHFLogging,
        _FakeAutoModel,
        _FakeAutoProcessor,
        True,
    )

    assert loaded_model is fake_model
    assert fake_model.moved_to == "cuda"
    assert fake_model.eval_called is True


def test_load_florence_components_moves_model_to_resolved_device(monkeypatch):
    fake_model = _FakeModel()
    fake_torch = types.SimpleNamespace()

    monkeypatch.setitem(sys.modules, "torch", fake_torch)
    monkeypatch.setattr(m, "_load_florence_model_with_compat", lambda *_args, **_kwargs: fake_model)

    class _FakeAutoProcessor:
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            return object()

    vs = m.VectorService(device="cuda")

    _processor, loaded_model, returned_torch = m._load_florence_components(
        vs,
        _FakeHFLogging,
        object(),
        _FakeAutoProcessor,
        True,
    )

    assert loaded_model is fake_model
    assert returned_torch is fake_torch
    assert fake_model.moved_to == "cuda"
    assert fake_model.eval_called is True


def test_load_florence_model_with_compat_patches_missing_generation_attrs(monkeypatch):
    class _FakePretrainedConfig:
        pass

    class _FakeGenerationConfig:
        pass

    fake_cfg_mod = types.ModuleType("transformers.configuration_utils")
    fake_cfg_mod.PretrainedConfig = _FakePretrainedConfig
    fake_generation_mod = types.ModuleType("transformers.generation.configuration_utils")
    fake_generation_mod.GenerationConfig = _FakeGenerationConfig

    fake_model = _FakeModel()

    class _FakeAutoModelForCausalLM:
        calls = 0

        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            _FakeAutoModelForCausalLM.calls += 1
            if not hasattr(_FakePretrainedConfig, "forced_bos_token_id"):
                raise AttributeError("'Florence2LanguageConfig' object has no attribute 'forced_bos_token_id'")
            return fake_model

    monkeypatch.setitem(sys.modules, "transformers.configuration_utils", fake_cfg_mod)
    monkeypatch.setitem(sys.modules, "transformers.generation.configuration_utils", fake_generation_mod)

    loaded_model = m._load_florence_model_with_compat("dummy/florence", _FakeAutoModelForCausalLM)

    assert loaded_model is fake_model
    assert _FakeAutoModelForCausalLM.calls >= 1
    assert hasattr(_FakePretrainedConfig, "forced_bos_token_id")
    assert _FakePretrainedConfig.forced_bos_token_id is None
    assert hasattr(_FakeGenerationConfig, "forced_bos_token_id")
    assert _FakeGenerationConfig.forced_bos_token_id is None


def test_load_florence_model_with_compat_handles_language_config_init_access(monkeypatch):
    class _FakePretrainedConfig:
        pass

    class _FakeGenerationConfig:
        pass

    class _FakeFlorence2Config:
        pass

    class _FakeFlorence2LanguageConfig:
        def __init__(self):
            self.forced_bos_seen_during_init = self.forced_bos_token_id

    fake_cfg_mod = types.ModuleType("transformers.configuration_utils")
    fake_cfg_mod.PretrainedConfig = _FakePretrainedConfig
    fake_generation_mod = types.ModuleType("transformers.generation.configuration_utils")
    fake_generation_mod.GenerationConfig = _FakeGenerationConfig
    fake_florence_mod = types.ModuleType("transformers.models.florence2.configuration_florence2")
    fake_florence_mod.Florence2Config = _FakeFlorence2Config
    fake_florence_mod.Florence2LanguageConfig = _FakeFlorence2LanguageConfig

    class _FakeAutoModelForCausalLM:
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            fake_model = _FakeModel()
            fake_model.config = types.SimpleNamespace(language_config=_FakeFlorence2LanguageConfig())
            return fake_model

    monkeypatch.setitem(sys.modules, "transformers.configuration_utils", fake_cfg_mod)
    monkeypatch.setitem(sys.modules, "transformers.generation.configuration_utils", fake_generation_mod)
    monkeypatch.setitem(sys.modules, "transformers.models.florence2.configuration_florence2", fake_florence_mod)

    loaded_model = m._load_florence_model_with_compat("dummy/florence", _FakeAutoModelForCausalLM)

    assert loaded_model.config.language_config.forced_bos_seen_during_init is None
    assert loaded_model.config.language_config.forced_bos_token_id is None


@pytest.mark.parametrize("retry", [False, True])
def test_florence_load_filters_only_optional_generate_probe(monkeypatch, caplog, retry):
    hf_logger = logging.getLogger("transformers.dynamic_module_utils")
    original_filters = list(hf_logger.filters)
    model_name = "microsoft/Florence-2-base"
    probe_message = f"Could not locate the custom_generate/generate.py inside {model_name}."
    required_file_message = f"Could not locate the modeling_florence2.py inside {model_name}."
    other_model_message = "Could not locate the custom_generate/generate.py inside other/model."
    fake_model = _FakeModel()
    calls = []

    class _FakeAutoModelForCausalLM:
        @staticmethod
        def from_pretrained(name, **kwargs):
            calls.append((name, kwargs))
            hf_logger.info(probe_message)
            hf_logger.error(probe_message)
            hf_logger.error(required_file_message)
            hf_logger.info(other_model_message)
            if retry and len(calls) == 1:
                raise AttributeError("missing _supports_sdpa")
            return fake_model

    monkeypatch.setattr(m, "_patch_florence_generation_config_compat", lambda *_args: None)
    monkeypatch.setattr(m, "_patch_florence_sdpa_support", lambda: None)
    with caplog.at_level(logging.INFO, logger=hf_logger.name):
        loaded_model = m._load_florence_model_with_compat(model_name, _FakeAutoModelForCausalLM)
        assert not any(
            record.levelno == logging.INFO and record.getMessage() == probe_message
            for record in caplog.records
        )
        assert caplog.messages.count(probe_message) == len(calls)
        assert caplog.messages.count(required_file_message) == len(calls)
        assert caplog.messages.count(other_model_message) == len(calls)
        assert hf_logger.filters == original_filters
        hf_logger.info(probe_message)
        assert caplog.messages.count(probe_message) == len(calls) + 1

    assert loaded_model is fake_model
    assert calls == [
        (model_name, {"trust_remote_code": True, "attn_implementation": "eager"})
    ] * (2 if retry else 1)


@pytest.mark.parametrize(
    "error",
    [OSError("missing model weights"), AttributeError("unrelated attribute"), RuntimeError("load failed")],
)
def test_florence_load_preserves_failures_and_restores_log_filters(monkeypatch, caplog, error):
    hf_logger = logging.getLogger("transformers.dynamic_module_utils")
    original_filters = list(hf_logger.filters)
    failure_message = "Could not locate the modeling_florence2.py inside microsoft/Florence-2-base."

    class _FakeAutoModelForCausalLM:
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            hf_logger.error(failure_message)
            raise error

    monkeypatch.setattr(m, "_patch_florence_generation_config_compat", lambda *_args: None)
    with caplog.at_level(logging.INFO, logger=hf_logger.name):
        with pytest.raises(type(error), match=str(error)) as exc_info:
            m._load_florence_model_with_compat("microsoft/Florence-2-base", _FakeAutoModelForCausalLM)

    assert exc_info.value is error
    assert failure_message in caplog.messages
    assert hf_logger.filters == original_filters
