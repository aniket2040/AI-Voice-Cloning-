from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    voice_id: Mapped[UUID] = mapped_column(
        ForeignKey("voice_profiles.id"),
        nullable=False,
        index=True,
    )

    input_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    audio_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="neutts",
    )

    generation_time: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="generations",
    )

    voice = relationship(
        "VoiceProfile",
        back_populates="generations",
    )