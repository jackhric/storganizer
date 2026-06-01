"""Record ID generation.

Mirrors PocketBase's identifier shape — a 15-character lowercase
alphanumeric string — so existing data can be migrated across without
rewriting primary keys or foreign keys.
"""

import secrets
import string

_ALPHABET = string.ascii_lowercase + string.digits
_ID_LENGTH = 15


def generate_id() -> str:
    """Return a random 15-char [a-z0-9] identifier."""
    return "".join(secrets.choice(_ALPHABET) for _ in range(_ID_LENGTH))
