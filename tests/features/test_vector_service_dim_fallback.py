from mjr_am_backend.config import VECTOR_EMBEDDING_DIM
from mjr_am_backend.features.index import vector_service as m
import pytest


class _BrokenDimModel:
    def get_sentence_embedding_dimension(self):
        raise AttributeError("'SiglipConfig' object has no attribute 'hidden_size'")


class _AlwaysBrokenModel:
    def get_sentence_embedding_dimension(self):
        raise RuntimeError("boom")


class _SiglipTextCfg:
    hidden_size = 1152


class _SiglipVisionCfg:
    hidden_size = 1152


class _SiglipCfgNoHidden:
    model_type = "siglip"

    def __init__(self):
        self.text_config = _SiglipTextCfg()
        self.vision_config = _SiglipVisionCfg()


class _SiglipTextOnlyCfg:
    model_type = "siglip"

    def __init__(self):
        self.hidden_size = 1152


class _FirstModuleWithCfg:
    def __init__(self, cfg):
        self.config = cfg


class _ModelWithSiglipCfg:
    def __init__(self):
        self._cfg = _SiglipCfgNoHidden()
        self._first = _FirstModuleWithCfg(self._cfg)

    def _first_module(self):
        return self._first


def test_resolve_dim_falls_back_to_probe(monkeypatch):
    vs = m.VectorService()

    def _fake_encode(_model, _payload, **_kwargs):
        return [[0.1, 0.2, 0.3, 0.4]]

    monkeypatch.setattr(m, "_encode_quiet", _fake_encode)

    dim = vs._resolve_sentence_embedding_dim(_BrokenDimModel())
    assert dim == 4


def test_resolve_dim_uses_default_when_probe_fails(monkeypatch):
    vs = m.VectorService()

    def _fake_encode(_model, _payload, **_kwargs):
        raise RuntimeError("encode failed")

    monkeypatch.setattr(m, "_encode_quiet", _fake_encode)

    dim = vs._resolve_sentence_embedding_dim(_AlwaysBrokenModel())
    assert dim == int(VECTOR_EMBEDDING_DIM)


def test_patch_model_hidden_size_adds_class_fallback_property():
    vs = m.VectorService()
    model = _ModelWithSiglipCfg()
    cfg = model._cfg

    assert not hasattr(type(cfg), "hidden_size")
    assert not hasattr(cfg, "hidden_size")

    patched = vs._patch_model_hidden_size(model)

    assert patched is True
    assert hasattr(type(cfg), "hidden_size")
    assert int(cfg.hidden_size) == 1152


def test_is_siglip_like_config_rejects_subconfigs_without_text_and_vision():
    vs = m.VectorService()
    text_only_cfg = _SiglipTextOnlyCfg()
    assert vs._is_siglip_like_config(text_only_cfg) is False


@pytest.mark.asyncio
async def test_get_image_embedding_encodes_single_item_batch(tmp_path, monkeypatch):
    vs = m.VectorService(model_name="sentence-transformers/clip-ViT-B-32")

    png_path = tmp_path / "tiny.png"
    png_path.write_bytes(
        bytes.fromhex(
            "89504E470D0A1A0A"
            "0000000D4948445200000001000000010802000000907753DE"
            "0000000C4944415408D763F8FFFF3F0005FE02FEA7D1A7E10000000049454E44AE426082"
        )
    )

    class _DummyModel:
        pass

    async def _fake_ensure_model():
        return _DummyModel()

    monkeypatch.setattr(vs, "_ensure_model", _fake_ensure_model)

    def _fake_encode(_model, payload, **_kwargs):
        assert isinstance(payload, list)
        assert len(payload) == 1
        return [[1.0, 2.0, 3.0]]

    monkeypatch.setattr(m, "_encode_quiet", _fake_encode)

    result = await vs.get_image_embedding(png_path)
    assert result.ok is True
    assert isinstance(result.data, list)
    assert len(result.data) == 3
