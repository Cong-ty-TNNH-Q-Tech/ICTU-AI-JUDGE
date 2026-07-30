"""
Shared file validation utilities for Use Cases.
[SECURITY] Validate at Use Case layer before files reach storage or sandbox.
"""
import csv
import io
import uuid
import zipfile

from app.core.config import get_settings


def validate_csv_format(file_bytes: bytes, filename: str) -> None:
    """
    Validate cơ bản định dạng CSV:
    - File không rỗng
    - Có thể parse được bằng csv.reader
    - Có ít nhất 1 header row và 1 data row
    Raises ValueError nếu không hợp lệ.
    [NOTE] Lỗi format sâu hơn (sai cột/dòng so với Ground Truth)
    được Worker phát hiện và set status=FAILED (E2 trong UC04).
    """
    if not file_bytes:
        raise ValueError("File CSV rỗng, vui lòng kiểm tra lại.")

    if not filename.lower().endswith(".csv"):
        raise ValueError("Chỉ chấp nhận file định dạng .csv")

    try:
        text_stream = io.TextIOWrapper(io.BytesIO(file_bytes), encoding="utf-8", errors="replace")
        reader = csv.reader(text_stream)

        row1 = next(reader, None)
        row2 = next(reader, None)

        if not row1:
            raise ValueError("File CSV rỗng, không có dòng nào.")
        if not row2:
            raise ValueError("File CSV cần có ít nhất 1 dòng header và 1 dòng dữ liệu.")

    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError(f"Không thể đọc file CSV: {exc}") from exc


def validate_zip_format(file_bytes: bytes, filename: str) -> None:
    """
    Validate file .zip:
    - Không corrupt
    - Chống Path Traversal (tên file không được chứa '..' hoặc bắt đầu bằng '/')
    - Chống Zip Bomb (tổng size giải nén ≤ ZIP_MAX_UNCOMPRESSED_MB, số file ≤ ZIP_MAX_FILE_COUNT)
    - Phải có ít nhất 1 file bên trong
    Raises ValueError nếu không hợp lệ.
    """
    settings = get_settings()

    if not file_bytes:
        raise ValueError("File ZIP rỗng, vui lòng kiểm tra lại.")

    if not filename.lower().endswith(".zip"):
        raise ValueError("Chỉ chấp nhận file định dạng .zip")

    try:
        zip_buffer = io.BytesIO(file_bytes)
        with zipfile.ZipFile(zip_buffer) as zf:
            infolist = zf.infolist()
            if not infolist:
                raise ValueError("File ZIP rỗng, không chứa file nào.")

            total_uncompressed = 0
            for info in infolist:
                name = info.filename
                # [SECURITY] Path Traversal
                if '..' in name or name.startswith('/'):
                    raise ValueError(
                        f"Tên file không hợp lệ trong ZIP: '{name}'. "
                        "Không được chứa '..' hoặc đường dẫn tuyệt đối."
                    )
                total_uncompressed += info.file_size

            # [SECURITY] Zip Bomb
            max_bytes = settings.ZIP_MAX_UNCOMPRESSED_MB * 1024 * 1024
            if total_uncompressed > max_bytes:
                raise ValueError(
                    f"Tổng dung lượng giải nén ({total_uncompressed / 1024 / 1024:.1f}MB) "
                    f"vượt quá giới hạn {settings.ZIP_MAX_UNCOMPRESSED_MB}MB."
                )

            if len(infolist) > settings.ZIP_MAX_FILE_COUNT:
                raise ValueError(
                    f"Số lượng file trong ZIP ({len(infolist)}) "
                    f"vượt quá giới hạn {settings.ZIP_MAX_FILE_COUNT} file."
                )
    except zipfile.BadZipFile as exc:
        raise ValueError(f"File ZIP bị hỏng hoặc không đúng định dạng: {exc}") from exc
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Không thể đọc file ZIP: {exc}") from exc


def validate_zip_contains_ground_truth_csv(file_bytes: bytes) -> None:
    """
    Kiểm tra zip có chứa file 'ground_truth.csv' (bắt buộc cho GT zip).
    Raises ValueError nếu không tìm thấy.
    """
    try:
        zip_buffer = io.BytesIO(file_bytes)
        with zipfile.ZipFile(zip_buffer) as zf:
            names = [info.filename for info in zf.infolist() if not info.is_dir()]
            if "ground_truth.csv" not in names:
                raise ValueError(
                    "File ZIP của Ground Truth phải chứa file 'ground_truth.csv' "
                    "để hệ thống phân định Public/Private và chấm điểm. "
                    f"Các file tìm thấy: {names[:10]}..."
                )
    except zipfile.BadZipFile as exc:
        raise ValueError(f"File ZIP bị hỏng hoặc không đúng định dạng: {exc}") from exc
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Không thể đọc file ZIP: {exc}") from exc


def build_s3_key(
    challenge_id: uuid.UUID,
    team_id: uuid.UUID,
    submission_id: uuid.UUID,
    filename: str,
) -> str:
    """Tạo S3 object key theo cấu trúc chuẩn."""
    return f"submissions/{challenge_id}/{team_id}/{submission_id}/{filename}"


def get_effective_content_type(filename: str, fallback: str = "text/csv") -> str:
    """Trả về content-type phù hợp dựa trên extension của file."""
    if filename.lower().endswith(".zip"):
        return "application/zip"
    return fallback
