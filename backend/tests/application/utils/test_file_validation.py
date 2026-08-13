import io
import zipfile
import pytest

from app.application.utils.file_validation import (
    validate_zip_format,
    validate_zip_contains_ground_truth_csv,
    get_effective_content_type,
    validate_csv_format,
)

# Helper function to create in-memory zip
def create_zip(files: dict, malicious_headers=None) -> bytes:
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for fname, fdata in files.items():
            zf.writestr(fname, fdata)
            
    if malicious_headers:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for info, fdata in malicious_headers:
                zf.writestr(info, fdata)
    return zip_buffer.getvalue()

def test_get_effective_content_type():
    assert get_effective_content_type('test.zip', 'text/csv') == 'application/zip'
    assert get_effective_content_type('test.csv', 'text/csv') == 'text/csv'
    assert get_effective_content_type('test.csv', None) is None

def test_validate_csv_format():
    valid_csv = b"header1,header2\nvalue1,value2\n"
    validate_csv_format(valid_csv, 'test.csv')

    with pytest.raises(ValueError, match="File CSV rỗng"):
        validate_csv_format(b"", 'test.csv')

    with pytest.raises(ValueError, match="Chỉ chấp nhận file định dạng .csv"):
        validate_csv_format(valid_csv, 'test.txt')

    with pytest.raises(ValueError, match="1 dòng header và 1 dòng dữ liệu"):
        validate_csv_format(b"header1,header2\n", 'test.csv')

def test_validate_zip_format():
    valid_zip = create_zip({'test.txt': b'Hello world'})
    validate_zip_format(valid_zip, 'test.zip')

    with pytest.raises(ValueError, match="File ZIP rỗng"):
        validate_zip_format(b"", 'test.zip')

    with pytest.raises(ValueError, match="Chỉ chấp nhận file định dạng .zip"):
        validate_zip_format(valid_zip, 'test.txt')

    empty_structure = io.BytesIO()
    with zipfile.ZipFile(empty_structure, 'w') as zf:
        pass
    with pytest.raises(ValueError, match="File ZIP rỗng, không chứa file nào"):
        validate_zip_format(empty_structure.getvalue(), 'test.zip')

    info = zipfile.ZipInfo('../etc/passwd')
    malicious_zip = create_zip({}, [(info, b'hack')])
    with pytest.raises(ValueError, match="Không được chứa '\\.\\.'"):
        validate_zip_format(malicious_zip, 'test.zip')

    info = zipfile.ZipInfo('/etc/passwd')
    malicious_zip = create_zip({}, [(info, b'hack')])
    with pytest.raises(ValueError, match="Không được chứa '\\.\\.' hoặc đường dẫn tuyệt đối"):
        validate_zip_format(malicious_zip, 'test.zip')

    info = zipfile.ZipInfo('foo/../../etc/passwd')
    malicious_zip = create_zip({}, [(info, b'hack')])
    with pytest.raises(ValueError, match="Không được chứa '\\.\\.'"):
        validate_zip_format(malicious_zip, 'test.zip')

    data = b'0' * 1024 * 200
    bomb_zip = create_zip({'bomb.txt': data})
    with pytest.raises(ValueError, match="Zip Bomb"):
        validate_zip_format(bomb_zip, 'test.zip')

    with pytest.raises(ValueError, match="vượt quá giới hạn"):
        validate_zip_format(valid_zip, 'test.zip', max_file_count=0)

    with pytest.raises(ValueError, match="vượt quá giới hạn"):
        validate_zip_format(valid_zip, 'test.zip', max_uncompressed_mb=0)

def test_validate_zip_contains_ground_truth_csv():
    valid_csv = b"filename,label,Usage\n1.jpg,cat,Public\n"
    valid_zip = create_zip({'ground_truth.csv': valid_csv})
    validate_zip_contains_ground_truth_csv(valid_zip)

    missing_csv = create_zip({'other.csv': valid_csv})
    with pytest.raises(ValueError, match="phải chứa file 'ground_truth.csv'"):
        validate_zip_contains_ground_truth_csv(missing_csv)

    invalid_csv = b"filename,label\n1.jpg,cat\n"
    invalid_zip = create_zip({'ground_truth.csv': invalid_csv})
    with pytest.raises(ValueError, match="thiếu cột 'Usage'"):
        validate_zip_contains_ground_truth_csv(invalid_zip)
