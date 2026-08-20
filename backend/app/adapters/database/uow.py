from sqlalchemy.orm import Session
from app.application.interfaces.repositories import IUnitOfWork

class SQLUnitOfWork(IUnitOfWork):
    """
    Implementation của Unit of Work Pattern sử dụng SQLAlchemy Session.
    """
    def __init__(self, db: Session):
        self.db = db

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
