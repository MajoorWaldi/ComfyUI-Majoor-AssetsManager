"""GenInfo parser orchestrator facade.

Public stable API: parse_geninfo_from_prompt.
Implementation lives in parser_impl.py.
"""

from .parser_impl import parse_geninfo_from_prompt

__all__ = ["parse_geninfo_from_prompt"]
