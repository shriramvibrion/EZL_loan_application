import datetime
from functools import wraps
import jwt
from flask import g, jsonify, request
from config import Config
from database.db import get_db_connection


def create_access_token(user_id, role='user'):
    payload = {
        'sub': str(user_id),
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')


def jwt_required(role='user'):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')

            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'missing authorization token'}), 401

            token = auth_header.split(' ', 1)[1].strip()

            if not token:
                return jsonify({'error': 'empty token'}), 401

            try:
                payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'token has expired, please login again'}), 401
            except jwt.DecodeError:
                return jsonify({'error': 'token is malformed'}), 401
            except jwt.InvalidTokenError as e:
                return jsonify({'error': f'invalid token: {str(e)}'}), 401

            # ✅ Bug #7 Fix: Support single role string OR a list of roles
            if role:
                allowed_roles = [role] if isinstance(role, str) else list(role)
                if payload.get('role') not in allowed_roles:
                    return jsonify({'error': 'forbidden: insufficient permissions'}), 403

            user_id = int(payload.get('sub', 0))
            if not user_id:
                return jsonify({'error': 'invalid token payload: missing user id'}), 401

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                # ✅ Bug #7 Fix: Check the correct table based on actual token role
                actual_role = payload.get('role')
                if actual_role == 'admin':
                    cursor.execute('SELECT admin_id FROM admin WHERE admin_id = %s LIMIT 1', (user_id,))
                else:
                    cursor.execute('SELECT user_id FROM users WHERE user_id = %s LIMIT 1', (user_id,))

                if not cursor.fetchone():
                    return jsonify({'error': 'user not found'}), 401
            finally:
                cursor.close()
                conn.close()

            g.current_user_id = int(user_id)
            g.current_user_role = actual_role  # ✅ Bonus: store role in g for use in routes
            return view_func(*args, **kwargs)
        return wrapped
    return decorator