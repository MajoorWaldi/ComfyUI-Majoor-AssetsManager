import pytest
from mjr_am_backend.routes.search import listing_workflow_scope
from mjr_am_shared import Result


@pytest.mark.asyncio
async def test_handle_workflow_scope_applies_missing_favorite_and_tag_filters(monkeypatch):
    cards = [
        {
            "display_name": "One",
            "task": "T2I",
            "model_family": "Flux",
            "provider": "",
            "runs_on": "local",
            "missing_nodes_count": 1,
            "missing_models_count": 0,
            "favorite": True,
            "tags": ["cinematic", "flux"],
        },
        {
            "display_name": "Two",
            "task": "T2I",
            "model_family": "Flux",
            "provider": "",
            "runs_on": "local",
            "missing_nodes_count": 0,
            "missing_models_count": 0,
            "favorite": False,
            "tags": ["portrait"],
        },
    ]

    def _list_workflows(**kwargs):
        return Result.Ok({"assets": list(cards), "count": len(cards), "total": len(cards)})

    monkeypatch.setattr(listing_workflow_scope, "list_workflows", _list_workflows)

    response = await listing_workflow_scope.handle_workflow_scope(
        query="*",
        limit=20,
        offset=0,
        sort_key="mtime_desc",
        subfolder="",
        filters={"missing": "true", "favorite": "1", "tag": "cinematic"},
        json_response=lambda payload: payload,
    )

    assert response.ok
    assets = response.data["assets"]
    assert len(assets) == 1
    assert assets[0]["display_name"] == "One"


@pytest.mark.asyncio
async def test_handle_workflow_scope_parses_multi_tag_filter(monkeypatch):
    cards = [
        {
            "display_name": "Tagged",
            "task": "T2I",
            "model_family": "Flux",
            "provider": "",
            "runs_on": "local",
            "missing_nodes_count": 0,
            "missing_models_count": 0,
            "favorite": False,
            "tags": ["cinematic", "flux", "detail"],
        },
        {
            "display_name": "Partial",
            "task": "T2I",
            "model_family": "Flux",
            "provider": "",
            "runs_on": "local",
            "missing_nodes_count": 0,
            "missing_models_count": 0,
            "favorite": False,
            "tags": ["cinematic"],
        },
    ]

    def _list_workflows(**kwargs):
        return Result.Ok({"assets": list(cards), "count": len(cards), "total": len(cards)})

    monkeypatch.setattr(listing_workflow_scope, "list_workflows", _list_workflows)

    response = await listing_workflow_scope.handle_workflow_scope(
        query="*",
        limit=20,
        offset=0,
        sort_key="mtime_desc",
        subfolder="",
        filters={"tag": "cinematic, flux"},
        json_response=lambda payload: payload,
    )

    assert response.ok
    assets = response.data["assets"]
    assert len(assets) == 1
    assert assets[0]["display_name"] == "Tagged"
