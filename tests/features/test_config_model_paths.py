from mjr_am_backend import config


def test_get_registered_model_paths_reads_folder_paths(monkeypatch):
    class _FolderPaths:
        @staticmethod
        def get_folder_paths(category):
            if category == "checkpoints":
                return ["./models/checkpoints"]
            if category == "loras":
                return ["./models/loras"]
            return []

    monkeypatch.setitem(__import__("sys").modules, "folder_paths", _FolderPaths)

    result = config.get_registered_model_paths()

    assert "checkpoints" in result
    assert "loras" in result
    assert all(isinstance(v, list) for v in result.values())


def test_get_registered_model_paths_handles_missing_module(monkeypatch):
    monkeypatch.delitem(__import__("sys").modules, "folder_paths", raising=False)
    import builtins

    real_import = builtins.__import__

    def _fake_import(name, *args, **kwargs):
        if name == "folder_paths":
            raise ImportError("missing folder_paths")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", _fake_import)

    result = config.get_registered_model_paths()

    assert result == {}
