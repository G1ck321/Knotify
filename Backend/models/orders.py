from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from models.base import Base


class Order(Base):
    # This represents the orders table only.
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tx_ref = Column(String, unique=True, nullable=False)
    status = Column(String, nullable=False, default="pending")
    amountpaid = Column(Numeric(12, 2), nullable=False)
    items_total = Column(Numeric(12, 2), nullable=False)
    item_count = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="NGN")
    order_details = Column(Text, nullable=False)
    delivery_address = Column(Text)
    room_number = Column(String)
    # matric_number = Column(String)
    email_snapshot = Column(String)
    phone_snapshot = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True))


class OrderItem(Base):
    # This stores one purchased item inside a larger order.
    __tablename__ = "order_items"

    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())