import os

os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
os.environ["S3_ACCESS_KEY"] = "test"
os.environ["S3_SECRET_KEY"] = "test"
os.environ["SECRET_KEY"] = "test_secret"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
