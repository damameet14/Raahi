from app.classifier import MessageClassification, classify_message


def test_intro_message_is_classified():
    assert classify_message("Who are you?") == MessageClassification.INTRODUCTION


def test_email_message_is_authentication():
    assert classify_message("admin@raahi.com") == MessageClassification.AUTHENTICATION


def test_trip_message_is_database_query():
    assert classify_message("Show my latest trip") == MessageClassification.DATABASE_QUERY


def test_policy_message_is_rag_query():
    assert classify_message("What is the cancellation policy?") == MessageClassification.RAG_QUERY
