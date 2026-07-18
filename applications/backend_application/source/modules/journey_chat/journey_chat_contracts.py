"""Input and output contracts for journey chat."""

from datetime import datetime

from pydantic import BaseModel


class ChatMessageResponse(BaseModel):
    """One chat message as delivered over the socket and REST history."""

    id: str
    ride_offer_id: str
    sender_employee_id: str
    sender_full_name: str
    body: str
    created_at: datetime


class IncomingChatMessage(BaseModel):
    """A message body received from a connected client."""

    body: str
