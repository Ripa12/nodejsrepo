//Require
var http = require('https');
var request = require('request');

//Global
var keyValue = "Key Value"; //9zEUDsWNqr0jCQ0MbIad8QgWH0giPxF4

//Header


// main-page
exports.main = function(req, res){
	res.render('main', {keyValue : keyValue});
};

// table-page
exports.tablePage = function(req, res){
  var currentKey = req.session.currentKey;
  res.render('tables', {currentKey : currentKey});
};

// graph-page
exports.graphPage = function(req, res){
  var currentKey = req.session.currentKey;
  res.render('graphs', {currentKey : currentKey});
};


//Key functions
exports.getLastKey = function(req, res){
  var currentKey = req.session.currentKey;
  console.log('lastkey:' + currentKey);
  res.send(currentKey);
};

exports.searchItem = function(req, res){
  var reqApiKey = req.body.myApiKey;
  var reqSelectedItem = req.body.myKeySelector;

  if(typeof reqApiKey !== 'undefined'){
    req.session.currentKey = reqApiKey;
    //console.log("Test");
  }
	
  console.log(req.session.currentKey);
  console.log(reqApiKey);
  console.log(reqSelectedItem);


  var reqPath = 'https://play.2good.com/api/v1/public/claims';
  switch(reqSelectedItem){
    case '1':
        reqPath = 'https://play.2good.com/api/v1/public/me';
      break;
    case '2':
        reqPath = 'https://play.2good.com/api/v1/public/leaderboards/claims';
      break;
    case '3':
        reqPath = 'https://play.2good.com/api/v1/public/leaderboards/tower-builder';
      break;
    case '4':
        reqPath = 'https://play.2good.com/api/v1/public/leaderboards/moons/2016-09-01T09:04:59+00:00';
      break;
    case '5':
        reqPath = 'https://play.2good.com/api/v1/public/hall-of-fame/first-tower/country';
      break;
    case '6':
        reqPath = 'https://play.2good.com/api/v1/public/towers/metadata';
      break;
    case '7':
        reqPath = 'https://play.2good.com/api/v1/public/towers/statistics';
      break;
    case '8':
        reqPath = 'https://play.2good.com/assets/new-moons.min.json';
      break;
  }
  console.log(reqPath);

  request.get({
    url: reqPath, 
    qs: {apiKey: req.session.currentKey, start: '2016-01-01',
    end: '2017-01-01'},
    method: 'GET',
    headers: { accept: 'application/json' } }, 

    function(error, response, body){
      if(error) {
        console.log(error);
        res.json(JSON.stringify({}));
      } else {
        console.log('Status: ' + response.statusCode);
        var data = JSON.parse(body);
        if(data.length > 0){
          var obj = data;
          for (var key in obj){
              var attrName = key;
              var attrValue = obj[key];
          }
          res.json(JSON.stringify(obj));
        }
        else{
          res.json(JSON.stringify({}));
        }
      }
    });
};

exports.notFound = function(req, res){
	res.send('404');
};

