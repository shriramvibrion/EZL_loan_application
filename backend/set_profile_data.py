from database.db import get_db_connection

user_id = 2
user_vals = {
    'first_name': 'SHRIRAM',
    'last_name': 'A',
    'email': 'shriramvibrion7@gmail.com',
    'phone_number': '7550207665',
    'address': '123 Anna Nagar, Chennai',
    'gender': 'Male',
    'last_login_at': '2026-06-08 16:45:48',
    'sms_notifications': 1,
    'email_notifications': 1,
}

profile_vals = {
    'first_name': 'SHRIRAM',
    'last_name': 'A',
    'phone_number': '7550207665',
    'email': 'shriramvibrion7@gmail.com',
    'address': '123 Anna Nagar, Chennai',
    'gender': 'Male',
    'aadhaar_last4': '9012',
    'aadhaar_status': 'pending',
    'pan_last4': '234F',
    'pan_status': 'pending',
    'completion_percent': 100,
}

conn = get_db_connection()
try:
    cur = conn.cursor()
    # update users
    cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    if cur.fetchone():
        cur.execute(
            "UPDATE users SET first_name=%s, last_name=%s, email=%s, phone_number=%s, address=%s, gender=%s, last_login_at=%s, sms_notifications=%s, email_notifications=%s WHERE user_id=%s",
            (user_vals['first_name'], user_vals['last_name'], user_vals['email'], user_vals['phone_number'], user_vals['address'], user_vals['gender'], user_vals['last_login_at'], user_vals['sms_notifications'], user_vals['email_notifications'], user_id)
        )
        print('Updated users')
    else:
        # insert a minimal user row with encoded password placeholder
        cur.execute(
            "INSERT INTO users (user_id, first_name, last_name, email, phone_number, password, address, gender, last_login_at, sms_notifications, email_notifications) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, user_vals['first_name'], user_vals['last_name'], user_vals['email'], user_vals['phone_number'], 'password', user_vals['address'], user_vals['gender'], user_vals['last_login_at'], user_vals['sms_notifications'], user_vals['email_notifications'])
        )
        print('Inserted users')

    # ensure profile row exists
    cur.execute("SELECT profile_id FROM profile WHERE user_id = %s", (user_id,))
    if cur.fetchone():
        cur.execute(
            "UPDATE profile SET first_name=%s, last_name=%s, phone_number=%s, email=%s, address=%s, gender=%s, aadhaar_last4=%s, aadhaar_status=%s, pan_last4=%s, pan_status=%s, completion_percent=%s WHERE user_id=%s",
            (profile_vals['first_name'], profile_vals['last_name'], profile_vals['phone_number'], profile_vals['email'], profile_vals['address'], profile_vals['gender'], profile_vals['aadhaar_last4'], profile_vals['aadhaar_status'], profile_vals['pan_last4'], profile_vals['pan_status'], profile_vals['completion_percent'], user_id)
        )
        print('Updated profile')
    else:
        cur.execute(
            "INSERT INTO profile (user_id, first_name, last_name, phone_number, email, address, gender, aadhaar_last4, aadhaar_status, pan_last4, pan_status, completion_percent) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, profile_vals['first_name'], profile_vals['last_name'], profile_vals['phone_number'], profile_vals['email'], profile_vals['address'], profile_vals['gender'], profile_vals['aadhaar_last4'], profile_vals['aadhaar_status'], profile_vals['pan_last4'], profile_vals['pan_status'], profile_vals['completion_percent'])
        )
        print('Inserted profile')

    conn.commit()
finally:
    try:
        cur.close()
    except Exception:
        pass
    conn.close()

print('Done')
