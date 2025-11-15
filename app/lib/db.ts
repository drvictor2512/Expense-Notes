import * as SQLite from 'expo-sqlite'

let db: any = null
export async function initDB(): Promise<void> {
    if (!db) {
        if ((SQLite as any).openDatabaseAsync) {
            db = await (SQLite as any).openDatabaseAsync(' expenses.db')
        } else if ((SQLite as any).openDatabase) {
            db = (SQLite as any).openDatabase(' expenses.db')
        } else {
            throw new Error('expo-sqlite: no openDatabaseAsync/openDatabase available on this platform')
        }
    }

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS  expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            paid INTEGER DEFAULT 1,
            created_at INTEGER
        );
    `)

}