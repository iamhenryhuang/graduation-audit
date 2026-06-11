# 這個檔案實作資科系 112 年入學學生的專業必修、群修條件
from app.db.queries import fetch_course_records, fetch_required_courses, fetch_group_names

PASS = 60.0
DEPT = "CS"
YEAR = "112"


def Required(student_id: str, assume_ungraded_passed: bool = False):
    courses = fetch_course_records(student_id, assume_ungraded_passed=assume_ungraded_passed)
    required_entries = fetch_required_courses(DEPT, YEAR)

    code_to_record: dict[str, dict] = {}
    for course in courses:
        code = course["course_code"]
        score = course["score"]
        is_passed = (score is not None and float(score) >= PASS) or course["course_status"] == "通過"
        code_to_record[code] = {
            "code": code,
            "passed": is_passed,
            "credit": float(course["credit"]),
        }

    missing = []
    passed_codes: set[str] = set()
    passed_credits = 0.0

    for req_code, req_name in required_entries:
        record = code_to_record.get(req_code)
        if record is None or not record["passed"]:
            missing.append(req_name)
        else:
            passed_codes.add(req_code)
            passed_credits += record["credit"]

    return len(missing) == 0, missing, passed_codes, passed_credits



def Group(student_id: str, assume_ungraded_passed: bool = False):
    courses = fetch_course_records(student_id, assume_ungraded_passed=assume_ungraded_passed)
    group_data = fetch_group_names(YEAR)
    group_names = ["群A", "群B", "群C", "群D", "群E"]
    Group_list = [group_data.get(name, []) for name in group_names]

    GROUP_A_CREDIT_LIMIT = 6.0
    BCDE_GROUPS_NEEDED = 3
    GROUP_TOTAL_LIMIT = 15.0
    BCDE_NAMES = ["群B", "群C", "群D", "群E"]
    group_names = ["群A"] + BCDE_NAMES

    passed_in_group: dict[str, list[tuple[str, float]]] = {name: [] for name in group_names}
    for course in courses:
        score = course["score"]
        is_passed = (score is not None and float(score) >= PASS) or course["course_status"] == "通過"
        if not is_passed:
            continue
        for name, group in zip(group_names, Group_list):
            if course["course_name"] in group:
                passed_in_group[name].append((course["course_name"], float(course["credit"])))
                break

    used_a: list[tuple[str, float]] = []
    extra_a: list[tuple[str, float]] = []
    group_a_credits = 0.0
    for course_name, credit in passed_in_group["群A"]:
        if group_a_credits + credit <= GROUP_A_CREDIT_LIMIT:
            used_a.append((course_name, credit))
            group_a_credits += credit
        else:
            extra_a.append((course_name, credit))

    bcde_best: dict[str, tuple[str, float]] = {}
    for name in BCDE_NAMES:
        if passed_in_group[name]:
            best_idx = max(range(len(passed_in_group[name])), key=lambda i: passed_in_group[name][i][1])
            bcde_best[name] = passed_in_group[name][best_idx]

    selected_groups = {
        name
        for name, _ in sorted(bcde_best.items(), key=lambda item: item[1][1], reverse=True)[:BCDE_GROUPS_NEEDED]
    }

    used_bcde: list[tuple[str, float]] = []
    extra_bcde: list[tuple[str, float]] = []
    for name in BCDE_NAMES:
        group_courses = passed_in_group[name]
        if not group_courses:
            continue
        if name in selected_groups:
            best_idx = max(range(len(group_courses)), key=lambda i: group_courses[i][1])
            for idx, item in enumerate(group_courses):
                if idx == best_idx:
                    used_bcde.append(item)
                else:
                    extra_bcde.append(item)
        else:
            extra_bcde.extend(group_courses)

    bcde_credits = sum(credit for _, credit in used_bcde)
    used_credits = group_a_credits + bcde_credits

    group_credits = {"群A": group_a_credits}
    for name in BCDE_NAMES:
        if name in selected_groups:
            group_credits[name] = bcde_best[name][1]
        else:
            group_credits[name] = 0.0

    return {
        "group_credits": group_credits,
        "group_a_ok": group_a_credits >= GROUP_A_CREDIT_LIMIT,
        "domain_count": len(selected_groups),
        "domain_ok": len(selected_groups) >= BCDE_GROUPS_NEEDED,
        "total_credits": sum(sum(credit for _, credit in passed_in_group[name]) for name in group_names),
        "used_credits": used_credits,
        "credits_ok": used_credits >= GROUP_TOTAL_LIMIT,
        "used_courses": [name for name, _ in used_a + used_bcde],
        "extra_courses": [name for name, _ in extra_a + extra_bcde],
    }



def main():
    print(Required("112703046"))
    print(Group("112703046"))


if __name__ == "__main__":
    main()
