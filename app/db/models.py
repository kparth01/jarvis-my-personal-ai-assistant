from sqlalchemy import Column, Integer, String, Text, DateTime, func
from .database import Base

class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = {"schema": "jarvis"}  
    
    id = Column(Integer, primary_key=True)
    topic = Column(String(255))
    messages = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    session_id = Column(String(255), unique=True, index=True)