import asyncio
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.metadata import metadata_service_impl as m
from mjr_am_backend.shared import ErrorCode, Result


class _Exif:
    def __init__(self, single=None, batch=None):
        self.single = single if single is not None else Result.Ok({})
        self.batch = batch if batch is not None else {}

    async def aread(self, _path):
        return self.single

    def read(self, _path):
        return self.single

    async def aread_batch(self, _paths):
        return self.batch


class _FF:
    def __init__(self, single=None, batch=None):
        self.single = single if single is not None else Result.Ok({})
        self.batch = batch if batch is not None else {}

    async def aread(self, _path):
        return self.single

    def read(self, _path):
        return self.single

    async def aread_batch(self, _paths):
        return self.batch

    def read_batch(self, _paths):
        return self.batch


class _Settings:
    def __init__(self, mode="auto", prefs=None, explode=False):
        self.mode = mode
        self.prefs = prefs if prefs is not None else {"image": True, "media": True}
        self.explode = explode

    async def get_probe_backend(self):
        return self.mode

    async def get_metadata_fallback_prefs(self):
        if self.explode:
            raise RuntimeError("x")
        return self.prefs


def _svc(exif=None, ff=None, settings=None):
    return m.MetadataService(exif or _Exif(), ff or _FF(), settings or _Settings())


def test_top_level_param_helpers():
    assert m._clean_model_name("C:/m/model.safetensors") == "model"
    assert m._clean_model_name("") is None

    out = m._build_geninfo_from_parameters({"prompt": "p", "steps": "20", "model": "a.ckpt"})
    assert out and out["steps"]["value"] == 20
    assert m._build_geninfo_from_parameters({"x": 1}) == {}

    merged = m._merge_parsed_params({"parameters": "x"})
    assert isinstance(merged, dict)

    assert m._has_any_parameter_signal(None, "") is False
    d = {}
    m._apply_prompt_fields(d, "p", "n")
    m._apply_sampler_fields(d, "euler", "normal")
    m._apply_numeric_fields(d, "20", "7.5", "1")
    m._apply_size_field(d, "512", "768")
    m._apply_checkpoint_fields(d, "x.safetensors")
    assert "positive" in d and "size" in d and "checkpoint" in d


def test_media_pipeline_helpers():
    g = {"1": {"class_type": "LoadVideo"}, "2": {"class_type": "VHS_VideoCombine"}}
    assert m._looks_like_media_pipeline(g) is True
    assert m._looks_like_media_pipeline({"1": {"class_type": "KSampler"}}) is False

    types = m._collect_prompt_graph_types(g)
    assert "loadvideo" in types
    assert m._has_generation_sampler(["ksampler"]) is True
    assert m._classify_media_nodes(types)[0] is True
    assert m._should_parse_geninfo({"prompt": {"1": {}}, "workflow": None}) is True


def test_group_and_batch_targets(monkeypatch):
    monkeypatch.setattr(m, "classify_file", lambda p: "image" if p.endswith(".png") else ("video" if p.endswith(".mp4") else ("audio" if p.endswith(".mp3") else "unknown")))
    monkeypatch.setattr(m.os.path, "exists", lambda p: not p.endswith("missing"))

    i, v, a, o = m._group_existing_paths(["a.png", "b.mp4", "c.mp3", "d.bin", "missing"])
    assert i and v and a and o

    monkeypatch.setattr(m, "pick_probe_backend", lambda p, settings_override=None: ["exiftool", "ffprobe"] if p.endswith(".mp4") else ["exiftool"])
    ex, ff = m._build_batch_probe_targets(["a.png", "b.mp4", "b.mp4"], "auto")
    assert ex == ["a.png", "b.mp4"]
    assert ff == ["b.mp4"]


def test_batch_tool_data_and_resolution_helpers():
    mp = {"a": Result.Ok({"x": 1}), "b": Result.Err("E", "x")}
    assert m._batch_tool_data(mp, "a") == {"x": 1}
    assert m._batch_tool_data(mp, "b") is None

    payload = {"resolution": (512, 768)}
    m._expand_resolution_scalars(payload)
    assert payload["width"] == 512 and payload["height"] == 768
    assert m._coerce_resolution_pair((1, 2)) == (1, 2)
    assert m._coerce_resolution_pair(1) is None
    assert m._coerce_dimension_value("5") == 5


@pytest.mark.asyncio
async def test_probe_mode_and_backends(monkeypatch):
    s = _svc(settings=_Settings(mode="ffprobe"))
    assert await s._resolve_probe_mode("AUTO") == "auto"
    assert await s._resolve_probe_mode("bad") == "ffprobe"

    monkeypatch.setattr(m, "pick_probe_backend", lambda p, settings_override=None: ["exiftool"])
    mode, backends = await s._probe_backends("a.png", None)
    assert mode == "ffprobe" and backends == ["exiftool"]


@pytest.mark.asyncio
async def test_resolve_fallback_prefs():
    s1 = _svc(settings=_Settings(prefs={"image": False, "media": True}))
    assert await s1._resolve_fallback_prefs() == (False, True)

    s2 = _svc(settings=_Settings(explode=True))
    assert await s2._resolve_fallback_prefs() == (True, True)


@pytest.mark.asyncio
async def test_read_with_transient_retry(monkeypatch):
    s = _svc()
    seq = [Result.Err("E", "x"), Result.Ok({"a": 1})]

    async def _once():
        return seq.pop(0)

    monkeypatch.setattr(s, "_is_transient_metadata_read_error", lambda result, fp: True)
    out = await s._read_with_transient_retry("a.png", _once)
    assert out.ok


@pytest.mark.asyncio
async def test_enrich_with_geninfo_async(monkeypatch):
    s = _svc()

    monkeypatch.setattr(m, "parse_geninfo_from_prompt", lambda *args, **kwargs: Result.Ok({"g": 1}))
    c = {"prompt": {"1": {}}, "workflow": {"nodes": []}}
    await s._enrich_with_geninfo_async(c)
    assert c["geninfo"] == {"g": 1}

    monkeypatch.setattr(m, "parse_geninfo_from_prompt", lambda *args, **kwargs: Result.Err("E", "x"))
    monkeypatch.setattr(m, "registry_build_geninfo_from_parameters", lambda combined: None)
    monkeypatch.setattr(m, "registry_looks_like_media_pipeline", lambda p: True)
    c2 = {"prompt": {"1": {}}, "workflow": {"nodes": []}}
    await s._enrich_with_geninfo_async(c2)
    assert c2["geninfo"] == {}
    assert c2["geninfo_status"]["kind"] == "media_pipeline"


@pytest.mark.asyncio
async def test_get_metadata_not_found(tmp_path):
    s = _svc()
    out = await s.get_metadata(str(tmp_path / "missing.png"))
    assert out.code == ErrorCode.NOT_FOUND


@pytest.mark.asyncio
async def test_get_metadata_impl_dispatch(monkeypatch, tmp_path):
    p = tmp_path / "a.bin"
    p.write_text("x")
    s = _svc()

    monkeypatch.setattr(m, "classify_file", lambda _p: "image")
    monkeypatch.setattr(s, "_probe_backends", lambda *args, **kwargs: asyncio.sleep(0, result=("auto", ["exiftool"])))
    monkeypatch.setattr(s, "_extract_image_metadata", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"k": 1})))
    out1 = await s._get_metadata_impl(str(p))
    assert out1.ok

    monkeypatch.setattr(m, "classify_file", lambda _p: "video")
    monkeypatch.setattr(s, "_extract_video_metadata", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"k": 2})))
    out2 = await s._get_metadata_impl(str(p))
    assert out2.ok

    monkeypatch.setattr(m, "classify_file", lambda _p: "audio")
    monkeypatch.setattr(s, "_extract_audio_metadata", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"k": 3})))
    out3 = await s._get_metadata_impl(str(p))
    assert out3.ok

    monkeypatch.setattr(m, "classify_file", lambda _p: "unknown")
    out4 = await s._get_metadata_impl(str(p))
    assert out4.code == ErrorCode.UNSUPPORTED


@pytest.mark.asyncio
async def test_workflow_only_paths(monkeypatch, tmp_path):
    p = tmp_path / "a.png"
    p.write_text("x")
    s = _svc()

    monkeypatch.setattr(m, "classify_file", lambda _p: "image")
    monkeypatch.setattr(s, "_resolve_fallback_prefs", lambda: asyncio.sleep(0, result=(True, True)))
    monkeypatch.setattr(s, "_read_workflow_only_exif", lambda **kwargs: asyncio.sleep(0, result={"a": 1}))
    monkeypatch.setattr(s, "_extract_workflow_only_payload", lambda *args, **kwargs: Result.Ok({"workflow": {"w": 1}, "prompt": {"p": 1}, "quality": "partial"}))
    out = await s.get_workflow_only(str(p))
    assert out.ok and out.data["quality"] == "partial"

    out_nf = await s.get_workflow_only(str(tmp_path / "missing.png"))
    assert out_nf.code == ErrorCode.NOT_FOUND


@pytest.mark.asyncio
async def test_read_workflow_only_exif_fallback(monkeypatch):
    s = _svc()
    monkeypatch.setattr(s, "_exif_read", lambda _p: asyncio.sleep(0, result=Result.Err("E", "x")))
    monkeypatch.setattr(m, "read_image_exif_like", lambda _p: {"fallback": 1})
    out = await s._read_workflow_only_exif(file_path="a.png", kind="image", image_fallback_enabled=True, scan_id=None)
    assert out == {"fallback": 1}


@pytest.mark.asyncio
async def test_image_video_audio_extractors(monkeypatch, tmp_path):
    p_img = tmp_path / "a.png"
    p_img.write_text("x")
    p_vid = tmp_path / "a.mp4"
    p_vid.write_text("x")
    p_aud = tmp_path / "a.mp3"
    p_aud.write_text("x")
    s = _svc()

    monkeypatch.setattr(s, "_resolve_image_exif_data", lambda *args, **kwargs: asyncio.sleep(0, result={"x": 1}))
    monkeypatch.setattr(s, "_extract_image_by_extension", lambda fp, ext, ex: Result.Ok({"quality": "partial", "workflow": None, "prompt": None}))
    monkeypatch.setattr(s, "_build_image_metadata_payload", lambda *args, **kwargs: {"workflow": None, "prompt": None})
    monkeypatch.setattr(s, "_enrich_with_geninfo_async", lambda combined: asyncio.sleep(0))
    out_img = await s._extract_image_metadata(str(p_img))
    assert out_img.ok

    monkeypatch.setattr(s, "_resolve_fallback_prefs", lambda: asyncio.sleep(0, result=(True, True)))
    monkeypatch.setattr(s, "_read_video_exif_if_allowed", lambda *args, **kwargs: asyncio.sleep(0, result=({}, 0.1)))
    monkeypatch.setattr(s, "_read_video_ffprobe_if_allowed", lambda *args, **kwargs: asyncio.sleep(0, result=({}, 0.1)))
    monkeypatch.setattr(m, "extract_video_metadata", lambda *args, **kwargs: Result.Ok({"quality": "partial", "resolution": (100, 200)}))
    monkeypatch.setattr(s, "_enrich_with_geninfo_async", lambda combined: asyncio.sleep(0))
    out_vid = await s._extract_video_metadata(str(p_vid))
    assert out_vid.ok

    monkeypatch.setattr(s, "_read_audio_exif_if_allowed", lambda *args, **kwargs: asyncio.sleep(0, result=({}, 0.1)))
    monkeypatch.setattr(s, "_read_audio_ffprobe_if_allowed", lambda *args, **kwargs: asyncio.sleep(0, result=({}, 0.1)))
    monkeypatch.setattr(s, "_maybe_audio_ffprobe_fallback", lambda fp, data: asyncio.sleep(0, result=data))
    monkeypatch.setattr(m, "extract_audio_metadata", lambda *args, **kwargs: Result.Ok({"quality": "partial"}))
    monkeypatch.setattr(s, "_finalize_audio_metadata_ok", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"ok": 1})))
    out_aud = await s._extract_audio_metadata(str(p_aud))
    assert out_aud.ok


@pytest.mark.asyncio
async def test_audio_fallback_only_and_reads(monkeypatch, tmp_path):
    p = tmp_path / "a.mp3"
    p.write_text("x")
    s = _svc()

    monkeypatch.setattr(s, "_resolve_fallback_prefs", lambda: asyncio.sleep(0, result=(True, True)))
    monkeypatch.setattr(m, "read_media_probe_like", lambda _p: {"d": 1})
    monkeypatch.setattr(m, "extract_audio_metadata", lambda *args, **kwargs: Result.Ok({"quality": "partial"}))
    out = await s._extract_audio_metadata_fallback_only(str(p))
    assert out.ok

    monkeypatch.setattr(s, "_exif_read", lambda _p: asyncio.sleep(0, result=Result.Err("E", "x")))
    monkeypatch.setattr(s, "_ffprobe_read", lambda _p: asyncio.sleep(0, result=Result.Err("E", "x")))
    ex, _ = await s._read_audio_exif_if_allowed(str(p), None, True)
    ff, _ = await s._read_audio_ffprobe_if_allowed(str(p), None, True)
    assert ex is None and ff is None


@pytest.mark.asyncio
async def test_batch_impl_and_fill_helpers(monkeypatch, tmp_path):
    p_img = tmp_path / "a.png"
    p_vid = tmp_path / "a.mp4"
    p_aud = tmp_path / "a.mp3"
    p_oth = tmp_path / "a.bin"
    for p in (p_img, p_vid, p_aud, p_oth):
        p.write_text("x")

    s = _svc(exif=_Exif(batch={str(p_img): Result.Ok({"ex": 1})}), ff=_FF(batch={str(p_vid): Result.Ok({"ff": 1}), str(p_aud): Result.Ok({"ff": 2})}))

    monkeypatch.setattr(m, "registry_group_existing_paths", lambda fps: ([str(p_img)], [str(p_vid)], [str(p_aud)], [str(p_oth)]))
    monkeypatch.setattr(s, "_resolve_probe_mode", lambda ov: asyncio.sleep(0, result="auto"))
    monkeypatch.setattr(s, "_resolve_fallback_prefs", lambda: asyncio.sleep(0, result=(True, True)))
    monkeypatch.setattr(m, "registry_build_batch_probe_targets", lambda paths, mode: (paths, paths))
    monkeypatch.setattr(s, "_process_image_batch_item", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"i": 1})))
    monkeypatch.setattr(s, "_process_video_batch_item", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"v": 1})))
    monkeypatch.setattr(s, "_process_audio_batch_item", lambda *args, **kwargs: asyncio.sleep(0, result=Result.Ok({"a": 1})))
    monkeypatch.setattr(s, "_fill_other_batch_results", lambda results, others: results.update({o: Result.Ok({"o": 1}) for o in others}))

    out = await s._get_metadata_batch_impl([str(p_img), str(p_vid), str(p_aud), str(p_oth)])
    assert all(k in out for k in (str(p_img), str(p_vid), str(p_aud), str(p_oth)))


def test_dimension_helpers():
    svc = _svc()
    w, h = svc._fill_dims_from_resolution({"resolution": (1, 2)}, None, None, lambda x: int(x))
    assert (w, h) == (1, 2)

    ff = {"video_stream": {"width": "3", "height": "4"}}
    w2, h2 = svc._fill_dims_from_ffprobe(ff, None, None, lambda x: int(x))
    assert (w2, h2) == (3, 4)

    ex = {"Image:ImageWidth": "5", "Image:ImageHeight": "6"}
    w3, h3 = svc._fill_dims_from_exif(ex, None, None, lambda x: int(x))
    assert (w3, h3) == (5, 6)
    assert svc._pick_first_coerced(ex, ("bad", "Image:ImageWidth"), lambda x: int(x) if x else None) == 5


def test_proxy_methods(monkeypatch, tmp_path):
    svc = _svc()
    monkeypatch.setattr(m, "retry_extract_rating_tags_only", lambda exif, path, logger, scan_id=None: Result.Ok({"rating": 5}))
    assert svc.extract_rating_tags_only("a").ok

    p = tmp_path / "a.bin"
    p.write_text("x")
    monkeypatch.setattr(m, "retry_fill_other_batch_results", lambda results, paths, get_info: results.update({p: Result.Ok(get_info(p)) for p in paths}))
    r = {}
    svc._fill_other_batch_results(r, [str(p)])
    assert str(p) in r
