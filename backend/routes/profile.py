import json
import os
import re
import urllib.error
import urllib.request
from datetime import date, datetime

from flask import Blueprint, jsonify, request, g
from werkzeug.utils import secure_filename

from database.db import get_db_connection
from utils.auth import jwt_required


profile_bp = Blueprint('profile', __name__)

DOCUMENT_TYPES = {
    'aadhaar': 'Aadhaar',
    'pan': 'PAN',
}

IFSC_PATTERN = re.compile(r'^[A-Z]{4}0[A-Z0-9]{6}$')


def _uploads_dir():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    os.makedirs(path, exist_ok=True)
    return path


def _document_filename(document_type, user_id, original_filename):
    extension = os.path.splitext(secure_filename(original_filename or ''))[1].lower()
    return f"{DOCUMENT_TYPES[document_type]}_{user_id}{extension}"


def _lookup_ifsc(ifsc_code):
    url = f"https://ifsc.razorpay.com/{ifsc_code}"
    request_obj = urllib.request.Request(url, headers={'User-Agent': 'loan-management/1.0'})
    with urllib.request.urlopen(request_obj, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))


def _compact_address(*parts):
    return ', '.join([part for part in (_normalize(value) for value in parts) if part])


def _calculate_age(dob_value):
    if not dob_value:
        return None
    if isinstance(dob_value, datetime):
        birth_date = dob_value.date()
    elif isinstance(dob_value, date):
        birth_date = dob_value
    else:
        try:
            birth_date = datetime.strptime(str(dob_value)[:10], '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return None

    today = date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age if age >= 0 else None


def _mask_last4(value):
    cleaned = _normalize(value)
    if not cleaned:
        return None
    return f"XXXX{cleaned[-4:]}"


def ensure_profile_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    statements = [
        "DROP TABLE IF EXISTS profile_documents",
        "DROP TABLE IF EXISTS user_sessions",
        "CREATE TABLE IF NOT EXISTS profile ("
        "profile_id INT PRIMARY KEY AUTO_INCREMENT, "
        "user_id INT NOT NULL UNIQUE, "
        "first_name VARCHAR(100) NOT NULL, "
        "last_name VARCHAR(100) NOT NULL, "
        "phone_number VARCHAR(15) NOT NULL, "
        "email VARCHAR(150) NOT NULL, "
        "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
        "dob DATE NULL, "
        "age INT NULL, "
        "address VARCHAR(255) NULL, "
        "gender VARCHAR(20) NULL, "
        "marital_status VARCHAR(50) NULL, "
        "street VARCHAR(255) NULL, "
        "city VARCHAR(100) NULL, "
        "state VARCHAR(100) NULL, "
        "pincode VARCHAR(20) NULL, "
        "country VARCHAR(100) NULL, "
        "emergency_contact_primary_name VARCHAR(100) NULL, "
        "emergency_contact_primary_relationship VARCHAR(50) NULL, "
        "emergency_contact_primary_phone VARCHAR(20) NULL, "
        "emergency_contact_secondary_name VARCHAR(100) NULL, "
        "emergency_contact_secondary_relationship VARCHAR(50) NULL, "
        "emergency_contact_secondary_phone VARCHAR(20) NULL, "
        "aadhaar_number VARCHAR(32) NULL, "
        "aadhaar_last4 VARCHAR(4) NULL, "
        "aadhaar_status VARCHAR(20) NOT NULL DEFAULT 'not_added', "
        "pan_number VARCHAR(16) NULL, "
        "pan_last4 VARCHAR(4) NULL, "
        "pan_status VARCHAR(20) NOT NULL DEFAULT 'not_added', "
        "aadhaar_file_name VARCHAR(255) NULL, "
        "pan_file_name VARCHAR(255) NULL, "
        "account_mask VARCHAR(64) NULL, "
        "ifsc_code VARCHAR(32) NULL, "
        "bank_name VARCHAR(150) NULL, "
        "branch VARCHAR(150) NULL, "
        "occupation VARCHAR(100) NULL, "
        "company VARCHAR(150) NULL, "
        "designation VARCHAR(100) NULL, "
        "employment_type VARCHAR(50) NULL, "
        "experience VARCHAR(50) NULL, "
        "income VARCHAR(50) NULL, "
        "profile_locked TINYINT(1) NOT NULL DEFAULT 0, "
        "CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE"
        ")",
    ]
    user_columns = [
        ('address', "ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL"),
        ('gender', "ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL"),
        ('aadhaar_number', "ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(32) NULL"),
        ('aadhaar_status', "ALTER TABLE users ADD COLUMN aadhaar_status VARCHAR(20) NOT NULL DEFAULT 'not_added'"),
        ('pan_number', "ALTER TABLE users ADD COLUMN pan_number VARCHAR(16) NULL"),
        ('pan_status', "ALTER TABLE users ADD COLUMN pan_status VARCHAR(20) NOT NULL DEFAULT 'not_added'"),
        ('last_login_at', "ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL"),
        ('sms_notifications', "ALTER TABLE users ADD COLUMN sms_notifications TINYINT(1) NOT NULL DEFAULT 1"),
        ('email_notifications', "ALTER TABLE users ADD COLUMN email_notifications TINYINT(1) NOT NULL DEFAULT 1"),
    ]
    profile_columns = [
        ('created_at', "ALTER TABLE profile ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
        ('dob', "ALTER TABLE profile ADD COLUMN dob DATE NULL"),
        ('age', "ALTER TABLE profile ADD COLUMN age INT NULL"),
        ('marital_status', "ALTER TABLE profile ADD COLUMN marital_status VARCHAR(50) NULL"),
        ('street', "ALTER TABLE profile ADD COLUMN street VARCHAR(255) NULL"),
        ('city', "ALTER TABLE profile ADD COLUMN city VARCHAR(100) NULL"),
        ('state', "ALTER TABLE profile ADD COLUMN state VARCHAR(100) NULL"),
        ('pincode', "ALTER TABLE profile ADD COLUMN pincode VARCHAR(20) NULL"),
        ('country', "ALTER TABLE profile ADD COLUMN country VARCHAR(100) NULL"),
        ('emergency_contact_primary_name', "ALTER TABLE profile ADD COLUMN emergency_contact_primary_name VARCHAR(100) NULL"),
        ('emergency_contact_primary_relationship', "ALTER TABLE profile ADD COLUMN emergency_contact_primary_relationship VARCHAR(50) NULL"),
        ('emergency_contact_primary_phone', "ALTER TABLE profile ADD COLUMN emergency_contact_primary_phone VARCHAR(20) NULL"),
        ('emergency_contact_secondary_name', "ALTER TABLE profile ADD COLUMN emergency_contact_secondary_name VARCHAR(100) NULL"),
        ('emergency_contact_secondary_relationship', "ALTER TABLE profile ADD COLUMN emergency_contact_secondary_relationship VARCHAR(50) NULL"),
        ('emergency_contact_secondary_phone', "ALTER TABLE profile ADD COLUMN emergency_contact_secondary_phone VARCHAR(20) NULL"),
        ('aadhaar_last4', "ALTER TABLE profile ADD COLUMN aadhaar_last4 VARCHAR(4) NULL"),
        ('pan_last4', "ALTER TABLE profile ADD COLUMN pan_last4 VARCHAR(4) NULL"),
        ('aadhaar_file_name', "ALTER TABLE profile ADD COLUMN aadhaar_file_name VARCHAR(255) NULL"),
        ('pan_file_name', "ALTER TABLE profile ADD COLUMN pan_file_name VARCHAR(255) NULL"),
        ('account_mask', "ALTER TABLE profile ADD COLUMN account_mask VARCHAR(64) NULL"),
        ('ifsc_code', "ALTER TABLE profile ADD COLUMN ifsc_code VARCHAR(32) NULL"),
        ('bank_name', "ALTER TABLE profile ADD COLUMN bank_name VARCHAR(150) NULL"),
        ('branch', "ALTER TABLE profile ADD COLUMN branch VARCHAR(150) NULL"),
        ('occupation', "ALTER TABLE profile ADD COLUMN occupation VARCHAR(100) NULL"),
        ('company', "ALTER TABLE profile ADD COLUMN company VARCHAR(150) NULL"),
        ('designation', "ALTER TABLE profile ADD COLUMN designation VARCHAR(100) NULL"),
        ('employment_type', "ALTER TABLE profile ADD COLUMN employment_type VARCHAR(50) NULL"),
        ('experience', "ALTER TABLE profile ADD COLUMN experience VARCHAR(50) NULL"),
        ('income', "ALTER TABLE profile ADD COLUMN income VARCHAR(50) NULL"),
        ('profile_locked', "ALTER TABLE profile ADD COLUMN profile_locked TINYINT(1) NOT NULL DEFAULT 0"),
    ]

    try:
        for column_name, statement in user_columns:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = %s
                """,
                (column_name,),
            )
            if cursor.fetchone()[0] == 0:
                cursor.execute(statement)

        for statement in statements:
            cursor.execute(statement)

        for column_name, statement in profile_columns:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'profile' AND column_name = %s
                """,
                (column_name,),
            )
            if cursor.fetchone()[0] == 0:
                cursor.execute(statement)

        conn.commit()
    finally:
        cursor.close()
        conn.close()


def _normalize(value):
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None
    return value


def _last4(value):
    if not value:
        return None
    return value[-4:]


def _fetch_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT user_id, first_name, last_name, phone_number, email, address, gender,
                   aadhaar_number, aadhaar_status, pan_number, pan_status,
                   sms_notifications, email_notifications, last_login_at
            FROM users
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def _fetch_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
             SELECT profile_id, user_id, first_name, last_name, phone_number, email, created_at,
                 dob, age, gender, marital_status, street, city, state, pincode, country, address,
                 emergency_contact_primary_name, emergency_contact_primary_relationship,
                 emergency_contact_primary_phone, emergency_contact_secondary_name,
                 emergency_contact_secondary_relationship, emergency_contact_secondary_phone,
                 aadhaar_number, aadhaar_last4, aadhaar_status, pan_number, pan_last4, pan_status,
                 aadhaar_file_name, pan_file_name, account_mask, ifsc_code, bank_name, branch,
                 occupation, company, designation, employment_type, experience, income, profile_locked
            FROM profile
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def sync_profile_from_user(user_id):
    user_row = _fetch_user(user_id)
    if not user_row:
        return None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT profile_id FROM profile WHERE user_id = %s LIMIT 1', (user_id,))
        existing = cursor.fetchone()
        values = (
            user_row['first_name'],
            user_row['last_name'],
            user_row['phone_number'],
            user_row['email'],
            user_row.get('address'),
            user_row.get('gender'),
            user_row.get('aadhaar_number'),
            user_row.get('aadhaar_status') or 'not_added',
            user_row.get('pan_number'),
            user_row.get('pan_status') or 'not_added',
        )

        if existing:
            cursor.execute(
                """
                UPDATE profile
                SET first_name = %s,
                    last_name = %s,
                    phone_number = %s,
                    email = %s
                WHERE user_id = %s
                """,
                (*values[:4], user_id),
            )
        else:
            cursor.execute(
                """
                INSERT INTO profile (
                    user_id, first_name, last_name, phone_number, email, address, gender,
                    aadhaar_number, aadhaar_status, pan_number, pan_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, *values),
            )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    return _fetch_profile(user_id)


def _completion_percent(profile_row):
    required_fields = [
        profile_row.get('first_name'),
        profile_row.get('last_name'),
        profile_row.get('email'),
        profile_row.get('phone_number'),
        profile_row.get('address'),
        profile_row.get('gender'),
        profile_row.get('aadhaar_number'),
        profile_row.get('pan_number'),
    ]
    filled = sum(1 for value in required_fields if _normalize(value))
    return round((filled / 8) * 100)


def _profile_payload(profile_row, user_row):
    def json_value(value):
        if value == '':
            return None
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        return value

    fields = [
        'user_id',
        'profile_id',
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'created_at',
        'dob',
        'age',
        'address',
        'street',
        'city',
        'state',
        'pincode',
        'country',
        'gender',
        'marital_status',
        'emergency_contact_primary_name',
        'emergency_contact_primary_relationship',
        'emergency_contact_primary_phone',
        'emergency_contact_secondary_name',
        'emergency_contact_secondary_relationship',
        'emergency_contact_secondary_phone',
        'aadhaar_number',
        'aadhaar_last4',
        'aadhaar_status',
        'pan_number',
        'pan_last4',
        'pan_status',
        'aadhaar_file_name',
        'pan_file_name',
        'account_mask',
        'ifsc_code',
        'bank_name',
        'branch',
        'occupation',
        'company',
        'designation',
        'employment_type',
        'experience',
        'income',
        'profile_locked',
    ]

    payload = {field: json_value(profile_row.get(field)) for field in fields}
    payload['aadhaar_number'] = _mask_last4(profile_row.get('aadhaar_number') or profile_row.get('aadhaar_last4'))
    payload['pan_number'] = _mask_last4(profile_row.get('pan_number') or profile_row.get('pan_last4'))
    payload['title'] = payload.get('occupation')
    payload['primary_contact_name'] = payload.get('emergency_contact_primary_name')
    payload['primary_contact_relationship'] = payload.get('emergency_contact_primary_relationship')
    payload['primary_contact_phone'] = payload.get('emergency_contact_primary_phone')
    payload['secondary_contact_name'] = payload.get('emergency_contact_secondary_name')
    payload['secondary_contact_relationship'] = payload.get('emergency_contact_secondary_relationship')
    payload['secondary_contact_phone'] = payload.get('emergency_contact_secondary_phone')
    payload['completion_percent'] = _completion_percent(profile_row)
    payload['notifications'] = {
        'sms': bool(user_row.get('sms_notifications')),
        'email': bool(user_row.get('email_notifications')),
    }
    payload['last_login_at'] = json_value(user_row.get('last_login_at'))
    return payload



@profile_bp.get('/api/profile')
@jwt_required('user')
def get_profile():
    synced_profile = sync_profile_from_user(g.current_user_id)
    user_row = _fetch_user(g.current_user_id)
    if not synced_profile or not user_row:
        return jsonify({'error': 'profile not found'}), 404
    return jsonify(_profile_payload(synced_profile, user_row))


@profile_bp.put('/api/profile')
@jwt_required('user')
def update_profile():
    # PUT now supports the same full payload semantics as POST for consistency.
    return upsert_profile()


@profile_bp.post('/api/profile')
@jwt_required('user')
def upsert_profile():
    data = request.get_json() or {}
    user_id = g.current_user_id
    user_row = _fetch_user(user_id)
    if not user_row:
        return jsonify({'error': 'user not found'}), 404

    # Frontend may send `phone`; map it to DB column `phone_number`.
    if 'phone' in data and 'phone_number' not in data:
        data['phone_number'] = data.get('phone')
    if 'title' in data and 'occupation' not in data:
        data['occupation'] = data.get('title')
    contact_aliases = {
        'primary_contact_name': 'emergency_contact_primary_name',
        'primary_contact_relationship': 'emergency_contact_primary_relationship',
        'primary_contact_phone': 'emergency_contact_primary_phone',
        'secondary_contact_name': 'emergency_contact_secondary_name',
        'secondary_contact_relationship': 'emergency_contact_secondary_relationship',
        'secondary_contact_phone': 'emergency_contact_secondary_phone',
    }
    for alias, column in contact_aliases.items():
        alias_value = _normalize(data.get(alias))
        if alias_value is not None:
            data[column] = alias_value

    if any(field in data for field in ['street', 'city', 'state', 'pincode', 'country']) and 'address' not in data:
        data['address'] = _compact_address(
            data.get('street'),
            data.get('city'),
            data.get('state'),
            data.get('pincode'),
            data.get('country'),
        )

    calculated_age = _calculate_age(data.get('dob'))
    if calculated_age is not None:
        data['age'] = calculated_age

    if data.get('ifsc_code') and (not data.get('bank_name') or not data.get('branch')):
        normalized_ifsc = _normalize(data.get('ifsc_code'))
        if normalized_ifsc:
            normalized_ifsc = normalized_ifsc.upper()
            data['ifsc_code'] = normalized_ifsc
            if IFSC_PATTERN.fullmatch(normalized_ifsc):
                try:
                    ifsc_data = _lookup_ifsc(normalized_ifsc)
                    data['bank_name'] = data.get('bank_name') or ifsc_data.get('BANK') or ifsc_data.get('BANKNAME')
                    data['branch'] = data.get('branch') or ifsc_data.get('BRANCH')
                except Exception:
                    pass

    if data.get('aadhaar_number') and str(data.get('aadhaar_number')).upper().startswith('XXXX'):
        data.pop('aadhaar_number', None)

    if data.get('pan_number') and str(data.get('pan_number')).upper().startswith('XXXX'):
        data.pop('pan_number', None)

    if data.get('aadhaar_number'):
        aadhaar_number = re.sub(r'\D', '', str(data.get('aadhaar_number')))
        if len(aadhaar_number) >= 4:
            data['aadhaar_number'] = aadhaar_number
            data['aadhaar_last4'] = aadhaar_number[-4:]

    if data.get('pan_number'):
        pan_number = str(data.get('pan_number')).upper().replace(' ', '')
        if len(pan_number) >= 4:
            data['pan_number'] = pan_number
            data['pan_last4'] = pan_number[-4:]

    data['profile_locked'] = 1

    profile_fields = [
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'dob',
        'age',
        'address',
        'street',
        'city',
        'state',
        'pincode',
        'country',
        'gender',
        'marital_status',
        'emergency_contact_primary_name',
        'emergency_contact_primary_relationship',
        'emergency_contact_primary_phone',
        'emergency_contact_secondary_name',
        'emergency_contact_secondary_relationship',
        'emergency_contact_secondary_phone',
        'aadhaar_number',
        'aadhaar_last4',
        'aadhaar_status',
        'pan_number',
        'pan_last4',
        'pan_status',
        'aadhaar_file_name',
        'pan_file_name',
        'account_mask',
        'ifsc_code',
        'bank_name',
        'branch',
        'occupation',
        'company',
        'designation',
        'employment_type',
        'experience',
        'income',
        'profile_locked',
    ]

    incoming_profile = {}
    for field in profile_fields:
        if field in data:
            incoming_profile[field] = _normalize(data.get(field))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT profile_id, profile_locked, dob, aadhaar_number, aadhaar_last4,
                   pan_number, pan_last4, account_mask, ifsc_code
            FROM profile
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        existing = cursor.fetchone()

        if existing:
            for inherited_field in ['first_name', 'last_name', 'phone_number', 'email']:
                incoming_profile.pop(inherited_field, None)
            write_once_fields = {
                'dob': ['dob', 'age'],
                'aadhaar_number': ['aadhaar_number', 'aadhaar_last4'],
                'aadhaar_last4': ['aadhaar_number', 'aadhaar_last4'],
                'pan_number': ['pan_number', 'pan_last4'],
                'pan_last4': ['pan_number', 'pan_last4'],
                'account_mask': ['account_mask'],
                'ifsc_code': ['ifsc_code', 'bank_name', 'branch'],
            }
            for source_field, protected_fields in write_once_fields.items():
                if existing.get(source_field):
                    for protected_field in protected_fields:
                        incoming_profile.pop(protected_field, None)

        if existing:
            if incoming_profile:
                set_clause = ', '.join([f"{k} = %s" for k in incoming_profile.keys()])
                query = f"UPDATE profile SET {set_clause} WHERE user_id = %s"
                cursor.execute(query, (*incoming_profile.values(), user_id))
        else:
            seed = {
                'first_name': user_row.get('first_name'),
                'last_name': user_row.get('last_name'),
                'phone_number': user_row.get('phone_number'),
                'email': user_row.get('email'),
                'address': user_row.get('address'),
                'gender': user_row.get('gender'),
                'aadhaar_number': user_row.get('aadhaar_number'),
                'aadhaar_status': user_row.get('aadhaar_status'),
                'pan_number': user_row.get('pan_number'),
                'pan_status': user_row.get('pan_status'),
            }
            seed.update(incoming_profile)

            required = ['first_name', 'last_name', 'phone_number', 'email']
            missing_required = [k for k in required if not seed.get(k)]
            if missing_required:
                return jsonify({'error': f"missing required fields: {', '.join(missing_required)}"}), 400

            insert_columns = ['user_id'] + profile_fields
            insert_values = [user_id] + [seed.get(col) for col in profile_fields]
            placeholders = ', '.join(['%s'] * len(insert_columns))
            cursor.execute(
                f"INSERT INTO profile ({', '.join(insert_columns)}) VALUES ({placeholders})",
                tuple(insert_values),
            )

        # Keep canonical user fields in sync when they are provided.
        user_updates = {}

        if 'last_login_at' in data:
            user_updates['last_login_at'] = _normalize(data.get('last_login_at'))

        notifications = data.get('notifications')
        if isinstance(notifications, dict):
            if 'sms' in notifications:
                user_updates['sms_notifications'] = int(bool(notifications.get('sms')))
            if 'email' in notifications:
                user_updates['email_notifications'] = int(bool(notifications.get('email')))

        if user_updates:
            user_set_clause = ', '.join([f"{k} = %s" for k in user_updates.keys()])
            user_query = f"UPDATE users SET {user_set_clause} WHERE user_id = %s"
            cursor.execute(user_query, (*user_updates.values(), user_id))

        conn.commit()
    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()

    updated_profile = _fetch_profile(user_id)
    updated_user = _fetch_user(user_id)
    return jsonify(_profile_payload(updated_profile, updated_user))


@profile_bp.post('/api/profile/document')
@jwt_required('user')
def upload_profile_document():
    document_type = _normalize(request.form.get('document_type'))
    if document_type not in DOCUMENT_TYPES:
        return jsonify({'error': 'invalid document_type'}), 400

    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'error': 'missing file'}), 400

    profile_row = sync_profile_from_user(g.current_user_id)
    user_row = _fetch_user(g.current_user_id)
    if not profile_row or not user_row:
        return jsonify({'error': 'profile not found'}), 404

    stored_name = _document_filename(document_type, g.current_user_id, file.filename)
    file.save(os.path.join(_uploads_dir(), stored_name))

    column = f"{document_type}_file_name"
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"UPDATE profile SET {column} = %s WHERE user_id = %s", (stored_name, g.current_user_id))
        conn.commit()
    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()

    updated_profile = _fetch_profile(g.current_user_id)
    return jsonify({
        'document_type': document_type,
        'file_name': stored_name,
        'profile': _profile_payload(updated_profile, user_row),
    })


@profile_bp.get('/api/profile/ifsc/<ifsc_code>')
@jwt_required('user')
def get_ifsc_details(ifsc_code):
    normalized_ifsc = (ifsc_code or '').strip().upper()
    if not IFSC_PATTERN.fullmatch(normalized_ifsc):
        return jsonify({'error': 'wrong ifsc code'}), 400

    try:
        data = _lookup_ifsc(normalized_ifsc)
    except urllib.error.HTTPError:
        return jsonify({'error': 'wrong ifsc code'}), 404
    except Exception:
        return jsonify({'error': 'unable to verify ifsc code'}), 502

    bank_name = data.get('BANK') or data.get('BANKNAME')
    branch = data.get('BRANCH')
    if not bank_name or not branch:
        return jsonify({'error': 'no branch found'}), 404

    return jsonify({
        'ifsc_code': normalized_ifsc,
        'bank_name': bank_name,
        'branch': branch,
    })


@profile_bp.post('/api/profile/kyc')
@jwt_required('user')
def submit_kyc():
    data = request.get_json() or {}
    user_row = _fetch_user(g.current_user_id)
    profile_row = _fetch_profile(g.current_user_id)
    if not user_row or not profile_row:
        return jsonify({'error': 'profile not found'}), 404
    if profile_row.get('profile_locked'):
        return jsonify({'error': 'profile is locked'}), 403

    updates = {}
    if data.get('aadhaar_number'):
        if profile_row.get('aadhaar_status') == 'verified':
            return jsonify({'error': 'aadhaar already verified'}), 403
        aadhaar_number = re.sub(r'\D', '', str(data.get('aadhaar_number')))
        if not re.fullmatch(r'\d{12}', aadhaar_number):
            return jsonify({'error': 'invalid aadhaar number'}), 400
        updates['aadhaar_number'] = aadhaar_number
        updates['aadhaar_status'] = 'pending'

    if data.get('pan_number'):
        if profile_row.get('pan_status') == 'verified':
            return jsonify({'error': 'pan already verified'}), 403
        pan_number = str(data.get('pan_number')).upper().replace(' ', '')
        if not re.fullmatch(r'[A-Z]{5}[0-9]{4}[A-Z]', pan_number):
            return jsonify({'error': 'invalid pan number'}), 400
        updates['pan_number'] = pan_number
        updates['pan_status'] = 'pending'

    if not updates:
        return jsonify({'error': 'no kyc data provided'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if 'aadhaar_number' in updates:
            cursor.execute(
                "UPDATE profile SET aadhaar_number = %s, aadhaar_status = %s WHERE user_id = %s",
                (updates['aadhaar_number'], updates['aadhaar_status'], g.current_user_id),
            )
            cursor.execute(
                "UPDATE users SET aadhaar_number = %s, aadhaar_status = %s WHERE user_id = %s",
                (updates['aadhaar_number'], updates['aadhaar_status'], g.current_user_id),
            )

        if 'pan_number' in updates:
            cursor.execute(
                "UPDATE profile SET pan_number = %s, pan_status = %s WHERE user_id = %s",
                (updates['pan_number'], updates['pan_status'], g.current_user_id),
            )
            cursor.execute(
                "UPDATE users SET pan_number = %s, pan_status = %s WHERE user_id = %s",
                (updates['pan_number'], updates['pan_status'], g.current_user_id),
            )

        conn.commit()
    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()

    updated_profile = _fetch_profile(g.current_user_id)
    updated_user = _fetch_user(g.current_user_id)
    return jsonify(_profile_payload(updated_profile, updated_user))


@profile_bp.put('/api/profile/notifications')
@jwt_required('user')
def update_notifications():
    data = request.get_json() or {}
    sms = bool(data.get('sms'))
    email = bool(data.get('email'))

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET sms_notifications = %s, email_notifications = %s WHERE user_id = %s",
            (int(sms), int(email), g.current_user_id),
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    synced_profile = sync_profile_from_user(g.current_user_id)
    user_row = _fetch_user(g.current_user_id)
    return jsonify(_profile_payload(synced_profile, user_row))
