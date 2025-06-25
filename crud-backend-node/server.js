// server.js

require('dotenv').config(); // Carrega as variáveis de ambiente do .env

const express = require('express');
const mysql = require('mysql2/promise'); // Usaremos a versão com Promises para async/await
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para permitir requisições de diferentes origens (CORS)
app.use(cors());

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Configuração da conexão com o Google Cloud SQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Pool de conexões para o banco de dados
let pool;

async function connectToDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        // Testar a conexão
        await pool.getConnection(); // Tenta obter uma conexão para verificar se está funcionando
        console.log('Conectado ao Google Cloud SQL!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        // Em caso de erro, tente novamente após um tempo
        // Uma estratégia mais robusta seria usar um exponencial backoff ou encerrar o app
        setTimeout(connectToDatabase, 5000);
    }
}

// Inicializa a conexão com o banco de dados
connectToDatabase();

// --- Rotas da API CRUD para 'produtos' ---

// Rota de teste
app.get('/', (req, res) => {
    res.send('API CRUD Node.js está funcionando!');
});

// GET: Listar todos os produtos
app.get('/produtos', async (req, res) => {
    try {
        // Obter uma conexão do pool
        const [rows] = await pool.query('SELECT * FROM produtos');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// GET: Buscar um produto pelo ID
app.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM produtos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ message: 'Erro ao buscar produto', error: error.message });
    }
});

// POST: Criar um novo produto
app.post('/produtos', async (req, res) => {
    const { nome, preco, descricao } = req.body;

    // Validação básica
    if (!nome || !preco) {
        return res.status(400).json({ message: 'Nome e Preço são campos obrigatórios.' });
    }
    if (isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO produtos (nome, preco, descricao) VALUES (?, ?, ?)',
            [nome, parseFloat(preco), descricao]
        );
        res.status(201).json({
            message: 'Produto criado com sucesso!',
            id: result.insertId,
            produto: { nome, preco, descricao }
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
    }
});

// PUT: Atualizar um produto existente
app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, preco, descricao } = req.body;

    // Validação básica
    if (!nome || !preco) {
        return res.status(400).json({ message: 'Nome e Preço são campos obrigatórios para atualização.' });
    }
    if (isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE produtos SET nome = ?, preco = ?, descricao = ? WHERE id = ?',
            [nome, parseFloat(preco), descricao, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para atualização.' });
        }
        res.json({
            message: 'Produto atualizado com sucesso!',
            produto: { id, nome, preco, descricao }
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
    }
});

// DELETE: Deletar um produto
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM produtos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para exclusão.' });
        }
        res.json({ message: 'Produto excluído com sucesso!' });
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