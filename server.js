const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

const upload = multer({ dest: 'uploads/' });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'PetbcSystemSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Variável global
let pplList = [];

// Carrega do arquivo ao iniciar o servidor
if (fs.existsSync('pplData.json')) {
  pplList = JSON.parse(fs.readFileSync('pplData.json', 'utf8'));
}

// Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Senha incorreta' });
});

// Upload
app.post('/api/upload', upload.single('csv'), (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Não autorizado' });

  const filePath = req.file.path;
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });

    const lines = data.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const records = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        nome: values[0],
        prontuario: values[1],
        cubiculo: values[2]
      };
    });

    pplList = records; // Atualiza a variável global
    fs.writeFileSync('pplData.json', JSON.stringify(pplList, null, 2));
    fs.unlinkSync(filePath);

    res.json({ success: true, count: pplList.length });
  });
});

// Listagem // Rota PÚBLICA: qualquer um pode consultar
app.get('/api/ppl-public', (req, res) => {
  if (!fs.existsSync('pplData.json')) return res.json([]);
  const data = fs.readFileSync('pplData.json', 'utf8');
  res.json(JSON.parse(data));
});

// Rota PRIVADA: só ADM logado pode acessar
app.get('/api/ppl', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Não autorizado' });
  if (!fs.existsSync('pplData.json')) return res.json([]);
  const data = fs.readFileSync('pplData.json', 'utf8');
  res.json(JSON.parse(data));
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Protege a rota adm.html
app.get('/adm.html', (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'adm.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));