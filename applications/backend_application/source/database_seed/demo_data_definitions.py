"""Demo data definitions for seeding the development database."""

from datetime import date, datetime, timedelta, timezone
import random

DEMO_ORGANIZATION = {
    "id": "org-raahi-demo-001",
    "name": "Raahi Technologies",
    "slug": "raahi-technologies",
    "address": "Sector 62, Noida, Uttar Pradesh 201309, India",
    "industry": "Information Technology",
    "is_active": True,
}

DEMO_ADMIN_USER = {
    "id": "user-admin-001",
    "organization_id": "org-raahi-demo-001",
    "email": "admin@raahi.com",
    "full_name": "Priya Sharma",
    "role": "COMPANY_ADMIN",
    "is_active": True,
    # Password: admin123 (will be hashed during seeding)
    "plain_text_password": "admin123",
}

DEMO_EMPLOYEES = [
    {"employee_code": "EMP001", "full_name": "Arjun Mehta", "email": "arjun.mehta@raahi.com", "phone": "+91-9876543001", "department": "Engineering", "designation": "Senior Developer", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP002", "full_name": "Sneha Patel", "email": "sneha.patel@raahi.com", "phone": "+91-9876543002", "department": "Engineering", "designation": "Frontend Developer", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP003", "full_name": "Rahul Kumar", "email": "rahul.kumar@raahi.com", "phone": "+91-9876543003", "department": "Product", "designation": "Product Manager", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP004", "full_name": "Ananya Singh", "email": "ananya.singh@raahi.com", "phone": "+91-9876543004", "department": "Design", "designation": "UI/UX Designer", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP005", "full_name": "Vikram Joshi", "email": "vikram.joshi@raahi.com", "phone": "+91-9876543005", "department": "Engineering", "designation": "Backend Developer", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP006", "full_name": "Kavya Reddy", "email": "kavya.reddy@raahi.com", "phone": "+91-9876543006", "department": "HR", "designation": "HR Manager", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP007", "full_name": "Rohit Agarwal", "email": "rohit.agarwal@raahi.com", "phone": "+91-9876543007", "department": "Finance", "designation": "Financial Analyst", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP008", "full_name": "Meera Nair", "email": "meera.nair@raahi.com", "phone": "+91-9876543008", "department": "Engineering", "designation": "QA Engineer", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP009", "full_name": "Aditya Verma", "email": "aditya.verma@raahi.com", "phone": "+91-9876543009", "department": "Marketing", "designation": "Marketing Lead", "status": "INACTIVE", "is_driver": False},
    {"employee_code": "EMP010", "full_name": "Prachi Gupta", "email": "prachi.gupta@raahi.com", "phone": "+91-9876543010", "department": "Engineering", "designation": "DevOps Engineer", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP011", "full_name": "Siddharth Rao", "email": "siddharth.rao@raahi.com", "phone": "+91-9876543011", "department": "Sales", "designation": "Sales Executive", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP012", "full_name": "Divya Iyer", "email": "divya.iyer@raahi.com", "phone": "+91-9876543012", "department": "Engineering", "designation": "Tech Lead", "status": "ACTIVE", "is_driver": True},
    {"employee_code": "EMP013", "full_name": "Karan Malhotra", "email": "karan.malhotra@raahi.com", "phone": "+91-9876543013", "department": "Operations", "designation": "Operations Manager", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP014", "full_name": "Neha Chatterjee", "email": "neha.chatterjee@raahi.com", "phone": "+91-9876543014", "department": "Legal", "designation": "Legal Advisor", "status": "ACTIVE", "is_driver": False},
    {"employee_code": "EMP015", "full_name": "Amit Saxena", "email": "amit.saxena@raahi.com", "phone": "+91-9876543015", "department": "Engineering", "designation": "Mobile Developer", "status": "ACTIVE", "is_driver": True},
]

DEMO_VEHICLES = [
    {"vehicle_number": "UP-16-AB-1234", "make": "Maruti Suzuki", "model": "Swift Dzire", "year": 2023, "color": "White", "capacity": 4, "fuel_type": "PETROL", "status": "ACTIVE", "insurance_expiry_date": date(2027, 3, 15)},
    {"vehicle_number": "DL-01-CD-5678", "make": "Hyundai", "model": "Creta", "year": 2024, "color": "Blue", "capacity": 5, "fuel_type": "DIESEL", "status": "ACTIVE", "insurance_expiry_date": date(2027, 6, 20)},
    {"vehicle_number": "UP-16-EF-9012", "make": "Tata", "model": "Nexon EV", "year": 2024, "color": "Teal", "capacity": 5, "fuel_type": "ELECTRIC", "status": "ACTIVE", "insurance_expiry_date": date(2027, 1, 10)},
    {"vehicle_number": "DL-03-GH-3456", "make": "Honda", "model": "City", "year": 2022, "color": "Silver", "capacity": 4, "fuel_type": "PETROL", "status": "ACTIVE", "insurance_expiry_date": date(2026, 11, 5)},
    {"vehicle_number": "UP-14-IJ-7890", "make": "Toyota", "model": "Innova Crysta", "year": 2023, "color": "Grey", "capacity": 7, "fuel_type": "DIESEL", "status": "ACTIVE", "insurance_expiry_date": date(2027, 8, 30)},
    {"vehicle_number": "DL-02-KL-2345", "make": "Mahindra", "model": "XUV700", "year": 2024, "color": "Red", "capacity": 7, "fuel_type": "DIESEL", "status": "MAINTENANCE", "insurance_expiry_date": date(2027, 4, 25)},
    {"vehicle_number": "UP-16-MN-6789", "make": "Kia", "model": "Seltos", "year": 2023, "color": "Black", "capacity": 5, "fuel_type": "PETROL", "status": "ACTIVE", "insurance_expiry_date": date(2026, 12, 18)},
    {"vehicle_number": "DL-05-OP-0123", "make": "MG", "model": "ZS EV", "year": 2024, "color": "White", "capacity": 5, "fuel_type": "ELECTRIC", "status": "ACTIVE", "insurance_expiry_date": date(2027, 9, 12)},
]

DEMO_COMPANY_SETTINGS = {
    "id": "settings-raahi-001",
    "organization_id": "org-raahi-demo-001",
    "fuel_cost_per_liter": 104.50,
    "travel_cost_per_kilometer": 12.0,
    "office_latitude": 28.6274,
    "office_longitude": 77.3754,
    "ride_radius_kilometers": 30.0,
    "default_currency": "INR",
    "company_logo_url": None,
}

# Trip locations around Noida/Delhi NCR
TRIP_LOCATIONS = [
    ("Sector 62, Noida", 28.6274, 77.3754),
    ("Sector 18, Noida", 28.5706, 77.3219),
    ("Connaught Place, Delhi", 28.6315, 77.2167),
    ("Gurugram Cyber City", 28.4945, 77.0889),
    ("Sector 44, Noida", 28.5592, 77.3503),
    ("Greater Noida", 28.4744, 77.5040),
    ("Rajiv Chowk, Delhi", 28.6328, 77.2197),
    ("Indirapuram, Ghaziabad", 28.6353, 77.3579),
    ("Vasant Kunj, Delhi", 28.5227, 77.1571),
    ("Dwarka, Delhi", 28.5921, 77.0460),
]


def generate_demo_trip_records(employee_ids: list[str], vehicle_ids: list[str]) -> list[dict]:
    """Generate 50 realistic demo trip records spread over 6 months."""
    trips = []
    driver_indices = [0, 2, 4, 6, 9, 11, 14]  # Employees that are drivers

    for i in range(50):
        driver_index = random.choice(driver_indices)
        vehicle_index = i % len(vehicle_ids)

        start_loc = random.choice(TRIP_LOCATIONS)
        end_loc = random.choice([loc for loc in TRIP_LOCATIONS if loc != start_loc])

        days_ago = random.randint(1, 180)
        trip_start = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(6, 10))
        trip_end = trip_start + timedelta(minutes=random.randint(20, 90))

        distance = round(random.uniform(5.0, 45.0), 1)
        fuel = round(distance / random.uniform(12.0, 18.0), 2)
        cost = round(distance * 12.0, 2)

        trips.append({
            "organization_id": "org-raahi-demo-001",
            "driver_employee_id": employee_ids[driver_index],
            "vehicle_id": vehicle_ids[vehicle_index],
            "start_location_name": start_loc[0],
            "start_latitude": start_loc[1],
            "start_longitude": start_loc[2],
            "end_location_name": end_loc[0],
            "end_latitude": end_loc[1],
            "end_longitude": end_loc[2],
            "distance_kilometers": distance,
            "fuel_consumed_liters": fuel,
            "trip_cost": cost,
            "passenger_count": random.randint(1, 4),
            "status": "COMPLETED",
            "started_at": trip_start,
            "completed_at": trip_end,
        })

    return trips
