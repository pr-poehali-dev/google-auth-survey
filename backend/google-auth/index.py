import json
import os
import urllib.request
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

def handler(event, context):
    """Авторизация через Google OAuth — проверяет токен и создаёт/возвращает пользователя"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    token = body.get('token', '') if isinstance(body, dict) else ''

    if not token:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Token required'})}

    google_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={token}'
    try:
        req = urllib.request.Request(google_url)
        with urllib.request.urlopen(req) as resp:
            google_data = json.loads(resp.read().decode())
    except Exception:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid token'})}

    client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    if google_data.get('aud') != client_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Token audience mismatch'})}

    google_id = google_data.get('sub', '')
    email = google_data.get('email', '')
    name = google_data.get('name', '')
    avatar = google_data.get('picture', '')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, google_id, name, email, avatar FROM {schema}.users WHERE google_id = '{google_id}'"
    )
    row = cur.fetchone()

    if row:
        user_id = row[0]
        cur.execute(
            f"UPDATE {schema}.users SET name = '{name.replace(chr(39), chr(39)+chr(39))}', avatar = '{avatar.replace(chr(39), chr(39)+chr(39))}' WHERE id = {user_id}"
        )
    else:
        cur.execute(
            f"INSERT INTO {schema}.users (google_id, name, email, avatar) VALUES ('{google_id}', '{name.replace(chr(39), chr(39)+chr(39))}', '{email.replace(chr(39), chr(39)+chr(39))}', '{avatar.replace(chr(39), chr(39)+chr(39))}') RETURNING id"
        )
        user_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'user': {
                'id': user_id,
                'google_id': google_id,
                'name': name,
                'email': email,
                'avatar': avatar
            }
        })
    }