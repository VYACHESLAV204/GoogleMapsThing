const express = require('express');
const fs = require("fs")
const path = require('path');
const app = express();

const dataFilePath = './data.json';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/writeData', async (req, res) => {
    let currentData = fs.readFileSync('data.json')
    let jsonData = JSON.parse(currentData)

    const requestJson = JSON.stringify(req.body)
    jsonData.push(JSON.parse(requestJson))

    fs.writeFileSync('data.json', JSON.stringify(jsonData))

    res.status(200).send("Success")
})

app.listen(3000, () => {
    console.log("Server successfully running on port 3000");
});