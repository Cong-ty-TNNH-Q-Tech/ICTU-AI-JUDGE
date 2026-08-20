from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.adapters.database.models import UserModel, ChallengeModel
from app.domain.entities.entities import UserRole, ChallengeType, ChallengeStatus, MetricDirection

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(UserModel).filter(UserModel.email == "admin@ictu.edu.vn").first()
        if not admin:
            admin = UserModel(
                email="admin@ictu.edu.vn",
                student_id="ADMIN",
                password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", # admin123
                full_name="Admin",
                role=UserRole.ADMIN.value
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Admin created: {admin.id}")
        else:
            print(f"Admin already exists: {admin.id}")
            
        # Check if challenges exist
        challenge = db.query(ChallengeModel).first()
        if not challenge:
            c1 = ChallengeModel(
                title="Phân loại ảnh Chó Mèo với CNN",
                description="Cuộc thi xây dựng mô hình Deep Learning để phân loại ảnh chó và mèo. \n\n## Mục tiêu\n\nPhân loại ảnh chó mèo với độ chính xác cao nhất.",
                type=ChallengeType.PUBLIC.value,
                status=ChallengeStatus.PUBLISHED.value,
                start_time=datetime.now(timezone.utc) - timedelta(days=1),
                end_time=datetime.now(timezone.utc) + timedelta(days=5),
                rate_limit_minutes=10,
                max_file_size_mb=50,
                metric_name="Accuracy",
                metric_direction=MetricDirection.HIGHER_IS_BETTER.value,
                created_by=admin.id
            )
            db.add(c1)
            db.commit()
            print(f"Challenge created: {c1.id}")
        else:
            print(f"Challenge already exists: {challenge.id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed()
