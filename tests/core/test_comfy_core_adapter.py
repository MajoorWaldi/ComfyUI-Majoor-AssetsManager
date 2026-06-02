import sys
from types import SimpleNamespace

from mjr_am_backend.adapters.comfy_core import ComfyCoreAdapter


def test_comfy_core_adapter_degrades_without_server(monkeypatch):
    monkeypatch.delitem(sys.modules, "server", raising=False)

    adapter = ComfyCoreAdapter()
    caps = adapter.capabilities().as_dict()

    assert caps["prompt_server"] is False
    assert caps["app"] is False
    assert caps["websocket"] is False
    assert caps["feature_flags"] == {}
    assert adapter.send_event("mjr-test", {"ok": True}) is False
    assert adapter.get_queue_info() is None


def test_comfy_core_adapter_reads_prompt_server_and_sends(monkeypatch):
    sent = []

    class _PromptServer:
        instance = SimpleNamespace(
            app=object(),
            routes=object(),
            user_manager=object(),
            send_sync=lambda event, data, sid=None: sent.append((event, data, sid)),
            get_queue_info=lambda: {"queue_remaining": 2},
        )

    monkeypatch.setitem(sys.modules, "server", SimpleNamespace(PromptServer=_PromptServer))

    adapter = ComfyCoreAdapter()
    caps = adapter.capabilities().as_dict()

    assert caps["prompt_server"] is True
    assert caps["app"] is True
    assert caps["routes"] is True
    assert caps["user_manager"] is True
    assert caps["websocket"] is True
    assert caps["queue_info"] is True
    assert adapter.get_queue_info() == {"queue_remaining": 2}
    assert adapter.send_event("mjr-test", {"ok": True}, "sid-1") is True
    assert sent == [("mjr-test", {"ok": True}, "sid-1")]


def test_comfy_core_adapter_extracts_output_paths_from_history(monkeypatch, tmp_path):
    out = tmp_path / "output"
    out.mkdir()
    image = out / "sub" / "a.png"
    image.parent.mkdir()
    image.write_bytes(b"x")

    class _PromptQueue:
        def get_history(self, prompt_id=None):
            return {
                prompt_id: {
                    "prompt": [
                        1,
                        prompt_id,
                        {"9": {"class_type": "SaveImage"}},
                    ],
                    "outputs": {
                        "9": {
                            "images": [
                                {"filename": "a.png", "subfolder": "sub", "type": "output"},
                                {"filename": "../blocked.png", "subfolder": "", "type": "output"},
                            ]
                        }
                    }
                }
            }

    class _PromptServer:
        instance = SimpleNamespace(prompt_queue=_PromptQueue())

    monkeypatch.setitem(sys.modules, "server", SimpleNamespace(PromptServer=_PromptServer))
    monkeypatch.setitem(
        sys.modules,
        "folder_paths",
        SimpleNamespace(get_directory_by_type=lambda item_type: str(out) if item_type == "output" else None),
    )

    adapter = ComfyCoreAdapter()

    assert adapter.output_file_paths_from_history("prompt-3") == [str(image.resolve(strict=False))]
    refs = adapter.output_files_from_history("prompt-3")
    assert refs[0].node_id == "9"
    assert refs[0].node_type == "SaveImage"


def test_comfy_core_adapter_reads_input_output_directories(monkeypatch, tmp_path):
    inp = tmp_path / "input"
    out = tmp_path / "output"
    monkeypatch.setitem(
        sys.modules,
        "folder_paths",
        SimpleNamespace(
            get_input_directory=lambda: str(inp),
            get_output_directory=lambda: str(out),
        ),
    )

    adapter = ComfyCoreAdapter()

    assert adapter.get_input_directory() == str(inp)
    assert adapter.get_output_directory() == str(out)


def test_comfy_core_adapter_reads_temp_directory(monkeypatch, tmp_path):
    temp = tmp_path / "temp"
    monkeypatch.setitem(
        sys.modules,
        "folder_paths",
        SimpleNamespace(get_directory_by_type=lambda item_type: str(temp) if item_type == "temp" else None),
    )

    adapter = ComfyCoreAdapter()

    assert adapter.get_temp_directory() == str(temp)
