const express = require("express");
const path = require('path');

const app = express();

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html')); 
});

app.get('/create.html', (_, res) => {
  res.redirect('/create');
});

app.get('/create', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/create.html'));
});

app.use(express.static('dist'));
app.listen((process.env.PORT || 8080), (process.env.HOST || '0.0.0.0'), () => console.log('ready on port 8080'));