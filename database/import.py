"""
CLI 工具：從檔案系統批次匯入全人 JSON 到資料庫。
匯入邏輯統一使用 logic/app/db/importer.py。
"""
import json
import os
import sys

from dotenv import load_dotenv

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_ROOT, ".env"))

sys.path.insert(0, os.path.join(_ROOT, "logic"))

from app.db.importer import import_student_json  # noqa: E402


def load_json(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    default_dir = os.path.join(_ROOT, "data")
    paths = sys.argv[1:] if len(sys.argv) > 1 else [
        os.path.join(default_dir, f)
        for f in os.listdir(default_dir)
        if f.startswith("exportStudentData") and f.endswith(".json")
    ]

    if not paths:
        print("No input files found.", file=sys.stderr)
        sys.exit(1)

    for path in paths:
        print(f"Importing {path} ...")
        data = load_json(path)
        try:
            student_id = import_student_json(data)
            print(f"  Done: student_id={student_id}")
        except Exception as e:
            print(f"  Error: {e}", file=sys.stderr)
            raise


if __name__ == "__main__":
    main()
