def test_routes_compat_exports_smoke():
    import mjr_am_backend.routes_compat as rc

    assert callable(rc.register_routes)
    assert rc.folder_paths is not None
    assert rc.PromptServer is not None
    assert "_normalize_path" in rc.__all__
