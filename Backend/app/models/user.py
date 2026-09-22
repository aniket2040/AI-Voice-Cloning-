from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    voice_profiles: Mapped[list["VoiceProfile"]] = relationship(
        "VoiceProfile",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    generations: Mapped[list["Generation"]] = relationship(
        "Generation",
        back_populates="user",
        cascade="all, delete-orphan",
    )