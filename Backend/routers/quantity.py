from fastapi import APIRouter, status

from database import supabase

router = APIRouter(prefix="/quantity", tags=["Get the quantity of each tie and update after a sale"])

def get_each_quantity():
    response = supabase.table("Ties").select("*").eq("")
    response.data

def get_all_paid():
    response = supabase.table("orders").select("*").eq("status","paid")
    data, count = response.data, response.count
    return count


