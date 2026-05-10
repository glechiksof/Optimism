from datetime import datetime
from uuid import UUID

from sqlalchemy import String, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    tournaments: Mapped[list["Tournament"]] = relationship(back_populates="organizer")
    teams_created: Mapped[list["Team"]] = relationship(back_populates="creator")
