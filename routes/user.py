# routes/user.py
from fastapi import APIRouter, HTTPException
from database.mysql_client import get_user, get_projects_for_department
from database.mongo_client import get_tasks, get_attendance, get_performance_review

router = APIRouter()

@router.get("/employee/full-profile")
def get_employee_full_profile(employee_id: int):
    # MySQL data
    user = get_user(employee_id)
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found in MySQL")

    # department projects
    projects = []
    if user.get("depart_id"):
        projects = get_projects_for_department(user["depart_id"])

    # MongoDB data
    tasks = get_tasks(employee_id)
    attendance = get_attendance(employee_id)
    review = get_performance_review(employee_id) or {}

    # merge all
    response = {
        "employee": {
            "employee_id": user["employee_id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"],
            "join_date": str(user["join_date"]) if user.get("join_date") else None
        },
        "role": {
            "role_id": user.get("role_id"),
            "role_name": user.get("role_name")
        },
        "department": {
            "depart_id": user.get("depart_id"),
            "depart_name": user.get("depart_name")
        },
        "projects": projects,
        "tasks": tasks,
        "attendance": attendance,
        "performance_review": review
    }
    return response
