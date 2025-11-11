// --- Configuração e Constantes ---
const cronogramaVisitas = {
  1: { '1': 'Domingo', '2': 'Sexta-Feira', '3': 'Sábado' },
  2: { '1': 'Domingo', '2': 'Sábado', '3': 'Sexta-Feira' },
  3: { '1': 'Sábado', '2': 'Sexta-Feira', '3': 'Domingo' },
  4: { '1': 'Sábado', '2': 'Domingo', '3': 'Sexta-Feira' },
  5: { '1': 'Domingo', '2': 'Sexta-Feira', '3': 'Sábado' },
  6: { '1': 'Domingo', '2': 'Sábado', '3': 'Sexta-Feira' },
  7: { '1': 'Sábado', '2': 'Sexta-Feira', '3': 'Domingo' },
  8: { '1': 'Sábado', '2': 'Domingo', '3': 'Sexta-Feira' },
  9: { '1': 'Domingo', '2': 'Sexta-Feira', '3': 'Sábado' },
 10: { '1': 'Domingo', '2': 'Sábado', '3': 'Sexta-Feira' },
 11: { '1': 'Sábado', '2': 'Sexta-Feira', '3': 'Domingo' },
 12: { '1': 'Sábado', '2': 'Domingo', '3': 'Sexta-Feira' }
};

function getDiaVisitaPorBloco(cubiculo, dataReferencia) {
    if (!cubiculo) return "—";
    const bloco = cubiculo.match(/\d/);
    if (!bloco) return "—";
    const hoje = dataReferencia ? new Date(dataReferencia) : new Date();
    const mes = hoje.getMonth() + 1;
    const diasDoMes = cronogramaVisitas[mes];
    if (!diasDoMes || !diasDoMes[bloco[0]]) return "—";
    return diasDoMes[bloco[0]];
}

function normalize(str){ return String(str||'').normalize('NFC').trim().toLowerCase(); }

// --- Funções de exibição específicas ---

// Painel Cronograma (Consulta)
function montarPainelCronograma() {
    if (!document.getElementById('painel-cronograma')) return;
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const nomesMeses = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dias = cronogramaVisitas[mes];
    let html = `<h3>Cronograma de Visitas do Mês de ${nomesMeses[mes]}</h3><ul>`;
    for (let bloco in dias) {
        html += `<li><strong>Bloco ${bloco}:</strong> ${dias[bloco]}</li>`;
    }
    html += '</ul>';
    document.getElementById('painel-cronograma').innerHTML = html;
}

// --- Busca PPL (Consulta) ---
async function doSearch(){
    if (!document.getElementById('searchInput')) return;
    const qraw = document.getElementById('searchInput').value;
    const q = normalize(qraw);
    if(!q){
        alert('Digite nome ou prontuário para pesquisar');
        return;
    }
    // Busca sempre via API
    let pplData = [];
    try {
        const res = await fetch('/api/ppl-public');
        if (!res.ok) throw new Error('Erro ao buscar dados');
        pplData = await res.json();
    } catch (e) {
        alert('Erro ao buscar dados do servidor.');
        return;
    }
    if(!pplData || pplData.length === 0){
        alert('Nenhum dado de PPL disponível. Peça para o ADM carregar o CSV.');
        return;
    }
    let found = pplData.find(p => normalize(p.prontuario) === q);
    if(!found) found = pplData.find(p => normalize(p.nome) === q);
    if(!found) found = pplData.find(p => normalize(p.nome).includes(q) || normalize(p.prontuario).includes(q));
    if(!found){
        alert('Nenhuma PPL encontrada');
        return;
    }
    // Preenche os campos do popup
    document.getElementById('pplName').textContent = found.nome || '—';
    document.getElementById('pplPront').textContent = found.prontuario || '—';
    document.getElementById('pplCub').textContent = found.cubiculo || '—';
    const bloco = found.cubiculo ? 'Bloco ' + found.cubiculo.charAt(0) : 'Desconhecido';
    document.getElementById('pplBlock').textContent = bloco;
    document.getElementById('pplDay').textContent = getDiaVisitaPorBloco(found.cubiculo);
    document.getElementById('resultPopup').style.display = 'flex';
    document.getElementById('resultPopup').setAttribute('aria-hidden','false');
}

function closePopup(){
    if(document.getElementById('resultPopup')){
      document.getElementById('resultPopup').style.display = 'none';
      document.getElementById('resultPopup').setAttribute('aria-hidden','true');
    }
}

// Painel ADM (Tabela de PPLs)
async function showPPLPanel() {
    if (!document.getElementById('pplTable')) return;
    const pplSearchArea = document.getElementById('pplSearchArea');
    pplSearchArea.style.display = 'block';
    const tableBody = document.querySelector('#pplTable tbody');
    tableBody.innerHTML = '';
    
    // Busca sempre via API
    let arr = [];
    try {
        const res = await fetch('/api/ppl');
        if (!res.ok) throw new Error('Erro ao buscar dados');
        arr = await res.json();
    } catch (e) {
        document.getElementById('emptyListMsg').style.display = 'block';
        return;
    }

    if (!arr || arr.length === 0) {
        document.getElementById('emptyListMsg').style.display = 'block';
        return;
    }
    document.getElementById('emptyListMsg').style.display = 'none';

    arr.forEach(p => {
        let bloco = '';
        if (p.cubiculo && p.cubiculo.length > 0) bloco = p.cubiculo.charAt(0);
        const diaVisita = getDiaVisitaPorBloco(p.cubiculo);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.prontuario || ''}</td>
            <td>${p.nome || ''}</td>
            <td>${p.cubiculo || ''}</td>
            <td>${bloco}</td>
            <td>${diaVisita}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Pesquisa na tabela ADM
    document.getElementById('pplSearchInput').oninput = function() {
        const q = this.value.trim().toLowerCase();
        tableBody.innerHTML = '';
        arr.filter(p => (p.nome||'').toLowerCase().includes(q)).forEach(p => {
            let bloco = '';
            if (p.cubiculo && p.cubiculo.length > 0) bloco = p.cubiculo.charAt(0);
            const diaVisita = getDiaVisitaPorBloco(p.cubiculo);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.prontuario || ''}</td>
                <td>${p.nome || ''}</td>
                <td>${p.cubiculo || ''}</td>
                <td>${bloco}</td>
                <td>${diaVisita}</td>
            `;
            tableBody.appendChild(tr);
        });
    };
}

// Upload CSV (ADM)
function uploadCSV() {
  const fileInput = document.getElementById('csvFile');
  if (!fileInput.files.length) {
    showStatus('Selecione um arquivo!', true);
    return;
  }
  const formData = new FormData();
  formData.append('csv', fileInput.files[0]);
  showStatus('Enviando arquivo...'); // Feedback enquanto envia
  fetch('/api/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showStatus('Arquivo enviado com sucesso!');
        // Atualize a lista de PPLs se necessário
      } else {
        showStatus(data.error || 'Erro ao enviar arquivo!', true);
      }
    })
    .catch(() => showStatus('Erro ao enviar arquivo!', true));
}

// --- Login ADM via popup ---
if(document.querySelector('.admin-btn')){
  document.querySelector('.admin-btn').onclick = function() {
      document.getElementById('admLoginPopup').style.display = 'flex';
      document.getElementById('admLoginPopup').setAttribute('aria-hidden','false');
      document.getElementById('admPasswordInput').focus();
  };
}
function closeAdmPopup() {
   if(document.getElementById('admLoginPopup')){
     document.getElementById('admLoginPopup').style.display = 'none';
     document.getElementById('admLoginPopup').setAttribute('aria-hidden','true');
   }
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.style.color = isError ? 'red' : 'green';
}

async function doAdmLogin() {
   const pwdInput = document.getElementById('admPasswordInput');
   if(!pwdInput) return;
   const pwd = pwdInput.value;
   try {
       const res = await fetch('/api/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ password: pwd })
       });
       if (!res.ok) {
           const data = await res.json();
           alert('Erro: ' + (data.message || res.status));
           return;
       }
       const data = await res.json();
       if (data.success) {
           window.location.href = 'adm.html';
       } else {
           alert('Senha incorreta!');
       }
   } catch (err) {
       alert('Erro de conexão com o servidor: ' + err.message);
   }
}

// --- Eventos globais e inicialização ---
document.addEventListener('keydown', function(e){
   if(e.key === "Escape") {
     closePopup();
     closeAdmPopup();
   }
});

// Enter no campo senha faz login
if(document.getElementById('admPasswordInput')){
  document.getElementById('admPasswordInput').addEventListener('keydown', function(e){
     if(e.key === "Enter") doAdmLogin();
  });
}

// Enter no campo busca faz busca
if(document.getElementById('searchInput')){
  document.getElementById('searchInput').addEventListener('keydown', function(e){
     if(e.key === "Enter") doSearch();
  });
}

// Inicialização por tela
window.onload = async () => {
   // Consulta
   if(document.getElementById('searchInput')){
     document.getElementById('searchInput').focus();
     montarPainelCronograma();
   }

   // ADM
   if(document.getElementById('pplTable')){
     showPPLPanel();
   }
};

// app.js
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  fetch('/api/logout', { method: 'POST' })
    .then(() => window.location.href = 'index.html');
});