"""Import every ORM model so `Base.metadata` is fully populated and mappers
are configured. Imported by app startup, Alembic, and the test harness.
"""

import src.assignments.models  # noqa: F401
import src.cells.models  # noqa: F401
import src.devices.models  # noqa: F401
import src.items.models  # noqa: F401
import src.settings.models  # noqa: F401
import src.tags.models  # noqa: F401
