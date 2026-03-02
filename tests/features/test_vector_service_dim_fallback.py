from mjr_am_backend.config import VECTOR_EMBEDDING_DIM
from mjr_am_backend.features.index import vector_service as m


class _BrokenDimModel:
    def get_sentence_embedding_dimension(self):
        raise AttributeError("'SiglipConfig' object has no attribute 'hidden_size'")


class _AlwaysBrokenModel:
    def get_sentence_embedding_dimension(self):
        raise RuntimeError("boom")


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
