const API_URL = 'http://localhost:3001';

export async function getTableData() {
    const response = await fetch(`${API_URL}/table`);
    return response.json();
}

export async function saveTableData(table) {
    await fetch(`${API_URL}/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table }),
    });
}
