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
    """API для ответов — создание ответа на вопрос"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    if not isinstance(body, dict):
        body = {}
    user_id = body.get('user_id')
    question_id = body.get('question_id')
    text = body.get('body', '').strip()

    if not user_id or not question_id or not text:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'user_id, question_id and body required'})}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    safe_text = text.replace("'", "''")

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {schema}.questions WHERE id = {int(question_id)}")
    if not cur.fetchone():
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Question not found'})}

    cur.execute(f"INSERT INTO {schema}.answers (question_id, author_id, body) VALUES ({int(question_id)}, {int(user_id)}, '{safe_text}') RETURNING id, created_at")
    row = cur.fetchone()
    conn.commit()

    cur.execute(f"SELECT name, avatar FROM {schema}.users WHERE id = {int(user_id)}")
    user_row = cur.fetchone()

    cur.close()
    conn.close()

    return {
        'statusCode': 201,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'answer': {
                'id': row[0],
                'body': text,
                'created_at': row[1].isoformat(),
                'author': {'id': user_id, 'name': user_row[0], 'avatar': user_row[1]},
                'votes': 0,
                'user_vote': 0
            }
        })
    }