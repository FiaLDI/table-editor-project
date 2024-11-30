import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { FaRegEye, FaRegEyeSlash, FaSave, FaPlay, FaDropbox, FaBurn } from 'react-icons/fa'; // Для иконок


const TableEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newCol, setCol] = useState('');
  const [newRow, setRow] = useState('');
  const [showFormulas, setShowFormulas] = useState(false); // Состояние для отображения формул

  const hotTableRef = useRef(null);

  // Fetch list of tables
  useEffect(() => {
    fetch('http://localhost:3001/tables')
      .then((res) => res.json())
      .then(setTables)
      .catch(console.error);
  }, []);

  // Fetch data for selected table
  useEffect(() => {
    if (selectedTableId) {
      fetch(`http://localhost:3001/table/${selectedTableId}`)
        .then((res) => res.json())
        .then((data) => {
          setShowFormulas(true); // После получения данных показываем формулы
          setTableData(data);
        })
        .catch(console.error);
    }
  }, [selectedTableId]);

  const saveTableData = () => {
    if (selectedTableId && hotTableRef.current) {
      const data = hotTableRef.current.hotInstance.getData();
      fetch(`http://localhost:3001/table/${selectedTableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to save table data');
          }
        })
        .catch(console.error);
    } else {
      console.error('Unable to save: No table selected or Handsontable not initialized.');
    }
  };

  const createTable = () => {
    if (!newTableName.trim()) return;
    

    fetch('http://localhost:3001/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTableName, col: newCol || 10, row: newRow || 10}),
    })
      .then((res) => res.json())
      .then((newTable) => {
        setTables((prev) => [...prev, newTable]);
        setNewTableName('');
        setCol('')
        setRow('')
      })
      .catch(console.error);
  };

  const deleteTable = (id) => {
    
    fetch('http://localhost:3001/tablesdel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: id}),
    })
      .then((res) => res.json())
      .then(() => {
        setTables((prev) => [...prev]);
        setNewTableName('');
        setCol('')
        setRow('')
        setSelectedTableId(null)
      })
      .catch(console.error);
  };

  // Функция для применения формул
  const applyFormulas = () => {
    if (hotTableRef.current) {
      const data = hotTableRef.current.hotInstance.getData();
      
      // Отправляем данные на сервер для применения формул
      fetch('http://localhost:3001/api/apply-formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }), // Отправляем данные таблицы
      })
        .then((response) => response.json())
        .then((updatedData) => {
          setShowFormulas(true);
          setTableData(updatedData); // Обновляем таблицу с результатами формул
        })
        .catch((err) => {
          console.error('Error applying formulas:', err);
        });
    }
  };

  // Функция для показа формул
  const toggleShowFormulas = () => {
    if (hotTableRef.current) {
      const dataa = hotTableRef.current.hotInstance.getData();
      const data = {
        id: selectedTableId,
        show: showFormulas,
        data: dataa,
      };
      
      fetch(`http://localhost:3001/api/not-apply-formulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }), // Отправляем данные таблицы
      })
        .then((response) => response.json())
        .then((updatedData) => {
          setShowFormulas((prev) => !prev); // Переключаем состояние отображения формул
          setTableData(updatedData); // Обновляем таблицу
        })
        .catch((err) => {
          console.error('Error applying formulas:', err);
        });
    }
  };

  const processedData = tableData.map((row) =>
    row.map((cell) => {
      if (showFormulas && typeof cell === 'string' && cell.startsWith('=')) {
        return cell; // Показываем формулу
      }
      return cell; // Показываем вычисленное значение или другие данные
    })
  );

  return (
    <div>
      <h1 className='Tittle'>Редактор таблиц</h1>
      <div className='container'>
      <div>
        <input
          type="text"
          placeholder="Название таблицы"
          required=''
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Количество строк"
          required=''
          value={newRow}
          onChange={(e) => setRow(e.target.value)}
        />
        <input
          type="number"
          placeholder="Количество столбцов"
          required=''
          value={newCol}
          onChange={(e) => setCol(e.target.value)}
        />
        <button onClick={createTable}>Создать таблицу</button>
      </div>
      <h2>Доступные таблицы</h2>
      <ul>
        {tables.map((table) => (
          <li key={table.id}>
            <button
              onClick={() => setSelectedTableId(table.id)}
              style={{ fontWeight: selectedTableId === table.id ? 'bold' : 'normal' }}
            >
              {table.name}
            </button>
            <button
              onClick={() => deleteTable(table.id)}
            ><FaDropbox />
              Удалить
            </button>
          </li>
        ))}
      </ul>
      
      {selectedTableId && (
        <div>
          <div className='Buttons'>
            <button onClick={saveTableData}><FaSave /> Save Table</button>
            <button onClick={applyFormulas}><FaPlay /> Apply Formulas</button> {/* Кнопка применения формул */}
            <button onClick={toggleShowFormulas}>
              {showFormulas ? <><FaRegEyeSlash /> Hide Formulas</> : <><FaRegEye /> Show Formulas</>}
            </button> {/* Кнопка для показа/скрытия формул */}
          </div>
          
          <h2>Table {selectedTableId}</h2>
          <HotTable
            ref={hotTableRef}
            data={processedData}
            colHeaders
            rowHeaders
            width="100%"
            height="500px"
            licenseKey="non-commercial-and-evaluation"
          />
          
        </div>
      )}
    </div>
    </div>
  );
};

export default TableEditor;
