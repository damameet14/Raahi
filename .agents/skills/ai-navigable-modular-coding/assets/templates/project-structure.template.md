# Project Structure Template

Use only the applications and folders the project needs.

```text
project_name/
├── applications/
│   ├── web_application/
│   │   └── source/
│   │       ├── application_startup/
│   │       ├── features/
│   │       └── shared_user_interface_infrastructure/
│   └── backend_application/
│       └── source/
│           ├── application_startup/
│           ├── modules/
│           └── shared_backend_infrastructure/
├── shared_packages/
│   └── stable_cross_application_contracts/
├── project_documentation/
├── automated_scripts/
├── .env.example
└── README.md
```

Inside an application, use business capability names:

```text
modules/
├── user_authentication/
├── restaurant_order_management/
└── inventory_management/
```
