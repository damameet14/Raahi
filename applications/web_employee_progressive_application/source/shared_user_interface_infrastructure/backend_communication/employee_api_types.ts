/**
 * TypeScript shapes mirroring the backend ride and account JSON contracts.
 * Fields stay snake_case to match the API payloads exactly.
 */

export interface AuthenticationTokensResponse {
  access_token: string;
  refresh_token: string;
  user_account_id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  must_change_password: boolean;
}

export interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  vehicle_number: string;
  maximum_passengers: number;
}

export interface EmployeeProfile {
  id: string;
  organization_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string;
  is_driver: boolean;
  onboarding_completed: boolean;
  home_latitude: number | null;
  home_longitude: number | null;
  office_latitude: number | null;
  office_longitude: number | null;
  vehicles: VehicleSummary[];
  can_offer_ride: boolean;
}

export interface FareEstimateResponse {
  distance_kilometers: number;
  fare_amount: number;
  currency: string;
}

export interface RideRequest {
  id: string;
  status: string;
  source_latitude: number;
  source_longitude: number;
  source_label: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string | null;
  travel_date: string;
  departure_time: string;
  seats_requested: number;
  is_recurring: boolean;
  recurrence_days: string | null;
  recurrence_time: string | null;
  estimated_distance_kilometers: number | null;
  estimated_fare_amount: number | null;
  created_at: string;
}

export interface MatchingOffer {
  ride_offer_id: string;
  driver_full_name: string;
  driver_designation: string | null;
  vehicle_make_and_model: string;
  vehicle_number: string;
  source_latitude: number;
  source_longitude: number;
  source_label: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string | null;
  travel_date: string;
  departure_window_start_time: string;
  departure_window_end_time: string;
  seats_available: number;
  fare_amount: number;
  pickup_distance_kilometers: number;
  drop_distance_kilometers: number;
}

export interface CreateRideRequestResult {
  ride_request: RideRequest;
  matching_offers: MatchingOffer[];
}

export interface RideOffer {
  id: string;
  journey_status: string;
  vehicle_id: string;
  source_latitude: number;
  source_longitude: number;
  source_label: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string | null;
  travel_date: string;
  departure_window_start_time: string;
  departure_window_end_time: string;
  seats_total: number;
  seats_available: number;
  is_recurring: boolean;
  recurrence_days: string | null;
  recurrence_time: string | null;
  created_at: string;
}

export interface MatchingRequest {
  ride_request_id: string;
  passenger_full_name: string;
  source_latitude: number;
  source_longitude: number;
  source_label: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string | null;
  travel_date: string;
  departure_time: string;
  seats_requested: number;
  fare_amount: number;
  pickup_distance_kilometers: number;
  drop_distance_kilometers: number;
}

export interface CreateRideOfferResult {
  ride_offer: RideOffer;
  matching_requests: MatchingRequest[];
}

export interface RideBooking {
  id: string;
  ride_request_id: string;
  ride_offer_id: string;
  trip_status: string;
  seats_booked: number;
  fare_amount: number;
  otp_code: string | null;
  is_otp_verified: boolean;
  travel_date: string;
  departure_time: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_label: string | null;
  drop_latitude: number;
  drop_longitude: number;
  drop_label: string | null;
  driver_full_name: string;
  driver_phone: string | null;
  passenger_full_name: string;
  vehicle_make_and_model: string;
  vehicle_number: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DriverLocation {
  ride_offer_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface BookingTracking {
  booking_id: string;
  trip_status: string;
  driver_location: DriverLocation | null;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_latitude: number;
  drop_longitude: number;
  driver_full_name: string;
  vehicle_make_and_model: string;
  vehicle_number: string;
}
