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

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event, context):
    """API для вопросов — получение списка, создание нового вопроса"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = get_schema()

    if method == 'GET':
        return get_questions(event, schema)
    elif method == 'POST':
        return create_question(event, schema)

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

def get_questions(event, schema):
    params = event.get('queryStringParameters') or {}
    sort = params.get('sort', 'votes')
    question_id = params.get('id', '')
    user_id = params.get('user_id', '')

    conn = get_conn()
    cur = conn.cursor()

    if question_id:
        cur.execute(f"""
            SELECT q.id, q.title, q.body, q.tags, q.created_at,
                   u.id, u.name, u.avatar,
                   COALESCE((SELECT SUM(v.value) FROM {schema}.votes v WHERE v.target_type='question' AND v.target_id=q.id), 0) as vote_count
            FROM {schema}.questions q
            JOIN {schema}.users u ON q.author_id = u.id
            WHERE q.id = {int(question_id)}
        """)
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

        user_vote = 0
        if user_id:
            cur.execute(f"SELECT value FROM {schema}.votes WHERE user_id={int(user_id)} AND target_type='question' AND target_id={int(question_id)}")
            vr = cur.fetchone()
            if vr:
                user_vote = vr[0]

        cur.execute(f"""
            SELECT a.id, a.body, a.created_at,
                   u.id, u.name, u.avatar,
                   COALESCE((SELECT SUM(v.value) FROM {schema}.votes v WHERE v.target_type='answer' AND v.target_id=a.id), 0) as vote_count
            FROM {schema}.answers a
            JOIN {schema}.users u ON a.author_id = u.id
            WHERE a.question_id = {int(question_id)}
            ORDER BY vote_count DESC, a.created_at ASC
        """)
        answers_rows = cur.fetchall()

        answers = []
        for ar in answers_rows:
            a_vote = 0
            if user_id:
                cur.execute(f"SELECT value FROM {schema}.votes WHERE user_id={int(user_id)} AND target_type='answer' AND target_id={ar[0]}")
                avr = cur.fetchone()
                if avr:
                    a_vote = avr[0]
            answers.append({
                'id': ar[0],
                'body': ar[1],
                'created_at': ar[2].isoformat(),
                'author': {'id': ar[3], 'name': ar[4], 'avatar': ar[5]},
                'votes': ar[6],
                'user_vote': a_vote
            })

        question = {
            'id': row[0],
            'title': row[1],
            'body': row[2],
            'tags': row[3] if row[3] else [],
            'created_at': row[4].isoformat(),
            'author': {'id': row[5], 'name': row[6], 'avatar': row[7]},
            'votes': row[8],
            'user_vote': user_vote,
            'answers': answers
        }
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'question': question})}

    order = "vote_count DESC" if sort == "votes" else "q.created_at DESC"
    cur.execute(f"""
        SELECT q.id, q.title, q.body, q.tags, q.created_at,
               u.id, u.name, u.avatar,
               COALESCE((SELECT SUM(v.value) FROM {schema}.votes v WHERE v.target_type='question' AND v.target_id=q.id), 0) as vote_count,
               (SELECT COUNT(*) FROM {schema}.answers a WHERE a.question_id = q.id) as answer_count
        FROM {schema}.questions q
        JOIN {schema}.users u ON q.author_id = u.id
        ORDER BY {order}
        LIMIT 50
    """)
    rows = cur.fetchall()

    questions = []
    for r in rows:
        q_vote = 0
        if user_id:
            cur.execute(f"SELECT value FROM {schema}.votes WHERE user_id={int(user_id)} AND target_type='question' AND target_id={r[0]}")
            vr = cur.fetchone()
            if vr:
                q_vote = vr[0]
        questions.append({
            'id': r[0],
            'title': r[1],
            'body': r[2],
            'tags': r[3] if r[3] else [],
            'created_at': r[4].isoformat(),
            'author': {'id': r[5], 'name': r[6], 'avatar': r[7]},
            'votes': r[8],
            'answer_count': r[9],
            'user_vote': q_vote
        })

    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'questions': questions})}

def parse_body(event):
    raw = event.get('body') or '{}'
    data = json.loads(raw) if isinstance(raw, str) else raw
    return data if isinstance(data, dict) else {}

def create_question(event, schema):
    body = parse_body(event)
    user_id = body.get('user_id')
    title = body.get('title', '').strip()
    text = body.get('body', '').strip()
    tags = body.get('tags', [])

    if not user_id or not title:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'user_id and title required'})}

    safe_title = title.replace("'", "''")
    safe_text = text.replace("'", "''")
    tags_str = "ARRAY[" + ",".join([f"'{t.replace(chr(39), chr(39)+chr(39))}'" for t in tags]) + "]::text[]" if tags else "'{}'::text[]"

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"INSERT INTO {schema}.questions (author_id, title, body, tags) VALUES ({int(user_id)}, '{safe_title}', '{safe_text}', {tags_str}) RETURNING id, created_at")
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': row[0], 'created_at': row[1].isoformat()})}