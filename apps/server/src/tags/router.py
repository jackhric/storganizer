"""Tags have no custom behaviour — plain CRUD — so this is the one resource
that uses FastCRUD's generated router wholesale. Compare with devices/items,
which hand-roll their routers because they carry real logic.

Generated endpoints (mounted under /api by main.py):
    POST   /tags         GET /tags        GET /tags/{id}
    PATCH  /tags/{id}     DELETE /tags/{id}
"""

from fastcrud import crud_router

from src.core.database import get_session
from src.tags.models import Tag
from src.tags.schemas import TagCreate, TagRead, TagUpdate

router = crud_router(
    session=get_session,
    model=Tag,
    create_schema=TagCreate,
    update_schema=TagUpdate,
    select_schema=TagRead,
    path="/tags",
    tags=["tags"],
)
