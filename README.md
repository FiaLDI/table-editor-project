# Table Editor

## Описание
Веб-приложение для редактирования таблицы с поддержкой формул.

## Установка

### Backend
1. Установите зависимости:
    ```bash
    cd backend
    npm install
    ```
2. Запустите PostgreSQL и создайте базу данных:
    ```bash
    createdb table_editor
    ```
3. Выполните скрипт `schema.sql`:
    ```bash
    psql -d table_editor -f db/schema.sql
    ```
4. Запустите сервер:
    ```bash
    node app.js
    ```

### Frontend
1. Установите зависимости:
    ```bash
    cd frontend
    npm install
    ```
2. Запустите React-приложение:
    ```bash
    npm start
    ```

## Использование
1. Запустите `backend` и `frontend`.
2. Перейдите по адресу `http://localhost:3000`.
3. Редактируйте таблицу, вводите формулы, сохраняйте изменения.
