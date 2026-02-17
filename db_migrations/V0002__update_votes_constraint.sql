
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_value_check;
ALTER TABLE votes ADD CONSTRAINT votes_value_check CHECK (value IN (-1, 0, 1));
