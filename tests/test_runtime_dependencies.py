from pathlib import Path

import pytest
from packaging.requirements import Requirement

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize(
    ("version", "allowed"),
    [("10.0.0", False), ("12.3.0", False), ("13.0.0", True)],
)
def test_pillow_security_constraint(version, allowed):
    requirements = (ROOT / "requirements.txt").read_text(encoding="utf-8").splitlines()
    pillow_requirement = next(line for line in requirements if line.startswith("pillow"))
    pillow = Requirement(pillow_requirement)

    assert (version in pillow.specifier) is allowed
    assert f'"{pillow_requirement}",' in (ROOT / "pyproject.toml").read_text(encoding="utf-8")
