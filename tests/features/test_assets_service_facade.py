from mjr_am_backend.features.assets import service
from mjr_am_backend.features.assets.lookup_service import (
    filepath_db_keys,
    filepath_where_clause,
    load_asset_filepath_by_id,
)
from mjr_am_backend.features.assets.download_service import handle_download_asset, strip_tags_for_ext
from mjr_am_backend.features.assets.path_resolution_service import (
    resolve_delete_target,
    resolve_rename_target,
)
from mjr_am_backend.features.assets.rating_tags_service import resolve_rating_asset_id, sanitize_tags
from mjr_am_backend.features.assets.request_context_service import (
    prepare_asset_ids_context,
    prepare_asset_path_context,
    prepare_asset_rename_context,
    prepare_asset_route_context,
)


def test_service_facade_reexports_split_helpers() -> None:
    assert service.load_asset_filepath_by_id is load_asset_filepath_by_id
    assert service.prepare_asset_route_context is prepare_asset_route_context
    assert service.prepare_asset_path_context is prepare_asset_path_context
    assert service.prepare_asset_rename_context is prepare_asset_rename_context
    assert service.prepare_asset_ids_context is prepare_asset_ids_context
    assert service.resolve_delete_target is resolve_delete_target
    assert service.resolve_rename_target is resolve_rename_target
    assert service.handle_download_asset is handle_download_asset
    assert service.resolve_rating_asset_id is resolve_rating_asset_id
    assert service.sanitize_tags is sanitize_tags


def test_filepath_helpers_keep_normalized_fallback() -> None:
    keys = filepath_db_keys("C:/Temp/Example.PNG")

    assert keys
    assert keys[0] == "C:/Temp/Example.PNG"

    where_clause, params = filepath_where_clause(keys)

    assert "COLLATE NOCASE" in where_clause
    assert params[-1] == keys[0]


def test_download_and_tag_helpers_are_reexported() -> None:
    assert service.strip_tags_for_ext is strip_tags_for_ext
    assert service.sanitize_tags is sanitize_tags