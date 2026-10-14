from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DestinationMonth(Base):
    __tablename__ = "destination_months"

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id", ondelete="CASCADE"),
        primary_key=True,
    )

    month: Mapped[int] = mapped_column(
        primary_key=True,
    )