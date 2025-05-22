enum Transaction {
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK'
};

const CREATE_CHATS_TABLE_QUERY = 
    `CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY NOT NULL,
        userId INTEGER,
        title TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        deleted_at  INTEGER DEFAULT NULL
    );`;

const CREATE_MESSAGES_TABLE_QUERY =
    `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        role TEXT NOT NULL,
        prompt TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        is_synced   INTEGER DEFAULT 0,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
    );`;

const ADD_CHAT_QUERY = 
    'INSERT INTO chats (id, userId, title, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)';

const UPSERT_CHATS_QUERY = (chatCount: number): string => {
  const placeholders = Array(chatCount)
    .fill(0)
    .map(() => "(?, ?, ?, ?, ?, ?)")
    .join(",");

  return `INSERT INTO chats (id, userId, title, created_at, updated_at, deleted_at)
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
    userId = EXCLUDED.userId,
    title = EXCLUDED.title,
    updated_at = EXCLUDED.updated_at, 
    deleted_at = EXCLUDED.deleted_at`;
};

const GET_CHATS_QUERY = 
    `SELECT c.*, 
                  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as messageCount,
                  (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as lastActivity
            FROM chats c
            ORDER BY lastActivity DESC, c.id DESC`;

const GET_MESSAGES_QUERY =
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC';

const ADD_MESSAGE_QUERY =
    'INSERT INTO messages (id, chat_id, content, role, imageUrl, prompt) VALUES (?, ?, ?, ?, ?, ?)';

const UPSERT_MESSAGES_QUERY = (messageCount: number): string => {
  const placeholders = Array(messageCount)
    .fill(0)
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
    .join(",");

  return `INSERT INTO messages (id, chat_id, content, role, imageUrl, prompt, created_at, is_synced)
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    role = EXCLUDED.role,
    imageUrl = EXCLUDED.imageUrl,
    prompt = EXCLUDED.prompt,
    is_synced = EXCLUDED.is_synced`;
};

const DELETE_CHAT_QUERY =
    'DELETE FROM chats WHERE id = ?';

const RENAME_CHAT_QUERY =
    'UPDATE chats SET title = ? WHERE id = ?';

const CLEAR_CHAT_QUERY =
    `DELETE FROM chats;
      -- Messages will be deleted automatically via CASCADE constraint`;

const CLEAR_MESSAGE_QUERY =
    `DELETE FROM messages;
      -- Chats will be deleted automatically via CASCADE constraint`;

const updateTableTimestampQuery = (tableName: string): string => 
    `UPDATE ${tableName} SET updated_at = unixepoch() WHERE id = ?`;

export {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    GET_CHATS_QUERY,
    ADD_CHAT_QUERY,
    UPSERT_CHATS_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    UPSERT_MESSAGES_QUERY,
    DELETE_CHAT_QUERY,
    RENAME_CHAT_QUERY,
    CLEAR_CHAT_QUERY,
    CLEAR_MESSAGE_QUERY,
    updateTableTimestampQuery
};