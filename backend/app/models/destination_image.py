from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DestinationImage(Base):
    __tablename__ = "destination_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    image_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    destination: Mapped["Destination"] = relationship(
        back_populates="images",
    )