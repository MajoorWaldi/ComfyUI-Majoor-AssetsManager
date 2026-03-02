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


def test_vector_service_reuses_shared_model_cache(monkeypatch):
    class _FakeSentenceTransformer:
        init_calls = 0

        def __init__(self, _name, device=None, model_kwargs=None, tokenizer_kwargs=None):
            _ = (device, model_kwargs, tokenizer_kwargs)
            _FakeSentenceTransformer.init_calls += 1
            self.max_seq_length = 77

        def get_sentence_embedding_dimension(self):
            return 8

        def encode(self, _payload, **_kwargs):
            return [[0.1] * 8]

    fake_st = types.ModuleType("sentence_transformers")
    fake_st.SentenceTransformer = _FakeSentenceTransformer

    fake_tf = types.ModuleType("transformers")
    fake_tf_utils = types.ModuleType("transformers.utils")
    fake_tf_utils.logging = _FakeHFLogging

    m._MODEL_CACHE.clear()
    monkeypatch.setitem(sys.modules, "sentence_transformers", fake_st)
    monkeypatch.setitem(sys.modules, "transformers", fake_tf)
    monkeypatch.setitem(sys.modules, "transformers.utils", fake_tf_utils)

    vs1 = m.VectorService(model_name="dummy")
    vs2 = m.VectorService(model_name="dummy")

    model1 = vs1._load_model()
    model2 = vs2._load_model()

    assert _FakeSentenceTransformer.init_calls == 1
    assert model1 is model2
