from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime

from config import Config
from database.db import get_db_connection
from utils.auth import create_access_token
from routes.profile import sync_profile_from_user

auth_bp = Blueprint('auth', __name__)


def build_profile_snapshot(user_row, profile_row):
    required_values = [
        profile_row.get('first_name'),
        profile_row.get('last_name'),
        profile_row.get('email'),
        profile_row.get('phone_number'),
        profile_row.get('address'),
        profile_row.get('gender'),
        profile_row.get('aadhaar_number'),
        profile_row.get('pan_number'),
    ]
    filled_count = sum(1 for value in required_values if value not in (None, ''))
    return {
        'first_name': profile_row.get('first_name'),
        'last_name': profile_row.get('last_name'),
        'email': profile_row.get('email'),
        'phone': profile_row.get('phone_number'),
        'address': profile_row.get('address'),
        'gender': profile_row.get('gender'),
        'aadhaar_last4': profile_row.get('aadhaar_number')[-4:] if profile_row.get('aadhaar_number') else None,
        'aadhaar_status': profile_row.get('aadhaar_status') or 'not_added',
        'pan_last4': profile_row.get('pan_number')[-4:] if profile_row.get('pan_number') else None,
        'pan_status': profile_row.get('pan_status') or 'not_added',
        'completion_percent': round((filled_count / 8) * 100),
        'notifications': {
            'sms': bool(user_row.get('sms_notifications')),
            'email': bool(user_row.get('email_notifications')),
        },
        'last_login_at': user_row.get('last_login_at').isoformat() if user_row.get('last_login_at') else None,
    }

def create_token(payload):
    secret = Config.SECRET_KEY
    return jwt.encode({**payload, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, secret, algorithm='HS256')


@auth_bp.route('/api/register', methods=['POST'])
@auth_bp.route('/api/user/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    required = ('first_name', 'last_name', 'email', 'password')
    if not all(k in data for k in required):
        return jsonify({'error': 'missing fields'}), 400

    phone_number = data.get('phone_number') or data.get('phone')
    if not phone_number:
        return jsonify({'error': 'missing fields'}), 400

    pw_hash = generate_password_hash(data['password'])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (%s,%s,%s,%s,%s)",
            (data['first_name'], data['last_name'], data['email'], phone_number, pw_hash),
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as e:
        conn.rollback()
        cursor.execute(
            'SELECT user_id FROM users WHERE email = %s OR phone_number = %s LIMIT 1',
            (data['email'], phone_number),
        )
        existing_user = cursor.fetchone()
        if not existing_user:
            return jsonify({'error': str(e)}), 400

        # ✅ Bug #6 Fix: Return 409 instead of overwriting the existing user
        return jsonify({'error': 'An account with this email or phone number already exists'}), 409
    finally:
        cursor.close()
        conn.close()

    token = create_access_token(user_id, 'user')
    profile_row = sync_profile_from_user(user_id)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = %s', (user_id,))
        conn.commit()
        cursor.execute('SELECT * FROM users WHERE user_id = %s LIMIT 1', (user_id,))
        user_row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    return jsonify({'user_id': user_id, 'token': token, 'profile': build_profile_snapshot(user_row, profile_row)}), 201


@auth_bp.route('/api/login', methods=['POST'])
@auth_bp.route('/api/user/login', methods=['POST'])
def login_user():
    data = request.get_json() or {}
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'missing credentials'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE email = %s', (data['email'],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'invalid credentials'}), 401

    token = create_access_token(user['user_id'], 'user')
    profile_row = sync_profile_from_user(user['user_id'])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = %s', (user['user_id'],))
        conn.commit()
        cursor.execute('SELECT * FROM users WHERE user_id = %s LIMIT 1', (user['user_id'],))
        user_row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    return jsonify({'user_id': user['user_id'], 'token': token, 'profile': build_profile_snapshot(user_row, profile_row)})


@auth_bp.route('/api/admin/register', methods=['POST'])
def register_admin():
    data = request.get_json() or {}
    required = ('first_name', 'last_name', 'email', 'password')
    if not all(k in data for k in required):
        return jsonify({'error': 'missing fields'}), 400


    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO admin (first_name, last_name, email, password) VALUES (%s,%s,%s,%s)",
            (data['first_name'], data['last_name'], data['email'],data['password']),
        )
        conn.commit()
        admin_id = cursor.lastrowid
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    token = create_token({'sub': admin_id, 'role': 'admin'})
    return jsonify({'admin_id': admin_id, 'token': token}), 201


@auth_bp.route('/api/admin/login', methods=['POST'])
def login_admin():
    data = request.get_json() or {}
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'missing credentials'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM admin WHERE email = %s', (data['email'],))
    admin = cursor.fetchone()
    cursor.close()
    conn.close()

    if not admin or admin['password'] != data['password']:
        return jsonify({'error': 'invalid credentials'}), 401

    token = create_token({'sub': admin['admin_id'], 'role': 'admin'})

    return jsonify({'admin_id': admin['admin_id'], 'token': token}), 200
