# 這個檔案實作通識課的成績判斷
from __future__ import annotations

from functools import lru_cache

from sqlalchemy import False_, func, or_, select
from sqlalchemy.dialects.postgresql import aggregate_order_by

from app.config import get_session
from app.models import (
    AllCourse,
    CourseRecord,
    GeneralCategory,
    GeneralCourse,
    GeneralCourseCategory,
)

DOMAIN_ORDER = ("人文通", "社會通", "自然通")
DOMAIN_MIN_CREDITS = 3.0
DOMAIN_MAX_CREDITS = 7.0
CORE_REQUIRED_COURSES = 2
ENGLISH_REQUIRED_CREDITS = 6.0
CHINESE_MIN_CREDITS = 3.0
CHINESE_MAX_CREDITS = 6.0
GENERAL_TOTAL_WITH_MIN_CHINESE = 19.0
GENERAL_TOTAL_WITH_MAX_CHINESE = 16.0
PASSING_SCORE = 60.0
PASSING_STATUSES = {"通過"}
UNGRADED_STATUS = "成績未到或無成績"
IGNORED_STATUSES = {"停修", UNGRADED_STATUS}
ENGLISH_COURSE_NAMES = {"大學英文（一）", "大學英文（二）"}
CHINESE_COURSE_KEYWORDS = ("國文－", "進階國文－")
ENGLISH_COURSE_CODE_PREFIX = "599"


def _is_passed(score, course_status: str | None, assume_ungraded_passed: bool = False) -> bool:
    # 模擬模式：成績未出的課視為通過（停修仍排除）
    if assume_ungraded_passed and course_status == UNGRADED_STATUS:
        return True
    if course_status in IGNORED_STATUSES:
        return False
    if course_status in PASSING_STATUSES:
        return True
    return score is not None and float(score) >= PASSING_SCORE


def _format_progress(value: float, target: float) -> str:
    return f"{value:.1f}/{target:.1f}"


def _is_english_course(course_name: str) -> bool:
    return course_name in ENGLISH_COURSE_NAMES


def _is_english_elective_course(course_code: str) -> bool:
    return course_code.startswith(ENGLISH_COURSE_CODE_PREFIX)


def _is_chinese_course(course_name: str) -> bool:
    return any(keyword in course_name for keyword in CHINESE_COURSE_KEYWORDS)


def _fetch_general_courses(student_id: str, assume_ungraded_passed: bool = False) -> list[dict]:
    # CTE: 該學生每門課的最新一次嘗試（含 is_general 過濾，給通識領域查詢用）
    latest_general = (
        select(
            CourseRecord.course_code,
            CourseRecord.score,
            CourseRecord.course_status,
        )
        .where(
            CourseRecord.student_id == student_id,
            CourseRecord.is_general.is_(True),
        )
        .order_by(
            CourseRecord.course_code,
            CourseRecord.academic_year.desc(),
            CourseRecord.academic_semester.desc(),
        )
        .distinct(CourseRecord.course_code)
        .cte("latest_general")
    )

    # 通識領域課程：取出 is_core 與多領域 array
    domain_stmt = (
        select(
            AllCourse.course_name,
            AllCourse.course_code,
            AllCourse.credit,
            latest_general.c.score,
            latest_general.c.course_status,
            func.coalesce(GeneralCourse.is_core, False_()).label("is_core"),
            func.array_remove(
                func.array_agg(
                    aggregate_order_by(
                        GeneralCategory.category_name,
                        GeneralCategory.category_name,
                    )
                ),
                None,
            ).label("domains"),
        )
        .select_from(latest_general)
        .join(AllCourse, AllCourse.course_code == latest_general.c.course_code)
        .outerjoin(GeneralCourse, GeneralCourse.course_code == latest_general.c.course_code)
        .outerjoin(
            GeneralCourseCategory,
            GeneralCourseCategory.course_code == latest_general.c.course_code,
        )
        .outerjoin(
            GeneralCategory,
            GeneralCategory.category_code == GeneralCourseCategory.category_code,
        )
        .group_by(
            AllCourse.course_name,
            AllCourse.course_code,
            AllCourse.credit,
            latest_general.c.score,
            latest_general.c.course_status,
            GeneralCourse.is_core,
        )
        .order_by(AllCourse.course_code)
    )

    # CTE: 該學生每門課的最新一次嘗試（不過濾 is_general，給英／國文查詢用）
    latest_all = (
        select(
            CourseRecord.course_code,
            CourseRecord.score,
            CourseRecord.course_status,
        )
        .where(CourseRecord.student_id == student_id)
        .order_by(
            CourseRecord.course_code,
            CourseRecord.academic_year.desc(),
            CourseRecord.academic_semester.desc(),
        )
        .distinct(CourseRecord.course_code)
        .cte("latest_all")
    )

    lang_stmt = (
        select(
            AllCourse.course_name,
            AllCourse.course_code,
            AllCourse.credit,
            latest_all.c.score,
            latest_all.c.course_status,
        )
        .select_from(latest_all)
        .join(AllCourse, AllCourse.course_code == latest_all.c.course_code)
        .where(
            or_(
                AllCourse.course_name.in_(list(ENGLISH_COURSE_NAMES)),
                AllCourse.course_code.like(f"{ENGLISH_COURSE_CODE_PREFIX}%"),
                AllCourse.course_name.like("%國文－%"),
                AllCourse.course_name.like("%進階國文－%"),
            )
        )
        .order_by(AllCourse.course_code)
    )

    with get_session() as session:
        domain_rows = session.execute(domain_stmt).all()
        lang_rows = session.execute(lang_stmt).all()

    courses = []
    seen_codes: set[str] = set()
    for row in domain_rows:
        domains = row.domains or ()
        courses.append({
            "course_name":   row.course_name,
            "course_code":   row.course_code,
            "credit":        float(row.credit),
            "score":         None if row.score is None else float(row.score),
            "course_status": row.course_status,
            "is_core":       row.is_core,
            "domains":       tuple(domains),
            "passed":        _is_passed(row.score, row.course_status, assume_ungraded_passed),
        })
        seen_codes.add(row.course_code)

    for row in lang_rows:
        if row.course_code in seen_codes:
            continue
        courses.append({
            "course_name":   row.course_name,
            "course_code":   row.course_code,
            "credit":        float(row.credit),
            "score":         None if row.score is None else float(row.score),
            "course_status": row.course_status,
            "is_core":       False,
            "domains":       (),
            "passed":        _is_passed(row.score, row.course_status, assume_ungraded_passed),
        })

    return courses


def _build_assignment(courses: list[dict]) -> tuple[dict[str, float], list[dict]]:
    unit = 10
    min_units = int(DOMAIN_MIN_CREDITS * unit)
    max_units = int(DOMAIN_MAX_CREDITS * unit)
    domain_index = {domain: idx for idx, domain in enumerate(DOMAIN_ORDER)}
    eligible_courses = [course for course in courses if course["passed"]]

    @lru_cache(maxsize=None)
    def search(index: int, credits: tuple[int, ...], core_counts: tuple[int, ...]):
        if index == len(eligible_courses):
            shortfall = sum(max(0, min_units - value) for value in credits)
            counted_total = sum(credits)
            core_course_count = sum(core_counts)
            core_domain_count = sum(1 for count in core_counts if count > 0)
            return (
                shortfall,
                -min(core_domain_count, CORE_REQUIRED_COURSES),
                -min(core_course_count, CORE_REQUIRED_COURSES),
                -counted_total,
            ), ()

        course = eligible_courses[index]
        best_score, best_plan = search(index + 1, credits, core_counts)
        best_choice = None

        credit_units = int(round(course["credit"] * unit))

        for domain in course["domains"]:
            idx = domain_index[domain]
            if credits[idx] + credit_units > max_units:
                continue

            next_credits = list(credits)
            next_credits[idx] += credit_units

            next_core_counts = list(core_counts)
            if course["is_core"] and domain in course["domains"]:
                next_core_counts[idx] += 1

            score, plan = search(index + 1, tuple(next_credits), tuple(next_core_counts))
            if score < best_score:
                best_score = score
                best_plan = plan
                best_choice = domain

        if best_choice is not None:
            return best_score, ((best_choice,),) + best_plan
        return best_score, ((None,),) + best_plan

    initial_credits = tuple(0 for _ in DOMAIN_ORDER)
    initial_core_counts = tuple(0 for _ in DOMAIN_ORDER)
    _, plan = search(0, initial_credits, initial_core_counts)

    domain_credits = {domain: 0.0 for domain in DOMAIN_ORDER}
    assigned_courses = []
    for course, choice_wrapper in zip(eligible_courses, plan):
        assigned_domain = choice_wrapper[0]
        if assigned_domain is not None:
            domain_credits[assigned_domain] += course["credit"]
        assigned_courses.append(
            {
                **course,
                "assigned_domain": assigned_domain,
                "counted_credit": course["credit"] if assigned_domain else 0.0,
            }
        )

    for course in courses:
        if course["passed"]:
            continue
        assigned_courses.append(
            {
                **course,
                "assigned_domain": None,
                "counted_credit": 0.0,
            }
        )

    return domain_credits, assigned_courses


def _build_language_summary(courses: list[dict]) -> dict:
    english_courses = [
        {
            **course,
            "counted_credit": 0.0,
        }
        for course in courses
        if course["passed"] and (
            _is_english_course(course["course_name"])
            or _is_english_elective_course(course["course_code"])
        )
    ]
    chinese_courses = [
        {
            **course,
            "counted_credit": 0.0,
        }
        for course in courses
        if course["passed"] and _is_chinese_course(course["course_name"])
    ]

    counted_english = 0.0
    for course in english_courses:
        remaining = max(0.0, ENGLISH_REQUIRED_CREDITS - counted_english)
        counted = min(course["credit"], remaining)
        course["counted_credit"] = counted
        counted_english += counted

    chinese_total = 0.0
    for course in chinese_courses:
        remaining = max(0.0, CHINESE_MAX_CREDITS - chinese_total)
        counted = min(course["credit"], remaining)
        course["counted_credit"] = counted
        chinese_total += counted

    general_total_required = (
        GENERAL_TOTAL_WITH_MAX_CHINESE
        if chinese_total >= CHINESE_MAX_CREDITS
        else GENERAL_TOTAL_WITH_MIN_CHINESE
    )

    return {
        "english_courses": english_courses,
        "chinese_courses": chinese_courses,
        "counted_english_credit": counted_english,
        "counted_chinese_credit": chinese_total,
        "english_shortage": max(0.0, ENGLISH_REQUIRED_CREDITS - counted_english),
        "chinese_shortage": max(0.0, CHINESE_MIN_CREDITS - chinese_total),
        "general_total_required": general_total_required,
    }


def General(student_id: str, assume_ungraded_passed: bool = False) -> dict:
    courses = _fetch_general_courses(student_id, assume_ungraded_passed)
    domain_credits, assigned_courses = _build_assignment(courses)
    language_summary = _build_language_summary(courses)

    used_general_courses = [
        course["course_name"]
        for course in assigned_courses
        if course["counted_credit"] > 0
    ]
    used_english_courses = [
        course["course_name"]
        for course in language_summary["english_courses"]
        if course["counted_credit"] > 0
    ]
    used_chinese_courses = [
        course["course_name"]
        for course in language_summary["chinese_courses"]
        if course["counted_credit"] > 0
    ]

    shortages = {
        domain: max(0.0, DOMAIN_MIN_CREDITS - domain_credits[domain])
        for domain in DOMAIN_ORDER
    }
    capped_excess = {
        domain: max(0.0, domain_credits[domain] - DOMAIN_MAX_CREDITS)
        for domain in DOMAIN_ORDER
    }

    core_courses = []
    for course in assigned_courses:
        if not course["passed"]:
            continue
        if not course["is_core"]:
            continue
        core_courses.append({**course, "core_domain": course["domains"][0]})

    core_domains = sorted({course["core_domain"] for course in core_courses})
    core_domain_shortages = {
        domain: 1
        for domain in DOMAIN_ORDER
        if domain not in core_domains
    }
    general_total_credit = sum(domain_credits.values())
    general_total_shortage = max(
        0.0, language_summary["general_total_required"] - general_total_credit
    )

    result = {
        "student_id": student_id,
        "is_passed": (
            language_summary["english_shortage"] == 0
            and language_summary["chinese_shortage"] == 0
            and all(shortage == 0 for shortage in shortages.values())
            and general_total_shortage == 0
            and len(core_domains) >= CORE_REQUIRED_COURSES
        ),
        "requirements": {
            "domain_min_credit": DOMAIN_MIN_CREDITS,
            "domain_max_credit": DOMAIN_MAX_CREDITS,
            "core_required_courses": CORE_REQUIRED_COURSES,
            "english_required_credit": ENGLISH_REQUIRED_CREDITS,
            "chinese_min_credit": CHINESE_MIN_CREDITS,
            "chinese_max_credit": CHINESE_MAX_CREDITS,
            "excluded_domains": ["資訊通"],
        },
        "summary": {
            "counted_total_credit": general_total_credit,
            "general_total_required": language_summary["general_total_required"],
            "general_total_shortage": general_total_shortage,
            "domain_credits": domain_credits,
            "domain_shortages": shortages,
            "domain_excess": capped_excess,
            "core_course_count": len(core_courses),
            "core_domains": core_domains,
            "core_domain_shortages": core_domain_shortages,
            "core_courses": [
                {
                    "course_name": course["course_name"],
                    "course_code": course["course_code"],
                    "core_domain": course["core_domain"],
                }
                for course in core_courses
            ],
            "english_credit": language_summary["counted_english_credit"],
            "english_shortage": language_summary["english_shortage"],
            "chinese_credit": language_summary["counted_chinese_credit"],
            "chinese_shortage": language_summary["chinese_shortage"],
        },
        "used_courses": {
            "general": used_general_courses,
            "english": used_english_courses,
            "chinese": used_chinese_courses,
            "core": [course["course_name"] for course in core_courses],
        },
        "display": {
            "國文": _format_progress(
                language_summary["counted_chinese_credit"], CHINESE_MAX_CREDITS
            ),
            "英文": _format_progress(
                language_summary["counted_english_credit"], ENGLISH_REQUIRED_CREDITS
            ),
            "人文通": _format_progress(domain_credits["人文通"], DOMAIN_MAX_CREDITS),
            "社會通": _format_progress(domain_credits["社會通"], DOMAIN_MAX_CREDITS),
            "自然通": _format_progress(domain_credits["自然通"], DOMAIN_MAX_CREDITS),
            "核通": {
                "required_domains": CORE_REQUIRED_COURSES,
                "completed_domains": core_domains,
                "completed_count": len(core_domains),
                "missing_count": max(0, CORE_REQUIRED_COURSES - len(core_domains)),
            },
            "缺額": {
                "國文": language_summary["chinese_shortage"],
                "英文": language_summary["english_shortage"],
                "人文通": shortages["人文通"],
                "社會通": shortages["社會通"],
                "自然通": shortages["自然通"],
                "一般通識總學分": general_total_shortage,
            },
        },
        "courses": {
            "general": assigned_courses,
            "english": language_summary["english_courses"],
            "chinese": language_summary["chinese_courses"],
        },
    }
    return result


def audit_general_rules(student_id: str) -> dict:
    return General(student_id)


def print_general_audit(student_id: str) -> None:
    result = General(student_id)
    display = result["display"]
    used_courses = result["used_courses"]

    print(f"國文: {display['國文']}")
    print(f"英文: {display['英文']}")
    print(f"人文通: {display['人文通']}")
    print(f"社會通: {display['社會通']}")
    print(f"自然通: {display['自然通']}")

    core = display["核通"]
    print(
        "核通: "
        f"{core['completed_count']}/{core['required_domains']} 領域 "
        f"(已完成: {', '.join(core['completed_domains']) if core['completed_domains'] else '無'})"
    )
    print(f"核通尚缺{core['missing_count']}領域")

    shortages = display["缺額"]
    for label in ("國文", "英文", "一般通識總學分"):
        print(f"{label}尚缺: {shortages[label]:.1f}")

    print(
        "一般通識已採計課程: "
        f"{', '.join(used_courses['general']) if used_courses['general'] else '無'}"
    )
    print(
        "英文已採計課程: "
        f"{', '.join(used_courses['english']) if used_courses['english'] else '無'}"
    )
    print(
        "國文已採計課程: "
        f"{', '.join(used_courses['chinese']) if used_courses['chinese'] else '無'}"
    )
    print(
        "核通已採計課程: "
        f"{', '.join(used_courses['core']) if used_courses['core'] else '無'}"
    )


def main():
    print_general_audit("112703034")

if __name__ == "__main__":
    main()
