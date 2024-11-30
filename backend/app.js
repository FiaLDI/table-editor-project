const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db/db'); // Подключение модуля для работы с PostgreSQL
const { Pool } = require('pg');
const math = require('mathjs'); // Подключение mathjs для вычислений

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'table_editor',
  password: 'admin',
  port: 5432,
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Проверка таблиц при запуске
(async () => {
  try {
    await db.initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Функция проверки и обработки формулы
const isFormula = (value) => typeof value === 'string' && value.startsWith('=');

// Новая функция для вычисления формул с поддержкой ссылок
const evaluateFormula = (formula, tableData) => {
  let cleanedFormula = formula.substring(1); // Убираем '=' в начале

  // Используем регулярное выражение для нахождения всех ячеек, например "A1", "B2"
  const regex = /([A-Z]+)(\d+)/g;
  let match;

  // Заменяем ячейки типа "A1" на соответствующие значения
  while ((match = regex.exec(cleanedFormula)) !== null) {
    const col = match[1]; // Буква колонки, например "A"
    const row = parseInt(match[2], 10) - 1; // Номер строки, например "1" => 0 (нумерация с 0)

    const colIndex = col.charCodeAt(0) - 65; // Преобразуем букву в индекс (A -> 0, B -> 1, C -> 2)
    let cellValue = tableData[row] && tableData[row][colIndex];

    // Если значение ячейки пустое, считаем его 0 для вычислений
    console.log(cellValue)
    if (cellValue === undefined || cellValue === null) {
      cellValue = 0;
    }

    // Заменяем ячейку на её значение
    cleanedFormula = cleanedFormula.replace(match[0], cellValue);
  }

  try {
    // Вычисляем формулу
    return math.evaluate(cleanedFormula);
  } catch (err) {
    throw new Error(`Error evaluating formula: ${err.message}`);
  }
};

// Endpoint для получения данных таблицы с вычисленными значениями
app.post('/api/apply-formulas', (req, res) => {
  const { data } = req.body;

  try {
    // Применяем формулы ко всем ячейкам
    const updatedData = data.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        // Если ячейка содержит формулу
        if (typeof cell === 'string' && cell.startsWith('=')) {
          try {
            // Вычисляем результат формулы
            return evaluateFormula(cell, data);
          } catch (err) {
            console.error(`Error evaluating formula: ${err.message}`);
            return 'ERROR'; // Если ошибка в вычислении формулы, возвращаем "ERROR"
          }
        }
        // Если ячейка не содержит формулы, оставляем её без изменений
        return cell;
      })
    );

    res.json(updatedData);
  } catch (err) {
    console.error('Error applying formulas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint для получения данных таблицы с вычисленными значениями
app.post('/api/not-apply-formulas', async (req, res) => {
  const { id, show, data } = req.body.data;
  try {
    // Применяем формулы ко всем ячейкам
    const result = await pool.query(
      `
      SELECT row, col, value
      FROM table_data
      WHERE table_id = $1
    `,
      [id]
    );

    // Преобразуем в формат Handsontable (массив массивов)
    const dataa = data;
    const context = {}; // Контекст для сохранения переменных и значений

    result.rows.forEach(({ row, col, value }) => {
      // Если ячейка содержит формулу, вычисляем её значение
      if (isFormula(value) && show) {
        
        const evaluatedValue = value;
        dataa[row][col] = evaluatedValue;
        const cellKey = `R${row}C${col}`;
        context[cellKey] = evaluatedValue; // Сохраняем вычисленное значение в контекст
      }
    });
    res.json(dataa);
  } catch (err) {
    console.error('Error applying formulas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Получить список таблиц
app.get('/tables', async (req, res) => {
  try {
    const tables = await db.getTables();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Получить данные конкретной таблицы
app.get('/table/:id', async (req, res) => {
  const tableId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `
      SELECT row, col, value
      FROM table_data
      WHERE table_id = $1
    `,
      [tableId]
    );

    // Преобразуем в формат Handsontable (массив массивов)
    const data = [];
    const context = {}; // Контекст для сохранения переменных и значений

    result.rows.forEach(({ row, col, value }) => {
      if (!data[row]) {
        data[row] = [];
      }

      // Если ячейка содержит формулу, вычисляем её значение
      if (isFormula(value)) {
        const evaluatedValue = evaluateFormula(value, data);
        data[row][col] = evaluatedValue;
        const cellKey = `R${row}C${col}`;
        context[cellKey] = evaluatedValue; // Сохраняем вычисленное значение в контекст
      } else {
        // Пустые ячейки считаются как 0 для вычислений, но не заменяются в данных
        data[row][col] = value === null || value === undefined ? '' : value;
        const cellKey = `R${row}C${col}`;
        context[cellKey] = data[row][col]; // Сохраняем значение в контекст
      }
    });

    res.json(data);
  } catch (error) {
    console.error(`Error fetching data for table ${tableId}:`, error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  }
});

/// Сохранить данные таблицы
app.post('/table/:id', async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  const { data } = req.body;

  try {
    await pool.query('DELETE FROM table_data WHERE table_id = $1', [tableId]); // Удаляем старые данные

    const insertPromises = [];
    data.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        // Сохраняем данные в таблице, при этом пустые ячейки остаются пустыми
        insertPromises.push(
          pool.query(
            'INSERT INTO table_data (table_id, row, col, value) VALUES ($1, $2, $3, $4)',
            [tableId, rowIndex, colIndex, value || null] // Пустые ячейки сохраняем как null
          )
        );
      });
    });

    await Promise.all(insertPromises);
    res.sendStatus(200);
  } catch (error) {
    console.error(`Error saving data for table ${tableId}:`, error);
    res.status(500).json({ error: 'Failed to save table data' });
  }
});


// Создать новую таблицу
app.post('/tables', async (req, res) => {
  let { name, col, row } = req.body;
  
  col = Number(col)
  row = Number(row)
  
  if (!name) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  const columns = Number.isInteger(col) && col > 0 ? col : 10; // Используем 10, если col не задан или не положительное число
  const rows = Number.isInteger(row) && row > 0 ? row : 10;     // Используем 10, если row не задан или не положительное число

  try {
    const tableId = await db.createTable(name);

    // Генерация пустых данных (все ячейки пустые, не заменяются на 0)
    const defaultData = Array.from({ length: rows }, () => Array(columns).fill(null));
    await db.saveTableData(tableId, defaultData);

    res.status(201).json({ id: tableId, name, data: defaultData });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

app.post('/tablesdel', async (req, res) => {
  let { name} = req.body;
   
  if (!name) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    
    await db.deleteTable(name)

    res.sendStatus(200);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
