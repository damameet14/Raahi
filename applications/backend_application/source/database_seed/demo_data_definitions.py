"""Demo data definitions for seeding the development database.

Seeds a Raahi platform super-admin plus two fully-onboarded (APPROVED) tenant
organizations based in Gujarat, India, with enough employees, vehicles, and
completed trips to comfortably exceed 100 demo records for the reports and
analytics dashboards.
"""

from datetime import date, datetime, timedelta, timezone
import random

# Deterministic generation so repeated fresh seeds produce the same demo data.
_DEMO_RANDOM = random.Random(20260718)


# ── Platform super-admin (Raahi) ─────────────────────────────
# The super-admin belongs to a dedicated platform organization so the
# NOT NULL organization_id constraint is satisfied; it never operates as a
# tenant and is always APPROVED/active.
PLATFORM_ORGANIZATION = {
    "id": "org-raahi-platform",
    "name": "Raahi Platform",
    "slug": "raahi-platform",
    "email_domain": "raahi.d14.app",
    "address": "Raahi HQ, Ahmedabad, Gujarat, India",
    "industry": "Mobility Platform",
    "approval_status": "APPROVED",
    "is_active": True,
}

SUPER_ADMIN_USER = {
    "id": "user-superadmin-001",
    "organization_id": "org-raahi-platform",
    "email": "superadmin@raahi.d14.app",
    "full_name": "Raahi Platform Admin",
    "role": "SUPER_ADMIN",
    "is_active": True,
    "must_change_password": False,
    # Password: raahi-super-123 (hashed during seeding)
    "plain_text_password": "raahi-super-123",
}


# ── Gujarat location pools (name, latitude, longitude) ───────
GUJARAT_LOCATIONS_BY_CITY: dict[str, list[tuple[str, float, float]]] = {
    "ahmedabad": [
        ("SG Highway, Ahmedabad", 23.0300, 72.5100),
        ("Satellite, Ahmedabad", 23.0300, 72.5200),
        ("Bodakdev, Ahmedabad", 23.0370, 72.5060),
        ("Vastrapur, Ahmedabad", 23.0390, 72.5270),
        ("Prahlad Nagar, Ahmedabad", 23.0120, 72.5070),
        ("Naranpura, Ahmedabad", 23.0530, 72.5560),
        ("Maninagar, Ahmedabad", 22.9960, 72.6000),
        ("Chandkheda, Ahmedabad", 23.1100, 72.5810),
        ("GIFT City, Gandhinagar", 23.1600, 72.6840),
        ("Sector 21, Gandhinagar", 23.2230, 72.6500),
    ],
    "vadodara": [
        ("Alkapuri, Vadodara", 22.3100, 73.1720),
        ("Sayajigunj, Vadodara", 22.3120, 73.1900),
        ("Gotri, Vadodara", 22.3260, 73.1420),
        ("Akota, Vadodara", 22.2960, 73.1720),
        ("Manjalpur, Vadodara", 22.2680, 73.1870),
        ("Nizampura, Vadodara", 22.3320, 73.1830),
        ("Karelibaug, Vadodara", 22.3230, 73.2060),
        ("Subhanpura, Vadodara", 22.3230, 73.1600),
        ("Vasna Road, Vadodara", 22.2900, 73.1560),
        ("Waghodia Road, Vadodara", 22.3200, 73.2300),
    ],
}


# ── Name pools (Gujarati) ────────────────────────────────────
_FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Krish", "Ishaan", "Dhruv",
    "Kabir", "Harsh", "Jainam", "Meet", "Parth", "Rudra", "Yash", "Dev",
    "Manan", "Tirth", "Smit", "Rohan", "Priya", "Diya", "Aanya", "Isha",
    "Kavya", "Riya", "Khushi", "Nidhi", "Krupa", "Foram", "Janvi", "Mansi",
    "Hetvi", "Dhara", "Bhavya", "Rutvi", "Vidhi", "Aesha", "Nisha", "Zeel",
]

_LAST_NAMES = [
    "Patel", "Shah", "Desai", "Mehta", "Trivedi", "Joshi", "Modi", "Amin",
    "Parekh", "Vyas", "Dave", "Bhatt", "Gandhi", "Thakkar", "Pandya", "Rana",
    "Chauhan", "Solanki", "Makwana", "Prajapati", "Panchal", "Raval", "Vaghela",
    "Kotadia",
]

_DEPARTMENTS = [
    ("Engineering", ["Software Engineer", "Senior Developer", "Tech Lead", "QA Engineer", "DevOps Engineer"]),
    ("Product", ["Product Manager", "Business Analyst", "Product Designer"]),
    ("Design", ["UI/UX Designer", "Graphic Designer"]),
    ("Human Resources", ["HR Manager", "Recruiter"]),
    ("Finance", ["Financial Analyst", "Accountant"]),
    ("Sales", ["Sales Executive", "Account Manager"]),
    ("Operations", ["Operations Manager", "Support Specialist"]),
]

_VEHICLE_MODELS = [
    ("Maruti Suzuki", "Swift Dzire", "PETROL", 4),
    ("Hyundai", "Creta", "DIESEL", 5),
    ("Tata", "Nexon EV", "ELECTRIC", 5),
    ("Honda", "City", "PETROL", 4),
    ("Toyota", "Innova Crysta", "DIESEL", 7),
    ("Mahindra", "XUV700", "DIESEL", 7),
    ("Kia", "Seltos", "PETROL", 5),
    ("MG", "ZS EV", "ELECTRIC", 5),
    ("Tata", "Punch", "PETROL", 5),
    ("Maruti Suzuki", "Ertiga", "PETROL", 7),
]
_VEHICLE_COLORS = ["White", "Silver", "Blue", "Grey", "Black", "Red", "Teal"]


# ── Tenant definitions ───────────────────────────────────────
# Each tenant is an APPROVED organization with a verified email domain, a
# company admin, and a Gujarat city that anchors its offices and trip routes.
TENANT_DEFINITIONS = [
    {
        "organization": {
            "id": "org-sabarmati-tech",
            "name": "Sabarmati Systems",
            "slug": "sabarmati-systems",
            "email_domain": "sabarmati.tech",
            "address": "Prahlad Nagar, Ahmedabad, Gujarat 380015, India",
            "industry": "Information Technology",
            "approval_status": "APPROVED",
            "is_active": True,
        },
        "admin": {
            "id": "user-admin-sabarmati",
            "email": "admin@sabarmati.tech",
            "full_name": "Priya Desai",
        },
        "city": "ahmedabad",
        "vehicle_series": "GJ-01",
        "office": ("Sabarmati Systems HQ, Prahlad Nagar", 23.0120, 72.5070),
        "employee_count": 26,
        "vehicle_count": 9,
        "trip_count": 65,
    },
    {
        "organization": {
            "id": "org-vishwamitri-io",
            "name": "Vishwamitri Analytics",
            "slug": "vishwamitri-analytics",
            "email_domain": "vishwamitri.io",
            "address": "Alkapuri, Vadodara, Gujarat 390007, India",
            "industry": "Data & Analytics",
            "approval_status": "APPROVED",
            "is_active": True,
        },
        "admin": {
            "id": "user-admin-vishwamitri",
            "email": "admin@vishwamitri.io",
            "full_name": "Rohan Trivedi",
        },
        "city": "vadodara",
        "vehicle_series": "GJ-06",
        "office": ("Vishwamitri Analytics HQ, Alkapuri", 22.3100, 73.1720),
        "employee_count": 24,
        "vehicle_count": 8,
        "trip_count": 60,
    },
]


def _slugify_name(full_name: str) -> str:
    """Turn a full name into an email local-part like 'priya.desai'."""
    return ".".join(part.lower() for part in full_name.split())


def build_company_settings(tenant: dict) -> dict:
    """Default company settings anchored at the tenant's office coordinates."""
    _, office_lat, office_lng = tenant["office"]
    return {
        "id": f"settings-{tenant['organization']['id']}",
        "organization_id": tenant["organization"]["id"],
        "fuel_cost_per_liter": 96.50,
        "travel_cost_per_kilometer": 11.0,
        "office_latitude": office_lat,
        "office_longitude": office_lng,
        "ride_radius_kilometers": 30.0,
        "default_currency": "INR",
        "company_logo_url": None,
    }


def generate_employees_for_tenant(tenant: dict) -> list[dict]:
    """Generate a tenant's employee dicts with domain-matched emails."""
    domain = tenant["organization"]["email_domain"]
    count = tenant["employee_count"]
    used_emails: set[str] = set()
    employees: list[dict] = []

    for index in range(count):
        first = _DEMO_RANDOM.choice(_FIRST_NAMES)
        last = _DEMO_RANDOM.choice(_LAST_NAMES)
        full_name = f"{first} {last}"
        local_part = _slugify_name(full_name)
        email = f"{local_part}@{domain}"
        # Disambiguate accidental collisions from the random name pool.
        disambiguator = 2
        while email in used_emails:
            email = f"{local_part}{disambiguator}@{domain}"
            disambiguator += 1
        used_emails.add(email)

        department, designations = _DEMO_RANDOM.choice(_DEPARTMENTS)
        # Roughly 45% of employees drive; the rest are passengers.
        is_driver = _DEMO_RANDOM.random() < 0.45
        # A small number of inactive employees for realistic reporting.
        status = "INACTIVE" if _DEMO_RANDOM.random() < 0.08 else "ACTIVE"

        # Home near a random city location; office at the tenant HQ. This makes
        # seeded employees immediately usable for ride matching in the PWA.
        home_name, home_lat, home_lng = _DEMO_RANDOM.choice(
            GUJARAT_LOCATIONS_BY_CITY[tenant["city"]]
        )
        office_name, office_lat, office_lng = tenant["office"]

        employees.append({
            "employee_code": f"{tenant['vehicle_series'].replace('-', '')}{index + 1:03d}",
            "full_name": full_name,
            "email": email,
            "phone": f"+91-9{_DEMO_RANDOM.randint(700000000, 799999999)}",
            "department": department,
            "designation": _DEMO_RANDOM.choice(designations),
            "status": status,
            "is_driver": is_driver,
            "home_latitude": round(home_lat + _DEMO_RANDOM.uniform(-0.01, 0.01), 6),
            "home_longitude": round(home_lng + _DEMO_RANDOM.uniform(-0.01, 0.01), 6),
            "home_address_label": home_name,
            "office_latitude": office_lat,
            "office_longitude": office_lng,
            "office_address_label": office_name,
            "onboarding_completed": True,
        })

    # Guarantee at least a few drivers exist even if randomness under-selects.
    driver_present = [emp for emp in employees if emp["is_driver"] and emp["status"] == "ACTIVE"]
    if len(driver_present) < 4:
        for emp in employees:
            if emp["status"] == "ACTIVE" and not emp["is_driver"]:
                emp["is_driver"] = True
                driver_present.append(emp)
            if len(driver_present) >= 4:
                break

    return employees


def generate_vehicles_for_tenant(tenant: dict) -> list[dict]:
    """Generate a tenant's vehicle dicts with Gujarat registration plates."""
    series = tenant["vehicle_series"]
    vehicles: list[dict] = []
    for index in range(tenant["vehicle_count"]):
        make, model, fuel_type, capacity = _DEMO_RANDOM.choice(_VEHICLE_MODELS)
        letters = "".join(_DEMO_RANDOM.choice("ABCDEFGHJKLMNPQRSTUVWXYZ") for _ in range(2))
        number = _DEMO_RANDOM.randint(1000, 9999)
        vehicles.append({
            "vehicle_number": f"{series}-{letters}-{number}",
            "make": make,
            "model": model,
            "year": _DEMO_RANDOM.randint(2020, 2025),
            "color": _DEMO_RANDOM.choice(_VEHICLE_COLORS),
            "capacity": capacity,
            "fuel_type": fuel_type,
            "status": "ACTIVE",
            "insurance_expiry_date": date(
                _DEMO_RANDOM.randint(2026, 2028),
                _DEMO_RANDOM.randint(1, 12),
                _DEMO_RANDOM.randint(1, 28),
            ),
        })
    return vehicles


def generate_trips_for_tenant(
    tenant: dict,
    employee_ids: list[str],
    driver_employee_ids: list[str],
    vehicle_ids: list[str],
) -> list[dict]:
    """Generate completed trips over the last 6 months around the tenant city."""
    locations = GUJARAT_LOCATIONS_BY_CITY[tenant["city"]]
    trips: list[dict] = []
    if not driver_employee_ids or not vehicle_ids:
        return trips

    for index in range(tenant["trip_count"]):
        driver_id = _DEMO_RANDOM.choice(driver_employee_ids)
        vehicle_id = vehicle_ids[index % len(vehicle_ids)]

        start_loc = _DEMO_RANDOM.choice(locations)
        end_loc = _DEMO_RANDOM.choice([loc for loc in locations if loc != start_loc])

        days_ago = _DEMO_RANDOM.randint(1, 180)
        trip_start = datetime.now(timezone.utc) - timedelta(
            days=days_ago, hours=_DEMO_RANDOM.randint(6, 10)
        )
        trip_end = trip_start + timedelta(minutes=_DEMO_RANDOM.randint(20, 90))

        distance = round(_DEMO_RANDOM.uniform(5.0, 42.0), 1)
        fuel = round(distance / _DEMO_RANDOM.uniform(12.0, 18.0), 2)
        cost = round(distance * 11.0, 2)

        trips.append({
            "organization_id": tenant["organization"]["id"],
            "driver_employee_id": driver_id,
            "vehicle_id": vehicle_id,
            "start_location_name": start_loc[0],
            "start_latitude": start_loc[1],
            "start_longitude": start_loc[2],
            "end_location_name": end_loc[0],
            "end_latitude": end_loc[1],
            "end_longitude": end_loc[2],
            "distance_kilometers": distance,
            "fuel_consumed_liters": fuel,
            "trip_cost": cost,
            "passenger_count": _DEMO_RANDOM.randint(1, min(4, len(employee_ids))),
            "status": "COMPLETED",
            "started_at": trip_start,
            "completed_at": trip_end,
        })

    return trips
