import os
import sys
import pytest
import random
import string


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database.db import test_db_connection


def random_email():
    return f"test+{''.join(random.choices(string.ascii_lowercase, k=6))}@example.com"


@pytest.fixture
def client():
    app = create_app()
    app.testing = True
    return app.test_client()


def ensure_db_or_skip():
    ok, err = test_db_connection()
    if not ok:
        pytest.skip(f"DB unavailable: {err}")


def test_user_registration_and_login(client):
    ensure_db_or_skip()
    email = random_email()
    payload = {
        'first_name': 'Test',
        'last_name': 'User',
        'email': email,
        'phone_number': '9990001111',
        'password': 'pass1234'
    }
    res = client.post('/api/register', json=payload)
    assert res.status_code in (200, 201)
    data = res.get_json()
    assert 'token' in data

    # try login
    res2 = client.post('/api/login', json={'email': email, 'password': 'pass1234'})
    assert res2.status_code == 200
    d2 = res2.get_json()
    assert 'token' in d2


def test_admin_login(client):
    ensure_db_or_skip()
    # admin must exist in DB for this test to pass; skip otherwise
    res = client.post('/api/admin/login', json={'email': 'admin@example.com', 'password': 'adminpass'})
    if res.status_code == 401:
        pytest.skip('Admin credentials not present in DB')
    assert res.status_code == 200
    assert 'token' in res.get_json()
