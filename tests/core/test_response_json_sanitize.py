import json
import math

from mjr_am_backend.routes.core.response import _json_response
from mjr_am_backend.shared import Result


def test_json_response_sanitizes_non_finite_floats():
    result = Result.Ok(
        {
            "a": math.nan,
            "b": math.inf,
            "c": -math.inf,
            "nested": {"x": math.nan},
            "items": [1.0, math.nan, {"y": math.inf}],
        }
    )
    response = _json_response(result)
    payload = json.loads(response.text)
    data = payload["data"]

    assert data["a"] is None
    assert data["b"] is None
    assert data["c"] is None
    assert data["nested"]["x"] is None
    assert data["items"][1] is None
    assert data["items"][2]["y"] is None
