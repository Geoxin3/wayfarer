from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Numeric, String, Text, UniqueConstraint

from app.core.database import Base


class Destination(Base):
    __tablename__ = "destinations"

    __table_args__ = (
        UniqueConstraint(
            "name",
            "location",
            name="uq_destination_name_location",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    location: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    estimated_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    best_time_to_visit: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )