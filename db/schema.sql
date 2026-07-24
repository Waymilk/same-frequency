CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  host_answers TEXT NOT NULL,
  host_scores TEXT NOT NULL,
  host_mbti TEXT,
  question_ids TEXT,
  guest_answers TEXT,
  guest_scores TEXT,
  guest_mbti TEXT,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  completed_at BIGINT
);

CREATE INDEX IF NOT EXISTS rooms_expires_at_idx ON rooms (expires_at);
