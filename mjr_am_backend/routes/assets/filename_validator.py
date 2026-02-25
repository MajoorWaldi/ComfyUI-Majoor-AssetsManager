"""Filename validation helpers extracted from handlers/assets.py."""

_WINDOWS_RESERVED = {
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
}


def normalize_filename(name: str) -> str:
    if not name:
        return ""
    return name.strip()


def filename_separator_error(name: str) -> str:
    if "/" in name or "\\" in name:
        return "Filename cannot contain path separators"
    return ""


def filename_char_error(name: str) -> str:
    if "\x00" in name:
        return "Filename cannot contain null bytes"
    if any(ord(char) < 32 for char in name):
        return "Filename cannot contain control characters"
    return ""


def filename_boundary_error(name: str) -> str:
    if name.startswith('.') or name.startswith(' '):
        return "Filename cannot start with dot or space"
    if name.endswith('.') or name.endswith(' '):
        return "Filename cannot end with dot or space"
    return ""


def filename_reserved_error(name: str) -> str:
    base = name.split('.')[0].upper()
    if base in _WINDOWS_RESERVED:
        return "Filename uses a reserved Windows name"
    return ""


def validate_filename(name: str) -> tuple[bool, str]:
    normalized = normalize_filename(name)
    if not normalized:
        return False, "Filename cannot be empty"
    separator_error = filename_separator_error(normalized)
    if separator_error:
        return False, separator_error
    char_error = filename_char_error(normalized)
    if char_error:
        return False, char_error
    boundary_error = filename_boundary_error(normalized)
    if boundary_error:
        return False, boundary_error
    reserved_error = filename_reserved_error(normalized)
    if reserved_error:
        return False, reserved_error
    return True, ""
