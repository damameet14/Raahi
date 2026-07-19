"""Onboarding approval lifecycle for organizations."""

import enum


class OrganizationApprovalStatus(str, enum.Enum):
    """States a company tenant moves through during onboarding.

    PENDING — registered, awaiting Raahi super-admin review.
    APPROVED — cleared to operate; its admin can sign in.
    REJECTED — declined by the super-admin (see rejection_reason).
    """

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
