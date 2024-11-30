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