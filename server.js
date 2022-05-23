const express = require('express');
const prismaClient = require('@prisma/client');
var bodyParser = require('body-parser');
var crypto = require('crypto');

const port = 3000;

const app = express();
const prisma = new prismaClient.PrismaClient();
var jsonParser = bodyParser.json();


app.patch('/:id/todo/:itemId', jsonParser, async (req, res) => {
    let { id, itemId } = req.params;
    id = Number(id);
    itemId = Number(itemId);
    const token = req.get('user-token');

    const user = await prisma.user.findUnique({ where: { id } });
    
    if (user == null || user.token != token) {
        res.status(400).json({ message: 'Invalid request.' });
        return;
    }

    const item = await prisma.todoItem.findUnique({ where: { id: itemId } });

    if (item == null || item.userId != user.id) {
        res.status(400).json({ message: 'Invalid request.' });
        return;
    }

    const todoItem = await prisma.todoItem.update({ 
        where: { id: itemId }, 
        data: { finished: true } 
    });
    
    res.json(todoItem);
});

app.get('/:id/todo', jsonParser, async (req, res) => {
    let { id } = req.params;
    id = Number(id);
    const token = req.get('user-token');

    const user = await prisma.user.findUnique({ 
        where: { id }, include: { todoItems: true } 
    });
    
    if(user == null || user.token != token) {
        res.status(400).json({ message: 'Invalid request.' });
        return;
    }
    
    res.json(user.todoItems);
});

app.post('/:id/todo', jsonParser, async (req, res) => {
    let { id } = req.params;
    id = Number(id);
    const { text, token } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if(user == null || user.token != token) {
        res.status(400).json({ message: 'Invalid request.' });
        return;
    }
    
    const finished = false;
    const userId = user.id;
    const todo = await prisma.todoItem.create({
        data: { userId, text, finished }
    });

    res.json(todo);
});

app.get('/user/:id', jsonParser, async (req, res) => {
    let { id } = req.params;
    id = Number(id);

    const user = await prisma.user.findUnique({ where: { id } });

    res.json(user);
});

app.post('/user', jsonParser, async (req, res) => {
    const { name } = req.body;
    const token = crypto.randomUUID();

    const user = await prisma.user.create({
        data: { name, token }
    });

    res.json(user);
});

app.get('/', (req, res) => {
    res.json({ status: "UP" });
});
  
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});