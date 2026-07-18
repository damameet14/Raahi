# Restaurant Order Module Example

## Module tree

```text
restaurant_order_management/
├── MODULE.md
├── public_interface/
│   ├── submit_restaurant_order.py
│   └── cancel_restaurant_order.py
├── contracts/
│   ├── submit_restaurant_order_contracts.py
│   └── cancel_restaurant_order_contracts.py
├── application_workflows/
│   ├── submit_restaurant_order_workflow.py
│   └── cancel_restaurant_order_workflow.py
├── order_pricing/
│   └── calculate_restaurant_order_total.py
├── order_state_rules/
│   └── determine_whether_restaurant_order_can_be_cancelled.py
├── persistence/
│   └── restaurant_order_repository.py
├── event_publication/
│   └── restaurant_order_event_publisher.py
└── tests/
```

## Example request

```python
@dataclass(frozen=True)
class SubmitRestaurantOrderRequest:
    customer_identifier: str
    restaurant_order_line_items: tuple[RestaurantOrderLineItemRequest, ...]
    requested_delivery_address_identifier: str
```

## Example result

```python
@dataclass(frozen=True)
class SubmittedRestaurantOrderResult:
    restaurant_order_identifier: str
    calculated_order_total: Decimal
    restaurant_order_status: RestaurantOrderStatus
```

## Cross-module interaction

After an order is confirmed, application orchestration may call the inventory module's public operation or publish a documented `RestaurantOrderConfirmed` event. The restaurant order module must not directly update internal inventory tables.
