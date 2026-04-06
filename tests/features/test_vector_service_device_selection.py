import sys
import types

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