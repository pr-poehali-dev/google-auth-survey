
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL CHECK (target_type IN ('question', 'answer')),
    target_id INTEGER NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
