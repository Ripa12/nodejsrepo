var express = require('express');

var app = express();

app.disable('x-powered-by');

app.set('view engine', 'ejs');

var routes = require('./routes')

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

var bodyParser = require('body-parser');

// Middlewares

app.use(bodyParser());

// Routes

// home
app.get('/', routes.main);

// search-bar
app.post('/key', routes.searchItem);

// 404 or 500
app.get('*', routes.notFound);

app.listen(3000, function(){
	console.log("The application is running on localhost:3000");
});