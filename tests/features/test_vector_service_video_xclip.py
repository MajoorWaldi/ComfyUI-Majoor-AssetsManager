import math
import sys
import types

import pytest
from PIL import Image as PILImage

from mjr_am_backend.features.index import vector_service as m


class _FakeInferenceMode:
    def __enter__(self):
        return None

    def __exit__(self, _exc_type, _exc, _tb):
        return False


class _FakeArray:
    def __init__(self, values):
        self._values = values
        self.shape = ()
        self.dtype = "float32"

    def flatten(self):
        out = []

        def _walk(v):
            if isinstance(v, (list, tuple)):
                for item in v:
                    _walk(item)
            else:
                out.append(float(v))

        _walk(self._values)
        return _FakeArray(out)

    def tolist(self):
        if isinstance(self._values, list):
            return self._values
        return [self._values]

    def __truediv__(self, value):
        denom = float(value) or 1.0
        return _FakeArray([float(v) / denom for v in self.tolist()])

    def __iter__(self):
        return iter(self.tolist())


def _fake_numpy_module():
    def _to_values(arr):
        if isinstance(arr, _FakeArray):
            return arr.tolist()
        return arr

    def asarray(values, dtype=None):  # noqa: ARG001
        return _FakeArray(values)

    def mean(values, axis=0):  # noqa: ARG001
        data = _to_values(values)
        if isinstance(data, list) and data and isinstance(data[0], (list, tuple)):
            cols = len(data[0])
            return [
                sum(float(row[i]) for row in data) / max(1, len(data))
                for i in range(cols)
            ]
        if isinstance(data, list) and data:
            return sum(float(v) for v in data) / len(data)
        return 0.0

    class _Linalg:
        @staticmethod
        def norm(values):
            data = _to_values(values)
            flat = _FakeArray(data).flatten().tolist()
            return math.sqrt(sum(float(v) * float(v) for v in flat))

    return types.SimpleNamespace(
        asarray=asarray,
        mean=mean,
        linalg=_Linalg(),
        float32=float,
    )


class _FakeFeatures:
    def __init__(self) -> None:
        self._arr = [[1.0, 0.0, 0.0]]

    def detach(self):
        return self

    def cpu(self):
        return self

    def numpy(self):
        return self._arr


class _FakeXclipModel:
    def get_image_features(self, *, pixel_values=None):
        assert pixel_values is not None
        return _FakeFeatures()


class _ProcessorWithFallbackSignature:
    def __call__(self, *args, **kwargs):
        _ = args
        # Simulate a non-mapping return for the primary images signature.
        # Older code indexed directly with ["pixel_values"] and crashed.
        if "images" in kwargs:
            return PILImage.new("RGB", (2, 2), color=(0, 0, 0))
        if "videos" in kwargs:
            return {"pixel_values": [[[[1.0]]]]}
        return {"pixel_values": [[[[1.0]]]]}


class _BatchFailsOnMultiFrameModel:
    def encode(self, payload, **kwargs):  # noqa: ARG002
        items = list(payload) if isinstance(payload, list) else [payload]
        if len(items) > 1:
            raise TypeError("'Image' object is not subscriptable")
        return [[1.0, 0.0, 0.0]]


@pytest.mark.asyncio
async def test_xclip_embedding_handles_non_mapping_processor_output(monkeypatch, tmp_path):
    vs = m.VectorService()
    video_path = tmp_path / "tiny.mp4"
    video_path.write_bytes(b"0")

    async def _fake_ensure_xclip():
        return _ProcessorWithFallbackSignature(), _FakeXclipModel()

    monkeypatch.setattr(vs, "_ensure_xclip_components", _fake_ensure_xclip)
    monkeypatch.setattr(
        m,
        "extract_keyframes",
        lambda _path: [PILImage.new("RGB", (4, 4), color=(255, 255, 255))],
    )
    monkeypatch.setitem(
        sys.modules,
        "torch",
        types.SimpleNamespace(inference_mode=lambda: _FakeInferenceMode()),
    )
    monkeypatch.setitem(sys.modules, "numpy", _fake_numpy_module())

    result = await vs._get_video_embedding_xclip(video_path)

    assert result.ok is True
    assert isinstance(result.data, list)
    assert len(result.data) == int(m.VECTOR_EMBEDDING_DIM)


@pytest.mark.asyncio
async def test_video_embedding_falls_back_to_single_frame_when_batch_fails(monkeypatch, tmp_path):
    vs = m.VectorService()
    video_path = tmp_path / "batch_fail.mp4"
    video_path.write_bytes(b"0")

    async def _fake_xclip_fail(_path):
        return m.Result.Err("METADATA_FAILED", "xclip unavailable")

    async def _fake_ensure_model():
        return _BatchFailsOnMultiFrameModel()

    monkeypatch.setattr(vs, "_get_video_embedding_xclip", _fake_xclip_fail)
    monkeypatch.setattr(vs, "_ensure_model", _fake_ensure_model)
    monkeypatch.setattr(
        m,
        "extract_keyframes",
        lambda _path: [
            PILImage.new("RGB", (4, 4), color=(255, 255, 255)),
            PILImage.new("RGB", (4, 4), color=(0, 0, 0)),
        ],
    )
    monkeypatch.setitem(sys.modules, "numpy", _fake_numpy_module())

    result = await vs.get_video_embedding(video_path)

    assert result.ok is True
    assert isinstance(result.data, list)
    assert len(result.data) == 3
