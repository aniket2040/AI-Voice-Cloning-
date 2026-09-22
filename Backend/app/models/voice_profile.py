from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VoiceStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    processed_audio_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reference_codes_path: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reference_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[VoiceStatus] = mapped_column(
        SQLEnum(VoiceStatus),
        nullable=False,
        default=VoiceStatus.UPLOADED,
        index=True,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="neutts",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="voice_profiles",
    )

    generations: Mapped[list["Generation"]] = relationship(
        "Generation",
        back_populates="voice",
    )