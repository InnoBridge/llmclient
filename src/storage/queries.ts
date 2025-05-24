enum Transaction {
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK'
};

const CREATE_CHATS_TABLE_QUERY = 
    `CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,     
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER DEFAULT NULL
    );`;

const CREATE_MESSAGES_TABLE_QUERY =
    `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        role TEXT NOT NULL,
        prompt TEXT,
        created_at INTEGER NOT NULL,
        is_synced   INTEGER DEFAULT 0,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
    );`;

const GET_CHATS_QUERY = (excludeDeleted: boolean): string => 
    `SELECT c.*, 
            (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as messageCount,
            (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as lastActivity
     FROM chats c
     ${excludeDeleted ? 'WHERE c.deleted_at IS NULL' : ''}
     ORDER BY lastActivity DESC, c.id DESC`;

const COUNT_CHATS_BY_USER_ID_QUERY = (excludeDeleted: boolean): string =>
  `SELECT COUNT(*) as total 
   FROM chats c 
   WHERE c.user_id = ? 
   AND c.updated_at > ? 
   ${excludeDeleted ? 'AND c.deleted_at IS NULL' : ''}`;

const GET_CHATS_BY_USER_ID_QUERY = (excludeDeleted: boolean): string =>
  `SELECT c.*, 
          (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as messageCount,
          (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as lastActivity
   FROM chats c
   WHERE c.user_id = ? 
   AND c.updated_at > ? 
   ${excludeDeleted ? 'AND c.deleted_at IS NULL' : ''}
   ORDER BY lastActivity DESC, c.id DESC
   LIMIT ? OFFSET ?`;

const GET_CHATS_BY_CHAT_IDS_QUERY = (chatIds: string[]): string => {
  const placeholders = chatIds.map(() => '?').join(',');
  return `SELECT c.*, 
          (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as messageCount,
          (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as lastActivity
   FROM chats c
   WHERE c.id IN (${placeholders})`;
};

const ADD_CHAT_QUERY = 
    'INSERT INTO chats (id, user_id, title, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)';
    
const UPSERT_CHATS_QUERY = (chatCount: number): string => {
  const placeholders = Array(chatCount)
    .fill(0)
    .map(() => "(?, ?, ?, ?, ?, ?)")
    .join(",");

  return `INSERT INTO chats (id, user_id, title, created_at, updated_at, deleted_at)
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    title = EXCLUDED.title,
    updated_at = EXCLUDED.updated_at, 
    deleted_at = EXCLUDED.deleted_at`;
};

const GET_MESSAGES_QUERY =
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC';

const GET_AND_MARK_UNSYNCED_MESSAGES_BY_USER_ID_QUERY = 
    `UPDATE messages 
     SET is_synced = 1 
     WHERE id IN (
        SELECT m.id 
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE c.user_id = ? 
        AND m.is_synced = 0
        ORDER BY m.created_at DESC
        LIMIT ?
     ) 
     RETURNING id, chat_id, content, role, imageUrl, prompt, created_at, is_synced;`;

const ADD_MESSAGE_QUERY =
    'INSERT INTO messages (id, chat_id, content, role, imageUrl, prompt, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

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

const MARK_CHAT_AS_DELETED_QUERY = 
    'UPDATE chats SET deleted_at = ?, updated_at = ? WHERE id = ?';

const DELETE_MESSAGES_BY_CHAT_ID_QUERY = 
    'DELETE FROM messages WHERE chat_id = ?';

const CLEAR_DELETED_CHATS_QUERY =
    `DELETE FROM chats WHERE deleted_at IS NOT NULL;`;

const RENAME_CHAT_QUERY =
    'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?';

const CLEAR_CHAT_QUERY =
    `DELETE FROM chats;
      -- Messages will be deleted automatically via CASCADE constraint`;

const CLEAR_MESSAGE_QUERY =
    `DELETE FROM messages;
      -- Chats will be deleted automatically via CASCADE constraint`;

const UPDATE_TABLE_TIMESTAMP_QUERY = (tableName: string): string => 
    `UPDATE ${tableName} SET updated_at = ? WHERE id = ?`;

export {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    GET_CHATS_QUERY,
    COUNT_CHATS_BY_USER_ID_QUERY,
    GET_CHATS_BY_USER_ID_QUERY,
    GET_CHATS_BY_CHAT_IDS_QUERY,
    ADD_CHAT_QUERY,
    UPSERT_CHATS_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    UPSERT_MESSAGES_QUERY,
    DELETE_CHAT_QUERY,
    MARK_CHAT_AS_DELETED_QUERY,
    DELETE_MESSAGES_BY_CHAT_ID_QUERY,
    CLEAR_DELETED_CHATS_QUERY,
    RENAME_CHAT_QUERY,
    GET_AND_MARK_UNSYNCED_MESSAGES_BY_USER_ID_QUERY,
    CLEAR_CHAT_QUERY,
    CLEAR_MESSAGE_QUERY,
    UPDATE_TABLE_TIMESTAMP_QUERY
};