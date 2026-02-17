import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

def handler(event, context):
    """API для голосования — поставить/убрать голос за вопрос или ответ"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    if not isinstance(body, dict):
        body = {}
    user_id = body.get('user_id')
    target_type = body.get('target_type')
    target_id = body.get('target_id')
    value = body.get('value')

    if not user_id or not target_type or not target_id or value not in (1, -1):
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'user_id, target_type, target_id and value (1/-1) required'})}

    if target_type not in ('question', 'answer'):
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'target_type must be question or answer'})}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id, value FROM {schema}.votes WHERE user_id={int(user_id)} AND target_type='{target_type}' AND target_id={int(target_id)}")
    existing = cur.fetchone()

    if existing:
        if existing[1] == value:
            cur.execute(f"UPDATE {schema}.votes SET value = 0 WHERE id = {existing[0]}")
            new_value = 0
        else:
            cur.execute(f"UPDATE {schema}.votes SET value = {value} WHERE id = {existing[0]}")
            new_value = value
    else:
        cur.execute(f"INSERT INTO {schema}.votes (user_id, target_type, target_id, value) VALUES ({int(user_id)}, '{target_type}', {int(target_id)}, {value})")
        new_value = value

    cur.execute(f"SELECT COALESCE(SUM(value), 0) FROM {schema}.votes WHERE target_type='{target_type}' AND target_id={int(target_id)}")
    total = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'user_vote': new_value, 'total_votes': total})
    }