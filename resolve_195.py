import os

def fix_migration():
    path = "backend/alembic/versions/20260814_0026_e58789d78e68_add_updated_at_to_contests.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    old_up = """def upgrade() -> None:
    pass"""
    new_up = """def upgrade() -> None:
    op.add_column('contests', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))"""
    
    old_down = """def downgrade() -> None:
    pass"""
    new_down = """def downgrade() -> None:
    op.drop_column('contests', 'updated_at')"""

    content = content.replace(old_up, new_up).replace(old_down, new_down)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_entities():
    path = "backend/app/domain/entities/entities.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # ContestEntity
    old_entity = """    created_by: uuid.UUID
    created_at: datetime  # Must be timezone-aware
    deleted_at: datetime | None = None"""
    new_entity = """    created_by: uuid.UUID
    created_at: datetime  # Must be timezone-aware
    updated_at: datetime | None = None
    deleted_at: datetime | None = None"""
    content = content.replace(old_entity, new_entity)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_models():
    path = "backend/app/adapters/database/models.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_model = """    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)"""
    new_model = """    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)"""
    content = content.replace(old_model, new_model)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_dtos():
    path = "backend/app/application/dtos/contest_dtos.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_dto = """    end_time: Optional[AwareDatetime] = None
    created_at: AwareDatetime
    created_by: uuid.UUID"""
    new_dto = """    end_time: Optional[AwareDatetime] = None
    created_at: AwareDatetime
    updated_at: Optional[AwareDatetime] = None
    created_by: uuid.UUID"""
    content = content.replace(old_dto, new_dto)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_usecase():
    path = "backend/app/application/use_cases/contest_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_to_dto = """            end_time=entity.end_time,
            created_at=entity.created_at,
            created_by=entity.created_by,"""
    new_to_dto = """            end_time=entity.end_time,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            created_by=entity.created_by,"""
    content = content.replace(old_to_dto, new_to_dto)
    
    old_update = """        # Business rule: sau khi patch, end_time phải sau start_time (nếu có)
        if entity.end_time is not None and entity.end_time <= entity.start_time:
            raise ValueError("end_time phải sau start_time.")

        saved_entity = self._contest_repo.save(entity)"""
    new_update = """        # Business rule: sau khi patch, end_time phải sau start_time (nếu có)
        if entity.end_time is not None and entity.end_time <= entity.start_time:
            raise ValueError("end_time phải sau start_time.")

        entity.updated_at = datetime.now(timezone.utc)
        saved_entity = self._contest_repo.save(entity)"""
    content = content.replace(old_update, new_update)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_migration()
fix_entities()
fix_models()
fix_dtos()
fix_usecase()
print("Success")
