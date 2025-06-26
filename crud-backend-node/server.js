// server.js

require('dotenv').config(); // Carrega as variáveis de ambiente do .env

const express = require('express');
const mysql = require('mysql2/promise'); // Usaremos a versão com Promises para async/await
const cors = require('cors'); // Importa o pacote CORS

const app = express();
const port = process.env.PORT || 3000; // Porta do servidor, ou 3000 por padrão

// --- Configuração CORS ---
// Define as origens (domínios) que são permitidas acessar sua API.
// É crucial para segurança em produção e para permitir a comunicação entre domínios diferentes.
const allowedOrigins = [
  'http://localhost:4200',        // Para o desenvolvimento local do seu frontend Angular
  'https://lmrobredio.github.io'  // <-- SUA URL DO GITHUB PAGES: SEM A BARRA FINAL DO REPOSITÓRIO!
];

app.use(cors({
  origin: function (origin, callback) {
    // Se a requisição não tiver uma origem (ex: requisições feitas diretamente do servidor, apps mobile, curl), permite.
    // Ou se a origem da requisição estiver na nossa lista de allowedOrigins, permite.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Permite a requisição
    } else {
      callback(new Error('Not allowed by CORS')); // Rejeita a requisição
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Define os métodos HTTP que são permitidos
  credentials: true // Permite que a requ API possa enviar cookies ou cabeçalhos de autorização
}));
// --- Fim da Configuração CORS ---

// Middleware para parsear JSON no corpo das requisições (deve vir DEPOIS do CORS)
app.use(express.json());

// Configuração da conexão com o Google Cloud SQL
const dbConfig = {
    host: process.env.DB_HOST,         // Endereço IP Público da sua instância Cloud SQL (do .env do Render.com)
    user: process.env.DB_USER,         // Geralmente 'root' (do .env do Render.com)
    password: process.env.DB_PASSWORD, // Sua senha do root (do .env do Render.com)
    database: process.env.DB_NAME      // O nome do banco de dados que você criou (do .env do Render.com)
};

// Pool de conexões para o banco de dados
let pool;

async function connectToDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        // Testar a conexão: tenta obter uma conexão do pool para verificar se está funcionando
        await pool.getConnection();
        console.log('Conectado ao Google Cloud SQL!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        // Em caso de erro, tente novamente após um tempo para recuperação
        setTimeout(connectToDatabase, 5000); // Tenta reconectar após 5 segundos
    }
}

// Inicializa a conexão com o banco de dados ao iniciar o servidor
connectToDatabase();

// --- Rotas da API CRUD para 'produtos' ---

// Rota de teste: verifica se a API está funcionando
app.get('/', (req, res) => {
    res.send('API CRUD Node.js está funcionando!');
});

// GET: Lista todos os produtos
app.get('/produtos', async (req, res) => {
    try {
        // Executa uma consulta SQL para buscar todos os produtos
        const [rows] = await pool.query('SELECT * FROM produtos');
        res.json(rows); // Retorna os produtos como JSON
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// GET: Busca um produto pelo ID
app.get('/produtos/:id', async (req, res) => {
    const { id } = req.params; // Obtém o ID da URL
    try {
        // Executa uma consulta SQL para buscar um produto pelo ID
        const [rows] = await pool.query('SELECT * FROM produtos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        res.json(rows[0]); // Retorna o produto encontrado como JSON
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ message: 'Erro ao buscar produto', error: error.message });
    }
});

// POST: Cria um novo produto
app.post('/produtos', async (req, res) => {
    const { nome, preco, descricao } = req.body; // Obtém os dados do corpo da requisição

    // Validação básica dos dados recebidos
    if (!nome || !preco) {
        return res.status(400).json({ message: 'Nome e Preço são campos obrigatórios.' });
    }
    if (isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        // Executa uma consulta SQL para inserir um novo produto
        const [result] = await pool.query(
            'INSERT INTO produtos (nome, preco, descricao) VALUES (?, ?, ?)',
            [nome, parseFloat(preco), descricao]
        );
        res.status(201).json({ // Retorna status 201 (Created) e os dados do produto criado
            message: 'Produto criado com sucesso!',
            id: result.insertId, // ID gerado pelo banco de dados
            produto: { nome, preco, descricao }
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
    }
});

// PUT: Atualiza um produto existente
app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params; // Obtém o ID da URL
    const { nome, preco, descricao } = req.body; // Obtém os novos dados do corpo da requisição

    // Validação básica dos dados recebidos
    if (!nome || !preco) {
        return res.status(400).json({ message: 'Nome e Preço são campos obrigatórios para atualização.' });
    }
    if (isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        // Executa uma consulta SQL para atualizar o produto
        const [result] = await pool.query(
            'UPDATE produtos SET nome = ?, preco = ?, descricao = ? WHERE id = ?',
            [nome, parseFloat(preco), descricao, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para atualização.' });
        }
        res.json({ // Retorna sucesso e os dados atualizados
            message: 'Produto atualizado com sucesso!',
            produto: { id, nome, preco, descricao }
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
    }
});

// DELETE: Deleta um produto
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params; // Obtém o ID da URL
    try {
        // Executa uma consulta SQL para deletar o produto
        const [result] = await pool.query('DELETE FROM produtos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para exclusão.' });
        }
        res.json({ message: 'Produto excluído com sucesso!' }); // Retorna mensagem de sucesso
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro ao excluir produto', error: error.message });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Rotas disponíveis:');
    console.log(`GET    /produtos`);
    console.log(`GET    /produtos/:id`);
    console.log(`POST   /produtos`);
    console.log(`PUT    /produtos/:id`);
    console.log(`DELETE /produtos/:id`);
});
