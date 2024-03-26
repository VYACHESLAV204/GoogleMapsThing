const express = require('express');
const fs = require("fs")
const path = require('path');
const app = express();

const dataFilePath = './data.json';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  }
  next();
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/writeData', async (req, res) => {
    let currentData = fs.readFileSync('data.json')
    // @ts-ignore
    let jsonData = JSON.parse(currentData)

    const requestJson = JSON.stringify(req.body)
    jsonData.push(JSON.parse(requestJson))

    fs.writeFileSync('data.json', JSON.stringify(jsonData))

    res.status(200).send("Success")
})

app.listen(3000, () => {
    console.log("Server successfully running on port 3000");
});