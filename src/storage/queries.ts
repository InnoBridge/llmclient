enum Transaction {
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK'
};

const CREATE_CHATS_TABLE_QUERY = 
    `CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY NOT NULL,
        userId INTEGER,
        title TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
    );`;

const CREATE_MESSAGES_TABLE_QUERY =
    `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY NOT NULL,
        chat_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        role TEXT NOT NULL,
        prompt TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
    );`;

const ADD_CHAT_QUERY = 
    'INSERT INTO chats (title, userId) VALUES (?, ?)';


const GET_CHATS_QUERY = 
    `SELECT c.*, 
                  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as messageCount,
                  (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as lastActivity
            FROM chats c
            ORDER BY lastActivity DESC, c.id DESC`;

const GET_MESSAGES_QUERY =
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC';

const ADD_MESSAGE_QUERY =
    'INSERT INTO messages (chat_id, content, role, imageUrl, prompt) VALUES (?, ?, ?, ?, ?)';

const DELETE_CHAT_QUERY =
    'DELETE FROM chats WHERE id = ?';

const RENAME_CHAT_QUERY =
    'UPDATE chats SET title = ? WHERE id = ?';

const CLEAR_CHAT_QUERY =
    `DELETE FROM chats;
      -- Messages will be deleted automatically via CASCADE constraint`;

const updateTableTimestampQuery = (tableName: string): string => 
    `UPDATE ${tableName} SET updated_at = unixepoch() WHERE id = ?`;

export {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    ADD_CHAT_QUERY,
    GET_CHATS_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    DELETE_CHAT_QUERY,
    RENAME_CHAT_QUERY,
    CLEAR_CHAT_QUERY,
    updateTableTimestampQuery
};