import pool from "../config/database.js";

// Ensure the settings table exists (safe to run repeatedly)
const ensureSettingsTable = async () => {
  const createSql =
    `
    CREATE TABLE IF NOT EXISTS settings (
      ` +
    "`key`" +
    ` VARCHAR(100) PRIMARY KEY,
      value JSON NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.execute(createSql);
};

// Key-value settings storage (value stored as JSON)
export const getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    // Make sure the table exists (helps in dev environments where migrate wasn't run)
    await ensureSettingsTable();
    const [rows] = await pool.execute(
      "SELECT value FROM settings WHERE `key` = ?",
      [key]
    );

    if (!rows || rows.length === 0) {
      // return empty object when no setting exists
      return res.json({ value: {} });
    }

    // value is stored as JSON in MySQL; depending on driver it may come back as string
    const value = rows[0].value;
    res.json({ value });
  } catch (error) {
    next(error);
  }
};

export const setSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    // ensure table exists before attempting insert/update
    await ensureSettingsTable();
    // allow client to send either { value: {...} } or raw value
    const payload =
      req.body && req.body.value !== undefined ? req.body.value : req.body;

    // store as JSON string
    const jsonString = JSON.stringify(payload || {});

    await pool.execute(
      `INSERT INTO settings (\`key\`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = CURRENT_TIMESTAMP`,
      [key, jsonString]
    );

    res.json({ value: payload });
  } catch (error) {
    next(error);
  }
};
