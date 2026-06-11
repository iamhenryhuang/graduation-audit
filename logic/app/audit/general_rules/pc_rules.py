# 這個檔案實作體育課的成績判斷
from app.db.queries import fetch_course_records

PASS = 60.0
PHYSICAL_REQUIRED_CREDITS = 4.0
PHYSICAL_COURSE_KEYWORD = "體育["


def _is_passed(course: dict) -> bool:
    score = course["score"]
    return (score is not None and score >= PASS) or course["course_status"] == "通過"


def Physical(student_id: str, assume_ungraded_passed: bool = False) -> dict:
    courses = fetch_course_records(student_id, assume_ungraded_passed=assume_ungraded_passed)

    passed_courses = []
    for course in courses:
        if PHYSICAL_COURSE_KEYWORD not in course["course_name"]:
            continue
        if not _is_passed(course):
            continue
        passed_courses.append(
            {
                "course_name": course["course_name"],
                "course_code": course["course_code"],
                "credit": float(course["credit"]),
            }
        )

    total_credits = sum(course["credit"] for course in passed_courses)
    used_credits = min(total_credits, PHYSICAL_REQUIRED_CREDITS)

    return {
        "required_credits": PHYSICAL_REQUIRED_CREDITS,
        "total_credits": total_credits,
        "used_credits": used_credits,
        "is_passed": total_credits >= PHYSICAL_REQUIRED_CREDITS,
        "shortage": max(0.0, PHYSICAL_REQUIRED_CREDITS - total_credits),
        "used_courses": [course["course_name"] for course in passed_courses],
        "courses": passed_courses,
    }


def print_physical_audit(student_id: str) -> None:
    result = Physical(student_id)
    print(f"體育: {result['used_credits']:.1f}/{result['required_credits']:.1f}")
    print(f"體育尚缺: {result['shortage']:.1f}")
    print(
        "體育已採計課程: "
        f"{', '.join(result['used_courses']) if result['used_courses'] else '無'}"
    )


def main():
    print_physical_audit("112703034")


if __name__ == "__main__":
    main()