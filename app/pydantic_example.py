
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class Person(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    age: int
    email: EmailStr 
    dob: datetime


if __name__ == "__main__":
    person = Person(
        name="P",
        age="15",
        email="abc@",
        dob="2026-07-19 12:00"
    )