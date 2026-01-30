# database/mongo_client.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.getenv("MONGO_DB", "company_ops")

# connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

# get tasks for employee
def get_tasks(employee_id: int):
    return list(db.task.find({"employee_id": employee_id}, {"_id": 0}))

# get recent attendance
def get_attendance(employee_id: int, limit=30):
    return list(db.attendance.find({"employee_id": employee_id}, {"_id": 0}).sort("date", -1).limit(limit))

# get performance review
def get_performance_review(employee_id: int):
    return db.performance_review.find_one({"employee_id": employee_id}, {"_id": 0})
