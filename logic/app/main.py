import sys
import os
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.db.importer import import_student_json
from app.db.queries import fetch_student, fetch_course_records
from app.audit.cs_rules.cs_112 import Required, Group
from app.audit.general_rules.general_rules import General
from app.audit.general_rules.elective import Elective
from app.audit.general_rules.pc_rules import Physical
from gpa import compute_gpa

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
def get_audit(student_id: str):
    if fetch_student(student_id) is None:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    req_ok, req_missing, req_passed, req_credits = Required(student_id)
    grp = Group(student_id)
    gen = General(student_id)
    phy = Physical(student_id)
    elec_total, elec_courses = Elective(
        student_id,
        require=req_passed,
        group=grp["used_courses"],
        general=gen,
        pc=phy,
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

    return to_jsonable({
        "summary": {
            "total_earned": total_earned,
            "total_required": TOTAL_REQUIRED,
            "is_graduated": total_ok,
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
    })