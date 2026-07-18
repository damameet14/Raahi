"""Ride coordination module.

Owns the employee-facing ride domain: ride requests (Find a Ride), ride
offers (Offer a Ride), the bookings that match a passenger request to a
driver offer, trip lifecycle with per-booking OTP, and live location
tracking. Fare is server-authoritative and matching is proximity- and
time-based using organization-configured radii.
"""
