const express = require("express");
const path = require('path');

const app = express();

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html')); 
});

app.get('/index.html', (_, res) => {
  res.redirect('/');
});

app.get('/create.html', (_, res) => {
  res.redirect('/create');
});

app.get('/home.html', (_, res) => {
  res.redirect('/home');
});

app.get('/opportunity.html', (_, res) => {
  res.redirect('/opportunity');
});

app.get('/communities.html', (_, res) => {
  res.redirect('/communities');
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

app.get('/communities', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/communities.html'));
});

app.get('/chat', (_, res) => {
  res.redirect('https://discord.gg/5SMgD9t');
});

app.use(express.static('dist'));
app.listen((process.env.PORT || 8080), (process.env.HOST || '0.0.0.0'), () => console.log('ready on port 8080'));