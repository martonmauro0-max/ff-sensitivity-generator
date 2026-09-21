from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.admin_models import AdminLog


def create_admin_log(
    db: Session,
    admin_id: int,
    action: str,
    description: str,
    resource: str | None = None,
    resource_id: int | None = None,
):
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        description=description,
        resource=resource,
        resource_id=resource_id,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log
