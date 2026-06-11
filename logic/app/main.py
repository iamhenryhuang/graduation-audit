import sys
import os
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import json
import os

from app.db.importer import import_student_json
from app.db.queries import fetch_student, fetch_course_records
from app.audit.cs_rules.cs_112 import Required, Group
from app.audit.general_rules.general_rules import General
from app.audit.general_rules.elective import Elective
from app.audit.general_rules.pc_rules import Physical
from gpa import compute_gpa

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def _load_group_data() -> dict:
    with open(os.path.join(_DATA_DIR, "group.json"), encoding="utf-8") as f:
        return json.load(f)["group_course"]

def _load_required_data() -> list:
    with open(os.path.join(_DATA_DIR, "required.json"), encoding="utf-8") as f:
        return json.load(f)["required_course"]

def _build_recommendations(req_missing: list, grp: dict, records: list) -> dict:
    taken_names = {r["course_name"] for r in records}
    group_data = _load_group_data()
    group_recs: dict[str, list] = {}

    # 群A：group_a_ok=False 才推
    # A/B 同班（上學期）、C/D 同班（下學期）—— 已選其中一堂就不推同班另一堂
    if not grp["group_a_ok"]:
        ab_pair = ["資訊專題（A）", "資訊專題（B）"]
        cd_pair = ["資訊專題（C）", "資訊專題（D）"]
        took_ab = any(n in taken_names for n in ab_pair)
        took_cd = any(n in taken_names for n in cd_pair)

        recs_a = []
        if not took_ab:
            recs_a.append(ab_pair[0])
        if not took_cd:
            recs_a.append(cd_pair[0])
        if recs_a:
            group_recs["群A"] = recs_a

    # 群B~E：domain_ok=False 才需要推
    # group_credits[name]==0 代表該群完全沒有通過的課（與 Group() 判斷一致）
    if not grp["domain_ok"]:
        for name in ["群B", "群C", "群D", "群E"]:
            if grp["group_credits"].get(name, 0) == 0:
                recs = [
                    c["course_name"] for c in group_data.get(name, [])
                    if c["course_name"] not in taken_names
                ]
                if recs:
                    group_recs[name] = recs

    return {
        "required": req_missing,
        "group": group_recs,
    }

TOTAL_REQUIRED = 128.0
REQ_REQUIRED = 36.0
GROUP_REQUIRED = 15.0
GENERAL_REQUIRED = 28.0
PHY_REQUIRED = 4.0
ELEC_REQUIRED = TOTAL_REQUIRED - REQ_REQUIRED - GROUP_REQUIRED - GENERAL_REQUIRED - PHY_REQUIRED

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_jsonable(obj):
    if obj is None:
        return None
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, list):
        return [to_jsonable(item) for item in obj]
    if isinstance(obj, tuple):
        return [to_jsonable(item) for item in obj]
    if isinstance(obj, dict):
        return {k: to_jsonable(v) for k, v in obj.items()}
    if hasattr(obj, "__dict__"):
        return {k: to_jsonable(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    return obj


class UploadBody(BaseModel):
    data: list


@app.post("/upload")
def upload(body: UploadBody):
    try:
        student_id = import_student_json(body.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"student_id": student_id}


@app.get("/student/{student_id}")
def get_student(student_id: str):
    student = fetch_student(student_id)
    if student is None:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    return to_jsonable(student)


@app.get("/courses/{student_id}")
def get_courses(
    student_id: str,
    latest_only: bool = Query(False, description="是否只查最新學期")
):
    if fetch_student(student_id) is None:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    records = fetch_course_records(student_id, latest_only=latest_only)
    return to_jsonable(records)


@app.get("/gpa/{student_id}")
def get_gpa(student_id: str):
    if fetch_student(student_id) is None:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    records = fetch_course_records(student_id, latest_only=False)
    return to_jsonable(compute_gpa(records))


@app.get("/audit/{student_id}")
def get_audit(
    student_id: str,
    assume_current_passed: bool = Query(
        False, description="模擬模式：假設成績未出的課程（本學期修課）全數通過"
    ),
):
    if fetch_student(student_id) is None:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    records = fetch_course_records(student_id, latest_only=False)
    req_ok, req_missing, req_passed, req_credits = Required(
        student_id, assume_ungraded_passed=assume_current_passed
    )
    grp = Group(student_id, assume_ungraded_passed=assume_current_passed)
    gen = General(student_id, assume_ungraded_passed=assume_current_passed)
    phy = Physical(student_id, assume_ungraded_passed=assume_current_passed)
    elec_total, elec_courses = Elective(
        student_id,
        require=req_passed,
        group=grp["used_courses"],
        general=gen,
        pc=phy,
        assume_ungraded_passed=assume_current_passed,
    )

    gen_s = gen["summary"]
    gen_credits = (
        gen_s["counted_total_credit"]
        + gen_s["english_credit"]
        + gen_s["chinese_credit"]
    )

    grp_ok = grp["credits_ok"] and grp["group_a_ok"] and grp["domain_ok"]
    elec_ok = elec_total >= ELEC_REQUIRED
    total_earned = req_credits + grp["used_credits"] + gen_credits + phy["used_credits"] + elec_total
    total_ok = (
        total_earned >= TOTAL_REQUIRED
        and req_ok and grp_ok and gen["is_passed"] and phy["is_passed"] and elec_ok
    )

    recommendations = _build_recommendations(req_missing, grp, records)

    return to_jsonable({
        "summary": {
            "total_earned": total_earned,
            "total_required": TOTAL_REQUIRED,
            "is_graduated": total_ok,
            "is_simulated": assume_current_passed,
        },
        "required": {
            "is_passed": req_ok,
            "missing": req_missing,
            "credits": req_credits,
            "required_credits": REQ_REQUIRED,
        },
        "group": {
            **grp,
            "is_passed": grp_ok,
            "required_credits": GROUP_REQUIRED,
        },
        "general": {
            "is_passed": gen["is_passed"],
            "display": gen["display"],
            "summary": gen["summary"],
            "required_credits": GENERAL_REQUIRED,
        },
        "physical": {
            **phy,
            "required_credits": PHY_REQUIRED,
        },
        "elective": {
            "is_passed": elec_ok,
            "total_credits": elec_total,
            "required_credits": ELEC_REQUIRED,
            "courses": elec_courses,
        },
        "recommendations": recommendations,
    })