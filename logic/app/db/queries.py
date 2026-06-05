# 封裝所有對於 DB 的查詢，但不具有判斷邏輯
from sqlalchemy import select

from app.config import get_session
from app.models import AllCourse, CourseRecord, CsGroup, RequiredCourse, Student


def fetch_student(student_id: str):
    with get_session() as session:
        student = session.get(Student, student_id)
        if student is None:
            return None
        return {col.name: getattr(student, col.name) for col in Student.__table__.columns}


def _resolve_category(is_general: bool, is_defense: bool, is_required: bool, is_group: bool) -> str:
    if is_required:
        return "必修"
    if is_group:
        return "群修"
    if is_general:
        return "通識"
    if is_defense:
        return "國防"
    return "選修"


def fetch_course_records(student_id: str, latest_only: bool = True) -> list[dict]:
    """Fetch course records for a student.

    latest_only=True  → one row per course_code (latest attempt), used by audit logic.
    latest_only=False → all attempts across all semesters, used by GPA calculation.
    """
    stmt = (
        select(
            CourseRecord.course_code,
            CourseRecord.score,
            CourseRecord.course_status,
            CourseRecord.academic_year,
            CourseRecord.academic_semester,
            CourseRecord.is_general,
            CourseRecord.is_defense,
            AllCourse.course_name,
            AllCourse.credit,
        )
        .join(AllCourse, CourseRecord.course_code == AllCourse.course_code)
        .where(CourseRecord.student_id == student_id)
        .order_by(
            CourseRecord.course_code,
            CourseRecord.academic_year.desc(),
            CourseRecord.academic_semester.desc(),
        )
    )
    if latest_only:
        stmt = stmt.distinct(CourseRecord.course_code)

    with get_session() as session:
        rows = session.execute(stmt).all()

        required_codes = {
            code for (code,) in session.execute(select(RequiredCourse.course_code)).all()
        }
        group_codes = {
            code for (code,) in session.execute(select(CsGroup.course_code)).all()
        }

    return [
        {
            "course_code": row.course_code,
            "score": row.score,
            "course_status": row.course_status,
            "academic_year": row.academic_year,
            "academic_semester": row.academic_semester,
            "academic_year_semester": f"{row.academic_year}{row.academic_semester}",
            "course_name": row.course_name,
            "credit": float(row.credit),
            "category": _resolve_category(
                is_general=row.is_general,
                is_defense=row.is_defense,
                is_required=row.course_code in required_codes,
                is_group=row.course_code in group_codes,
            ),
        }
        for row in rows
    ]


def fetch_required_courses(dept: str, year: str) -> list[tuple[str, str]]:
    """Returns list of (course_code, course_name) for each required course entry."""
    stmt = (
        select(RequiredCourse.course_code, RequiredCourse.course_name)
        .where(
            RequiredCourse.take_in_dept == dept,
            RequiredCourse.take_in_year == year,
        )
        .order_by(RequiredCourse.required_uid)
    )
    with get_session() as session:
        return [(code, name) for code, name in session.execute(stmt).all()]


def fetch_group_names(year: str) -> dict[str, list[str]]:
    stmt = (
        select(CsGroup.course_class, CsGroup.course_name)
        .where(CsGroup.take_in_year == year)
        .order_by(CsGroup.course_class, CsGroup.group_uid)
    )
    with get_session() as session:
        result: dict[str, list[str]] = {}
        for course_class, course_name in session.execute(stmt).all():
            result.setdefault(course_class, []).append(course_name)
        return result
