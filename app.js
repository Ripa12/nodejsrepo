var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session')

var app = express();

app.disable('x-powered-by');

app.set('view engine', 'ejs');

var routes = require('./routes')

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser())
app.use(session({secret: 'keyboard cat'}))

var bodyParser = require('body-parser');

// Middlewares

app.use(bodyParser());

// Routes

// home
app.get('/', routes.main);

// Table page
app.get('/Table.html', routes.tablePage);

// Graph page
app.get('/Graph.html', routes.graphPage);

// get key
app.post('/newMoons', routes.getNewMoons);

// search-bar
app.post('/setKey', routes.setKey);
app.post('/graphKey', routes.updateGraph);
app.post('/tableKey', routes.updateTable);

// 404 or 500
app.get('*', routes.notFound);

app.listen(3000, function(){
	console.log("The application is running on localhost:3000");
});