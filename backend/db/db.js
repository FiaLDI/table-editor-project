const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'table_editor',
    password: 'admin',
    port: 5432,
});


// Инициализация структуры базы данных
exports.initDatabase = async () => {
  await pool.query(`
      
        -- Таблица для хранения метаданных о таблицах
        CREATE TABLE IF NOT EXISTS  tables (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL
        );

        -- Пример таблицы для хранения данных таблицы
        CREATE TABLE IF NOT EXISTS  table_data (
            id SERIAL PRIMARY KEY,
            table_id INT REFERENCES tables(id) ON DELETE CASCADE,
            row INT NOT NULL,
            col INT NOT NULL,
            value TEXT
        );

  `);
};

// Получить список таблиц
exports.getTables = async () => {
  const result = await pool.query('SELECT * FROM tables');
  return result.rows;
};

// Получить данные таблицы
exports.getTableData = async (tableId) => {
  const result = await pool.query(`
      SELECT row, col, value
      FROM table_data
      WHERE table_id = $1
  `, [tableId]);

  // Преобразование данных в формат матрицы
  const data = [];
  result.rows.forEach(({ row, col, value }) => {
      if (!data[row]) {
          data[row] = [];
      }
      data[row][col] = value;
  });

  return data;
};

// Сохранить данные в таблицу
exports.saveTableData = async (tableId, data) => {
  await pool.query('DELETE FROM table_data WHERE table_id = $1', [tableId]);
    
  const promises = [];
  data.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
          promises.push(
              pool.query(`
                  INSERT INTO table_data (table_id, row, col, value)
                  VALUES ($1, $2, $3, $4)
              `, [tableId, rowIndex, colIndex, value])
          );
      });
  });
  await Promise.all(promises);
};

// Создать таблицу
exports.createTable = async (name) => {
  const result = await pool.query(`
      INSERT INTO tables (name) VALUES ($1)
      RETURNING id
  `, [name]);
  return result.rows[0].id;
};

// Удалить таблицу
exports.deleteTable = async (name) => {
    const result = await pool.query(`
        DELETE FROM tables WHERE id = $1
    `, [name]);
};