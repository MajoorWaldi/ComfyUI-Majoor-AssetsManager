import json

import pytest

from backend.features.audio.metadata import extract_audio_metadata
from shared.types import classify_file


@pytest.mark.asyncio
async def test_audio_classification_supports_aiff_and_aif() -> None:
    assert classify_file("track.aiff") == "audio"
    assert classify_file("track.aif") == "audio"


@pytest.mark.asyncio
async def test_audio_extractor_reads_generation_json_from_tags(tmp_path) -> None:
    audio = tmp_path / "track.m4a"
    audio.write_bytes(b"")

    workflow = {"nodes": [{"id": 1, "type": "SaveAudio"}], "links": []}
    prompt = {
        "1": {"class_type": "LoadAudio", "inputs": {}},
        "2": {"class_type": "SaveAudio", "inputs": {"audio": ["1", 0]}},
    }
    exif = {
        "QuickTime:Workflow": json.dumps(workflow),
        "QuickTime:Prompt": json.dumps(prompt),
    }
    ffprobe = {
        "audio_stream": {"codec_name": "aac", "sample_rate": "48000", "channels": 2},
        "format": {"duration": "3.2", "bit_rate": "192000"},
    }

    res = extract_audio_metadata(str(audio), exif_data=exif, ffprobe_data=ffprobe)
    assert res.ok
    assert isinstance(res.data.get("workflow"), dict)
    assert isinstance(res.data.get("prompt"), dict)
    assert res.data.get("audio_codec") == "aac"
    assert str(res.data.get("duration")) == "3.2"


@pytest.mark.asyncio
async def test_audio_extractor_parses_wrapped_comment_payload_for_mp3_tts(tmp_path) -> None:
    audio = tmp_path / "tts_track.mp3"
    audio.write_bytes(b"")

    workflow = {"nodes": [{"id": 1, "type": "SaveAudio"}], "links": []}
    prompt = {
        "1": {"class_type": "TTSLoader", "inputs": {}},
        "2": {"class_type": "SaveAudio", "inputs": {"audio": ["1", 0]}},
    }
    wrapped = {"workflow": workflow, "prompt": json.dumps(prompt)}
    exif = {"ID3:Comment": json.dumps(wrapped)}
    ffprobe = {"audio_stream": {"codec_name": "mp3"}}

    res = extract_audio_metadata(str(audio), exif_data=exif, ffprobe_data=ffprobe)
    assert res.ok
    assert isinstance(res.data.get("workflow"), dict)
    assert isinstance(res.data.get("prompt"), dict)
    assert res.data.get("quality") == "full"


@pytest.mark.asyncio
async def test_audio_extractor_reads_prompt_from_ffprobe_stream_tags(tmp_path) -> None:
    audio = tmp_path / "tts_stream_tags.mp3"
    audio.write_bytes(b"")

    prompt = {
        "10": {"class_type": "CLIPTextEncode", "inputs": {"text": "hello voice"}},
        "11": {"class_type": "SaveAudio", "inputs": {"audio": ["10", 0]}},
    }
    ffprobe = {
        "audio_stream": {"codec_name": "mp3"},
        "streams": [{"codec_type": "audio", "tags": {"Prompt": json.dumps(prompt)}}],
        "format": {"duration": "1.2"},
    }

    res = extract_audio_metadata(str(audio), exif_data={}, ffprobe_data=ffprobe)
    assert res.ok
    assert isinstance(res.data.get("prompt"), dict)
    assert res.data["prompt"]["10"]["class_type"] == "CLIPTextEncode"
