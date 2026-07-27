import pytest
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base

def test_database_session_creation():
    assert engine is not None
    assert SessionLocal is not None
    
    session = SessionLocal()
    assert isinstance(session, Session)
    session.close()

def test_base_declarative():
    # Verify Base has metadata and registry
    assert hasattr(Base, "metadata")
    assert hasattr(Base, "registry")
