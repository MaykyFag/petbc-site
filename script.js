let pplData = [];
const statusEl = document.getElementById('status');
const suggestionsEl = document.getElementById('suggestions');
const searchInput = document.getElementById('searchInput');

function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const header = lines[0];
    let sep = ',';
    if (header.includes(';') && !header.includes(',')) sep = ';';
    else if (header.includes('\t') && !header.includes(',')) sep = '\t';
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
        const row = [];
        let cur = '';
        let inQuotes = false;
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (!inQuotes && line.substr(j, sep.length) === sep) {
                row.push(cur); cur = ''; j += sep.length - 1; continue;
            }
            cur += ch;
        }
        row.push(cur);
        rows.push(row.map(c => c.trim()));
    }
    const headers = rows[0].map(h => h.toLowerCase());
    const objs = [];
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const obj = { nome: '', prontuario: '', cubiculo: '' };
        for (let c = 0; c < headers.length; c++) {
            const key = headers[c];
            const val = row[c] ?? '';
            if (key.includes('nome')) obj.nome = val;
            else if (key.includes('pront')) obj.prontuario = val;
            else if (key.includes('cub')) obj.cubiculo = val;
        }
        if (obj.nome || obj.prontuario || obj.cubiculo) objs.push(obj);
    }
    return objs;
}

function loadCSV() {
    const input = document.getElementById('csvFile');
    if (!input.files || !input.files[0]) { alert('Selecione um arquivo CSV'); return; }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        try {
            pplData = parseCSV(e.target.result).map(p => ({
                nome: p.nome || '',
                prontuario: (p.prontuario || '').toString(),
                cubiculo: (p.cubiculo || '').toString()
            }));
            statusEl.textContent = `Arquivo "${file.name}" carregado — ${pplData.length} registros`;
            pplData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            hideSuggestions();
            searchInput.value = '';
            alert(`CSV carregado: ${pplData.length} registros`);
        } catch (err) {
            console.error(err);
            alert('Erro ao processar CSV.');
