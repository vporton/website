const express = require("express");
const path = require('path');

const app = express();

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html')); 
});

app.get('/create.html', (_, res) => {
  res.redirect('/create');
});

app.get('/home.html', (_, res) => {
  res.redirect('/home');
});

app.get('/opportunity', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/opportunity.html'));
});

app.get('/create', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/create.html'));
});

app.get('/home', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/home.html'));
});

app.use(express.static('dist'));
app.listen((process.env.PORT || 8080), (process.env.HOST || '0.0.0.0'), () => console.log('ready on port 8080'));