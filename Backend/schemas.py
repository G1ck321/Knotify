import re

from pydantic import BaseModel, Field, field_validator
from typing import Optional

class FrontendPayRequest(BaseModel):
    """Validate checkout payload sent from frontend before processing"""

    #Customer identity and delivery details

    name:str = Field(..., min_length=2)
    email:str
    user_id:str
    telegramPhone:str
    parentsNumber:str
    whatsApp:Optional[str]= None
    order_details:str
    amount:float = Field(..., gt=0)
    room_number:str
    parentsNumber: str = Field(..., min_length=7)