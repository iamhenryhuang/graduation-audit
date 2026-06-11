from app.db.queries import fetch_course_records

PASS = 60.0
NATIONAL_DEFENSE_COURSE_PREFIX = "全民國防"

def _is_passed(course: dict) -> bool:
    score = course["score"]
    return (score is not None and score >= PASS) or course["course_status"] == "通過"


def _is_excluded_from_elective(course: dict) -> bool:
    return course["course_name"].startswith(NATIONAL_DEFENSE_COURSE_PREFIX)

# 計算選修學分
# require : Required() 回傳的 passed set（已通過的必修課名）
# group   : Group() 回傳的 used_courses list
# general : General() 回傳的 dict，其中 used_courses 為 {"general":[], "english":[], "chinese":[], "core":[]}
# pc      : Physical() 回傳的 dict，其中 used_courses 為 list
# return (總選修學分, 被計入選修的課程名稱list)
def Elective(
    student_id: str,
    require: set,
    group: list,
    general: dict,
    pc: dict,
    assume_ungraded_passed: bool = False,
):
    courses = fetch_course_records(student_id, assume_ungraded_passed=assume_ungraded_passed)

    # require 是 course_code set（來自 Required()，避免同名不同課混淆）
    used_codes = set(require)

    # 其餘分類用課名比對即可（無重複課名問題）
    used_names: set = set()
    used_names.update(group)
    for course_list in general["used_courses"].values():
        used_names.update(course_list)
    used_names.update(pc["used_courses"])

    elective_courses = []
    total_credits = 0.0
    for c in courses:
        if not _is_passed(c):
            continue
        if _is_excluded_from_elective(c):
            continue
        if c["course_code"] in used_codes or c["course_name"] in used_names:
            continue
        elective_courses.append(c["course_name"])
        total_credits += float(c["credit"])

    return total_credits, elective_courses
