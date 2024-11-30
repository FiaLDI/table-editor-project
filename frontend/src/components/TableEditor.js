import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { FaRegEye, FaRegEyeSlash, FaSave, FaDropbox } from 'react-icons/fa';

const TableEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newCol, setCol] = useState('');
  const [newRow, setRow] = useState('');
  const [showFormulas, setShowFormulas] = useState(false);

  const hotTableRef = useRef(null);

  // Fetch the list of tables
  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:3001/tables');
      const data = await response.json();
      setTables(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch data for the selected table
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/table/${selectedTableId}`);
        const data = await response.json();
        setShowFormulas(true);
        setTableData(data);
      } catch (err) {
        console.error('Error fetching table data:', err);
      }
    };

    if (selectedTableId) {
      fetchTableData();
    }
  }, [selectedTableId]);

  const saveTableData = async () => {
    if (!selectedTableId || !hotTableRef.current) {
      console.error('Unable to save: No table selected or Handsontable not initialized.');
      return;
    }

    try {
      const data = hotTableRef.current.hotInstance.getData();
      const response = await fetch(`http://localhost:3001/table/${selectedTableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('Failed to save table data');
    } catch (err) {
      console.error('Error saving table data:', err);
    }
  };

  const createTable = async () => {
    if (!newTableName.trim()) return;

    try {
      const response = await fetch('http://localhost:3001/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName, col: newCol || 10, row: newRow || 10 }),
      });
      const newTable = await response.json();
      await fetchTables(); // Refresh table list
      setNewTableName('');
      setCol('');
      setRow('');
    } catch (err) {
      console.error('Error creating table:', err);
    }
  };

  const deleteTable = async (id) => {
    try {
      const response = await fetch('http://localhost:3001/tablesdel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: id }),
      });
      if (!response.ok) throw new Error('Failed to delete table');
      await fetchTables(); // Refresh table list after deletion
      if (selectedTableId === id) {
        setSelectedTableId(null); // Close the table if it was active
        setTableData([]); // Clear the table data
      }
    } catch (err) {
      console.error('Error deleting table:', err);
    }
  };

  const applyFormulas = async (changedData) => {
    // Function to apply formulas to the data
    if (hotTableRef.current) {
      try {
        const data = hotTableRef.current.hotInstance.getData();
        const response = await fetch('http://localhost:3001/api/apply-formulas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, changedData }),
        });
        const updatedData = await response.json();
        setShowFormulas(true);
        setTableData(updatedData);
      } catch (err) {
        console.error('Error applying formulas:', err);
      }
    }
  };

  const toggleShowFormulas = async () => {
    if (hotTableRef.current) {
      try {
        const data = hotTableRef.current.hotInstance.getData();
        const payload = {
          id: selectedTableId,
          show: !showFormulas,
          data,
        };

        const response = await fetch('http://localhost:3001/api/not-apply-formulas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updatedData = await response.json();
        setShowFormulas((prev) => !prev);
        setTableData(updatedData);
      } catch (err) {
        console.error('Error toggling formulas:', err);
      }
    }
  };

  const processedData = tableData.map((row) =>
    row.map((cell) => (showFormulas && typeof cell === 'string' && cell.startsWith('=') ? cell : cell))
  );

  // This event will be triggered every time a change is made in the table
  const handleAfterChange = (changes) => {
    if (changes) {
      // Automatically apply formulas after change
      const [row, col, oldValue, newValue] = changes[0]; // Get the changed cell's info
      const changedData = { row, col, oldValue, newValue };
      applyFormulas(changedData); // Pass changed data for formula recalculation
    }
  };

  return (
    <div>
      <h1 className="Tittle">Редактор таблиц</h1>
      <div className="container">
        <div>
          <input
            type="text"
            placeholder="Название таблицы"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Количество строк"
            value={newRow}
            onChange={(e) => setRow(e.target.value)}
          />
          <input
            type="number"
            placeholder="Количество столбцов"
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
              <button onClick={() => deleteTable(table.id)}>
                <FaDropbox /> Удалить
              </button>
            </li>
          ))}
        </ul>
        {selectedTableId && (
          <div>
            <div className="Buttons">
              <button onClick={saveTableData}>
                <FaSave /> Сохранить таблицу
              </button>
              <button onClick={toggleShowFormulas}>
                {showFormulas ? (
                  <>
                    <FaRegEyeSlash /> Скрыть формулы
                  </>
                ) : (
                  <>
                    <FaRegEye /> Показать формулы
                  </>
                )}
              </button>
            </div>
            <h2>Таблица {selectedTableId}</h2>
            <HotTable
              ref={hotTableRef}
              data={processedData}
              colHeaders
              rowHeaders
              width="100%"
              height="500px"
              licenseKey="non-commercial-and-evaluation"
              afterChange={handleAfterChange} // Hook for changes
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TableEditor;
