"""
Loan Application Routes
========================
POST   /api/loan/draft           – create or update a draft (auto-save per step)
GET    /api/loan/draft            – get current in-progress draft for the user
POST   /api/loan/submit           – finalize and submit the draft
GET    /api/loan/applications     – list all loans for the logged-in user
GET    /api/loan/<loan_id>        – get single loan detail
POST   /api/loan/<loan_id>/document  – upload a document for a loan
GET    /api/loan/<loan_id>/document/<doc_type>  – view/download a document
"""

import os
import random
import string
from datetime import datetime

from flask import Blueprint, g, jsonify, request
from werkzeug.utils import secure_filename

from database.db import get_db_connection
from utils.auth import jwt_required

loan_bp = Blueprint('loan', __name__)

# ─── Allowed document types ───────────────────────────────
LOAN_DOC_TYPES = {
    'aadhaar_scan',
    'pan_scan',
    'passport_photo',
    'bank_statement',
    'salary_slip',
    'co_aadhaar',
    'co_pan',
    'co_photo',
    'guarantor_aadhaar',
    'guarantor_pan',
    'guarantor_photo',
    'other',
}

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}


# ─── Helpers ──────────────────────────────────────────────

def _uploads_dir():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads', 'loan'))
    os.makedirs(path, exist_ok=True)
    return path


def _generate_application_id():
    """Generate unique ID like EZL-2024-A3X9"""
    year = datetime.now().year
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"EZL-{year}-{suffix}"


def _ensure_unique_application_id(cursor):
    for _ in range(10):
        app_id = _generate_application_id()
        cursor.execute('SELECT 1 FROM loan_applications WHERE application_id = %s', (app_id,))
        if not cursor.fetchone():
            return app_id
    raise RuntimeError('Could not generate unique application ID')


def _record_status_change(cursor, loan_id, from_status, to_status, role='user', actor_id=None, note=None):
    cursor.execute(
        '''INSERT INTO loan_status_history
           (loan_id, from_status, to_status, changed_by_role, changed_by_id, note)
           VALUES (%s, %s, %s, %s, %s, %s)''',
        (loan_id, from_status, to_status, role, actor_id, note),
    )


def _loan_payload(row):
    """Serialize a loan_applications row to dict."""
    if not row:
        return None
    result = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
        elif hasattr(v, 'isoformat'):          # date
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result


def _get_loan_documents(cursor, loan_id):
    cursor.execute(
        'SELECT doc_id, doc_type, original_name, file_size_kb, is_verified, uploaded_at FROM loan_documents WHERE loan_id = %s',
        (loan_id,)
    )
    rows = cursor.fetchall()
    docs = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get('uploaded_at'), datetime):
            d['uploaded_at'] = d['uploaded_at'].isoformat()
        docs.append(d)
    return docs


def ensure_loan_tables():
    """Create loan tables if they don't exist (called at startup)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_applications (
                loan_id            INT          PRIMARY KEY AUTO_INCREMENT,
                application_id     VARCHAR(30)  NOT NULL UNIQUE,
                user_id            INT          NOT NULL,
                loan_type          VARCHAR(50)  NULL,
                amount             DECIMAL(12,2) NULL,
                tenure_months      INT          NULL,
                purpose            VARCHAR(100) NULL,
                interest_rate      DECIMAL(5,2) NULL DEFAULT 10.50,
                processing_fee     DECIMAL(10,2) NULL DEFAULT 999.00,
                applicant_name     VARCHAR(200) NULL,
                applicant_dob      DATE         NULL,
                applicant_gender   VARCHAR(20)  NULL,
                applicant_phone    VARCHAR(15)  NULL,
                applicant_email    VARCHAR(150) NULL,
                applicant_address  TEXT         NULL,
                aadhaar_number     VARCHAR(32)  NULL,
                pan_number         VARCHAR(16)  NULL,
                employment_type    VARCHAR(50)  NULL,
                company_name       VARCHAR(150) NULL,
                designation        VARCHAR(100) NULL,
                monthly_income     DECIMAL(12,2) NULL,
                total_experience   VARCHAR(50)  NULL,
                current_exp        VARCHAR(50)  NULL,
                has_co_applicant   TINYINT(1)  NOT NULL DEFAULT 0,
                has_guarantor      TINYINT(1)  NOT NULL DEFAULT 0,
                agreed_terms       TINYINT(1)  NOT NULL DEFAULT 0,
                esign_consent      TINYINT(1)  NOT NULL DEFAULT 0,
                status             VARCHAR(40)  NOT NULL DEFAULT 'draft',
                current_step       INT          NOT NULL DEFAULT 0,
                assigned_verifier  INT          NULL,
                assigned_disburser INT          NULL,
                submitted_at       DATETIME     NULL,
                verified_at        DATETIME     NULL,
                disbursed_at       DATETIME     NULL,
                created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_co_applicants (
                co_id              INT          PRIMARY KEY AUTO_INCREMENT,
                loan_id            INT          NOT NULL UNIQUE,
                full_name          VARCHAR(200) NULL,
                relationship       VARCHAR(50)  NULL,
                aadhaar_number     VARCHAR(32)  NULL,
                pan_number         VARCHAR(16)  NULL,
                employment_type    VARCHAR(50)  NULL,
                monthly_gross      DECIMAL(12,2) NULL,
                monthly_net        DECIMAL(12,2) NULL,
                organization       VARCHAR(150) NULL,
                rental_income      DECIMAL(12,2) NULL DEFAULT 0,
                other_income       DECIMAL(12,2) NULL DEFAULT 0,
                created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_co_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_guarantors (
                guarantor_id       INT          PRIMARY KEY AUTO_INCREMENT,
                loan_id            INT          NOT NULL UNIQUE,
                full_name          VARCHAR(200) NULL,
                aadhaar_number     VARCHAR(32)  NULL,
                pan_number         VARCHAR(16)  NULL,
                employment_type    VARCHAR(50)  NULL,
                annual_income      DECIMAL(12,2) NULL,
                monthly_net        DECIMAL(12,2) NULL,
                employer_name      VARCHAR(150) NULL,
                industry           VARCHAR(100) NULL,
                years_at_job       VARCHAR(20)  NULL,
                created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_guarantor_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_documents (
                doc_id             INT          PRIMARY KEY AUTO_INCREMENT,
                loan_id            INT          NOT NULL,
                user_id            INT          NOT NULL,
                doc_type           VARCHAR(50)  NOT NULL,
                original_name      VARCHAR(255) NOT NULL,
                stored_name        VARCHAR(255) NOT NULL UNIQUE,
                mime_type          VARCHAR(100) NULL,
                file_size_kb       INT          NULL,
                is_verified        TINYINT(1)  NOT NULL DEFAULT 0,
                verified_by        INT          NULL,
                verified_at        DATETIME     NULL,
                verifier_note      TEXT         NULL,
                uploaded_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_ldoc_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
                CONSTRAINT fk_ldoc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_status_history (
                history_id         INT          PRIMARY KEY AUTO_INCREMENT,
                loan_id            INT          NOT NULL,
                from_status        VARCHAR(40)  NULL,
                to_status          VARCHAR(40)  NOT NULL,
                changed_by_role    VARCHAR(20)  NOT NULL,
                changed_by_id      INT          NULL,
                note               TEXT         NULL,
                changed_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_hist_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
            )
        ''')

        conn.commit()
    finally:
        cursor.close()
        conn.close()


# ─── Routes ───────────────────────────────────────────────

@loan_bp.get('/api/loan/draft')
@jwt_required('user')
def get_draft():
    """Return the user's current draft application (if any)."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM loan_applications WHERE user_id = %s AND status = 'draft' ORDER BY created_at DESC LIMIT 1",
            (g.current_user_id,)
        )
        loan = cursor.fetchone()
        if not loan:
            return jsonify({'draft': None}), 200

        loan_id = loan['loan_id']
        payload = _loan_payload(loan)

        # Co-applicant
        cursor.execute('SELECT * FROM loan_co_applicants WHERE loan_id = %s', (loan_id,))
        payload['co_applicant'] = cursor.fetchone() or {}

        # Guarantor
        cursor.execute('SELECT * FROM loan_guarantors WHERE loan_id = %s', (loan_id,))
        payload['guarantor'] = cursor.fetchone() or {}

        # Documents
        payload['documents'] = _get_loan_documents(cursor, loan_id)

        return jsonify({'draft': payload}), 200
    finally:
        cursor.close()
        conn.close()


@loan_bp.post('/api/loan/draft')
@jwt_required('user')
def save_draft():
    """
    Create or update the draft. Called on each step navigation (auto-save).
    Body fields map 1:1 to DB columns. Unknown keys are silently ignored.
    """
    data = request.get_json() or {}
    user_id = g.current_user_id

    # Fields allowed to be updated per table
    LOAN_FIELDS = [
        'loan_type', 'amount', 'tenure_months', 'purpose',
        'applicant_name', 'applicant_dob', 'applicant_gender',
        'applicant_phone', 'applicant_email', 'applicant_address',
        'aadhaar_number', 'pan_number',
        'employment_type', 'company_name', 'designation',
        'monthly_income', 'total_experience', 'current_exp',
        'has_co_applicant', 'has_guarantor',
        'agreed_terms', 'esign_consent',
        'current_step',
    ]

    CO_FIELDS = [
        'full_name', 'relationship', 'aadhaar_number', 'pan_number',
        'employment_type', 'monthly_gross', 'monthly_net',
        'organization', 'rental_income', 'other_income',
    ]

    GUARANTOR_FIELDS = [
        'full_name', 'aadhaar_number', 'pan_number',
        'employment_type', 'annual_income', 'monthly_net',
        'employer_name', 'industry', 'years_at_job',
    ]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Find existing draft
        cursor.execute(
            "SELECT loan_id, status FROM loan_applications WHERE user_id = %s AND status = 'draft' ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        existing = cursor.fetchone()

        # Build loan update dict
        loan_update = {k: data[k] for k in LOAN_FIELDS if k in data}

        # Coerce empty strings to None for ALL numeric/decimal columns
        NUMERIC_FIELDS = {'amount', 'tenure_months', 'monthly_income'}
        for field in NUMERIC_FIELDS:
            if field in loan_update and (loan_update[field] == '' or loan_update[field] is None):
                loan_update[field] = None

        CO_NUMERIC = {'monthly_gross', 'monthly_net', 'rental_income', 'other_income'}
        G_NUMERIC  = {'annual_income', 'monthly_net'}

        def _sanitize_numeric(d, fields):
            for f in fields:
                if f in d and (d[f] == '' or d[f] is None):
                    d[f] = None
            return d

        if existing:
            loan_id = existing['loan_id']
            if loan_update:
                set_clause = ', '.join(f'{k} = %s' for k in loan_update)
                cursor.execute(
                    f'UPDATE loan_applications SET {set_clause} WHERE loan_id = %s',
                    [*loan_update.values(), loan_id]
                )
        else:
            # Create new draft
            app_id = _ensure_unique_application_id(cursor)
            loan_update['user_id'] = user_id
            loan_update['application_id'] = app_id
            loan_update['status'] = 'draft'
            cols = ', '.join(loan_update.keys())
            placeholders = ', '.join(['%s'] * len(loan_update))
            cursor.execute(
                f'INSERT INTO loan_applications ({cols}) VALUES ({placeholders})',
                list(loan_update.values())
            )
            loan_id = cursor.lastrowid
            _record_status_change(cursor, loan_id, None, 'draft', 'user', user_id, 'Application started')

        # Co-applicant
        co_data = data.get('co_applicant')
        if co_data and isinstance(co_data, dict):
            co_update = {k: co_data[k] for k in CO_FIELDS if k in co_data}
            co_update = _sanitize_numeric(co_update, CO_NUMERIC)
            if co_update:
                cursor.execute('SELECT co_id FROM loan_co_applicants WHERE loan_id = %s', (loan_id,))
                if cursor.fetchone():
                    set_clause = ', '.join(f'{k} = %s' for k in co_update)
                    cursor.execute(
                        f'UPDATE loan_co_applicants SET {set_clause} WHERE loan_id = %s',
                        [*co_update.values(), loan_id]
                    )
                else:
                    co_update['loan_id'] = loan_id
                    cols = ', '.join(co_update.keys())
                    placeholders = ', '.join(['%s'] * len(co_update))
                    cursor.execute(
                        f'INSERT INTO loan_co_applicants ({cols}) VALUES ({placeholders})',
                        list(co_update.values())
                    )

        # Guarantor
        g_data = data.get('guarantor')
        if g_data and isinstance(g_data, dict):
            g_update = {k: g_data[k] for k in GUARANTOR_FIELDS if k in g_data}
            g_update = _sanitize_numeric(g_update, G_NUMERIC)
            if g_update:
                cursor.execute('SELECT guarantor_id FROM loan_guarantors WHERE loan_id = %s', (loan_id,))
                if cursor.fetchone():
                    set_clause = ', '.join(f'{k} = %s' for k in g_update)
                    cursor.execute(
                        f'UPDATE loan_guarantors SET {set_clause} WHERE loan_id = %s',
                        [*g_update.values(), loan_id]
                    )
                else:
                    g_update['loan_id'] = loan_id
                    cols = ', '.join(g_update.keys())
                    placeholders = ', '.join(['%s'] * len(g_update))
                    cursor.execute(
                        f'INSERT INTO loan_guarantors ({cols}) VALUES ({placeholders})',
                        list(g_update.values())
                    )

        conn.commit()

        # Return updated draft
        cursor.execute('SELECT application_id, loan_id, current_step, status FROM loan_applications WHERE loan_id = %s', (loan_id,))
        row = cursor.fetchone()
        return jsonify({'loan_id': loan_id, 'application_id': row['application_id'], 'status': 'draft'}), 200

    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()


@loan_bp.post('/api/loan/submit')
@jwt_required('user')
def submit_loan():
    """Submit the current draft. Validates required fields then changes status to 'submitted'."""
    user_id = g.current_user_id
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM loan_applications WHERE user_id = %s AND status = 'draft' ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        loan = cursor.fetchone()
        if not loan:
            return jsonify({'error': 'No draft application found'}), 404

        loan_id = loan['loan_id']

        # Validate minimum required fields
        missing = []
        if not loan.get('loan_type'):
            missing.append('loan_type')
        if not loan.get('amount'):
            missing.append('amount')
        if not loan.get('agreed_terms'):
            missing.append('agreed_terms')

        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        cursor.execute(
            '''UPDATE loan_applications
               SET status = 'submitted', submitted_at = %s
               WHERE loan_id = %s''',
            (datetime.now(), loan_id)
        )
        _record_status_change(cursor, loan_id, 'draft', 'submitted', 'user', user_id, 'Application submitted by user')
        conn.commit()

        cursor.execute('SELECT application_id FROM loan_applications WHERE loan_id = %s', (loan_id,))
        row = cursor.fetchone()
        return jsonify({
            'loan_id': loan_id,
            'application_id': row['application_id'],
            'status': 'submitted',
            'message': 'Application submitted successfully',
        }), 200

    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()


@loan_bp.get('/api/loan/applications')
@jwt_required('user')
def list_applications():
    """Return all loan applications for the logged-in user."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''SELECT loan_id, application_id, loan_type, amount, tenure_months,
                      status, current_step, submitted_at, disbursed_at, created_at, updated_at
               FROM loan_applications
               WHERE user_id = %s
               ORDER BY created_at DESC''',
            (g.current_user_id,)
        )
        rows = cursor.fetchall()
        return jsonify({'applications': [_loan_payload(r) for r in rows]}), 200
    finally:
        cursor.close()
        conn.close()


@loan_bp.get('/api/loan/<int:loan_id>')
@jwt_required('user')
def get_application(loan_id):
    """Return full detail of a single loan application (must belong to user)."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            'SELECT * FROM loan_applications WHERE loan_id = %s AND user_id = %s',
            (loan_id, g.current_user_id)
        )
        loan = cursor.fetchone()
        if not loan:
            return jsonify({'error': 'Application not found'}), 404

        payload = _loan_payload(loan)

        cursor.execute('SELECT * FROM loan_co_applicants WHERE loan_id = %s', (loan_id,))
        payload['co_applicant'] = cursor.fetchone() or {}

        cursor.execute('SELECT * FROM loan_guarantors WHERE loan_id = %s', (loan_id,))
        payload['guarantor'] = cursor.fetchone() or {}

        payload['documents'] = _get_loan_documents(cursor, loan_id)

        cursor.execute(
            'SELECT from_status, to_status, changed_by_role, note, changed_at FROM loan_status_history WHERE loan_id = %s ORDER BY changed_at ASC',
            (loan_id,)
        )
        history = []
        for r in cursor.fetchall():
            h = dict(r)
            if isinstance(h.get('changed_at'), datetime):
                h['changed_at'] = h['changed_at'].isoformat()
            history.append(h)
        payload['status_history'] = history

        return jsonify({'application': payload}), 200
    finally:
        cursor.close()
        conn.close()


@loan_bp.post('/api/loan/<int:loan_id>/document')
@jwt_required('user')
def upload_loan_document(loan_id):
    """Upload a document for a specific loan application."""
    user_id = g.current_user_id

    # Verify loan belongs to user
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            'SELECT loan_id, status FROM loan_applications WHERE loan_id = %s AND user_id = %s',
            (loan_id, user_id)
        )
        loan = cursor.fetchone()
        if not loan:
            return jsonify({'error': 'Application not found'}), 404

        doc_type = request.form.get('doc_type', '').strip()
        if doc_type not in LOAN_DOC_TYPES:
            return jsonify({'error': f'Invalid doc_type. Allowed: {", ".join(sorted(LOAN_DOC_TYPES))}'}), 400

        file = request.files.get('file')
        if not file or not file.filename:
            return jsonify({'error': 'No file provided'}), 400

        ext = os.path.splitext(secure_filename(file.filename))[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({'error': 'Only PDF, JPG, PNG files are allowed'}), 400

        # Build unique stored filename
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        stored_name = f'loan_{loan_id}_{user_id}_{doc_type}_{timestamp}{ext}'

        uploads = _uploads_dir()
        file_path = os.path.join(uploads, stored_name)
        file.save(file_path)
        file_size_kb = max(1, os.path.getsize(file_path) // 1024)

        mime_map = {'.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}
        mime_type = mime_map.get(ext, 'application/octet-stream')

        # Remove old doc of same type for this loan (replace)
        cursor.execute(
            'SELECT stored_name FROM loan_documents WHERE loan_id = %s AND doc_type = %s',
            (loan_id, doc_type)
        )
        old = cursor.fetchone()
        if old:
            old_path = os.path.join(uploads, old['stored_name'])
            if os.path.exists(old_path):
                os.remove(old_path)
            cursor.execute(
                'DELETE FROM loan_documents WHERE loan_id = %s AND doc_type = %s',
                (loan_id, doc_type)
            )

        cursor.execute(
            '''INSERT INTO loan_documents
               (loan_id, user_id, doc_type, original_name, stored_name, mime_type, file_size_kb)
               VALUES (%s, %s, %s, %s, %s, %s, %s)''',
            (loan_id, user_id, doc_type, secure_filename(file.filename), stored_name, mime_type, file_size_kb)
        )
        conn.commit()

        return jsonify({
            'doc_id': cursor.lastrowid,
            'doc_type': doc_type,
            'original_name': secure_filename(file.filename),
            'file_size_kb': file_size_kb,
        }), 200

    except Exception as exc:
        conn.rollback()
        return jsonify({'error': str(exc)}), 400
    finally:
        cursor.close()
        conn.close()


@loan_bp.get('/api/loan/<int:loan_id>/document/<doc_type>')
@jwt_required('user')
def view_loan_document(loan_id, doc_type):
    """Serve a loan document inline (for viewing in new tab)."""
    from flask import send_from_directory

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            'SELECT 1 FROM loan_applications WHERE loan_id = %s AND user_id = %s',
            (loan_id, g.current_user_id)
        )
        if not cursor.fetchone():
            return jsonify({'error': 'Not found'}), 404

        cursor.execute(
            'SELECT stored_name, mime_type FROM loan_documents WHERE loan_id = %s AND doc_type = %s',
            (loan_id, doc_type)
        )
        doc = cursor.fetchone()
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
    finally:
        cursor.close()
        conn.close()

    uploads = _uploads_dir()
    return send_from_directory(uploads, doc['stored_name'], mimetype=doc['mime_type'], as_attachment=False)
