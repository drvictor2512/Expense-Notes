import * as SQLite from 'expo-sqlite'

let db: any = null

async function seedSampleData(): Promise<void> {
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM expenses')
    const count = result[0]?.count || 0

    if (count === 0) {
        const now = Date.now()
        await db.runAsync(
            'INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)',
            ['Cà phê', 30000, 'Ăn uống', 1, now]
        )
        await db.runAsync(
            'INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)',
            ['Ăn trưa', 50000, 'Ăn uống', 1, now]
        )
        await db.runAsync(
            'INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)',
            ['Xăng xe', 100000, 'Di chuyển', 1, now]
        )
        console.log('Đã seed 3 khoản chi tiêu mẫu')
    }
}

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

    console.log('Bảng expenses đã sẵn sàng')
    await seedSampleData()
}

export async function getAllExpenses(): Promise<any[]> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    return await db.getAllAsync('SELECT * FROM expenses ORDER BY created_at DESC')
}

export async function addExpense(title: string, amount: number, category?: string): Promise<void> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    const now = Date.now()
    await db.runAsync(
        'INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)',
        [title, amount, category || '', 1, now]
    )
}

export async function togglePaidStatus(id: number, currentPaid: number): Promise<void> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    const newPaid = currentPaid === 1 ? 0 : 1
    await db.runAsync('UPDATE expenses SET paid = ? WHERE id = ?', [newPaid, id])
}

export async function updateExpense(id: number, title: string, amount: number, category?: string): Promise<void> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    await db.runAsync(
        'UPDATE expenses SET title = ?, amount = ?, category = ? WHERE id = ?',
        [title, amount, category || '', id]
    )
}

export async function deleteExpense(id: number): Promise<void> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id])
}