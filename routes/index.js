////
//Require
////
var http = require('https');
var request = require('request');

////
//Global
////

var keyValue = "Key Value"; //9zEUDsWNqr0jCQ0MbIad8QgWH0giPxF4

////
//Enum
////

const GraphValue = {
  NumberOfClaimedTowers: '0',
  NumberOfClaimsOnOtherPlayersTowers: '9',
  NumberOfBuiltTowers: '1',
  AmountOfGeldCollected: '2',
  AmountOfBonusCollected: '3',
  NumberOfBuiltTowersAllPlayers: '4',


  MostClaims: '5',
  MostBuiltTowers: '6',
  MostGeldCollected: '7',
  HighestGeldBonus: '8',
};

const GroupByValue = {
  Overall: '1',
  Tower: '2',
  Loc: '3',
  ByDate: '4',
  ByMonth: '5',
  ByHour: '6',
};

const TimeFrame = {
  AllTime: '0',
  PerMoon: '1',
  PerDay: '2',
  PerDayInMonth: '3',
  PerHourInWeek: '4',
};

////
// Pages
////

exports.main = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;
  var currentPlayerID = req.session.currentPlayerID;

	res.render('main', {currentKey : currentKey, currentPlayer : currentPlayer});
};

exports.tablePage = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;
  var currentPlayerID = req.session.currentPlayerID;
  if(typeof currentPlayerID !== 'undefined'){
    res.render('tables', {currentKey : currentKey, currentPlayer : currentPlayer});
  }
  else{
    res.redirect('/');
  }
};

exports.graphPage = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;
  var currentPlayerID = req.session.currentPlayerID;
  if(typeof currentPlayerID !== 'undefined'){
    res.render('graphs', {currentKey : currentKey, currentPlayer : currentPlayer});
  }
  else{
    res.redirect('/');
  }
};

exports.achievementPage = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;
  var currentPlayerID = req.session.currentPlayerID;
  if(typeof currentPlayerID !== 'undefined'){
    res.render('achievements', {currentKey : currentKey, currentPlayer : currentPlayer});
  }
  else{
    res.redirect('/');
  }
};

exports.notFound = function(req, res){

  res.send('404');
};

////
// Get Functions
////

exports.getNewMoons = function(req, res){
  if((typeof req.session.currentKey !== 'undefined') && (typeof req.session.currentPlayer !== 'undefined')){
    var currentKey = req.session.currentKey;
    var currentPlayer = req.session.currentPlayer;
    getJSON(req.session.currentKey, '8', function(moonData){
      if(moonData != null){
        returnData = {'moonData': moonData, 'keyValue': currentKey, 'playerAlias': currentPlayer};
        res.json(JSON.stringify(returnData));
      }
      else{
        res.json(null);
      }
    });
  }
  else{
    res.json(null);
  }
};

function getJSON(currKey, reqSelectedItem, callback){

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

  request.get({
    url: reqPath, 
    qs: {apiKey: currKey, start: '2014-01-01',
    end: '2030-01-01'},
    method: 'GET',
    headers: { accept: 'application/json' } }, 

    function(error, response, body){
      if(error) {
        console.log(error);
        callback(null);
      } 
      else {
        console.log('Status: ' + response.statusCode);
       
        if(response.statusCode != '200'){
          callback(null);
        }
        else{
          callback(body); 
        }
      }
    });
};

////
// Set Functions
////

exports.setKey = function(req, res){
  var reqApiKey = req.body.myApiKey;

  if(typeof reqApiKey !== 'undefined'){
    req.session.currentKey = reqApiKey;

    
    getJSON(req.session.currentKey, '1', function(playerData){
      if(playerData != null){
        if(JSON.parse(playerData).hasOwnProperty('alias')){
          req.session.currentPlayer = JSON.parse(playerData)["alias"];
          if(req.session.currentPlayer === null){
            req.session.currentPlayer = "Nameless";
          }
          req.session.currentPlayerID = JSON.parse(playerData)["playerId"];
          
        }
      }
      else{
        req.session.currentKey = undefined;
        req.session.currentPlayer = undefined;
        req.session.currentPlayerID = undefined;
      }
      res.json(playerData);
    });
  }
  else{
    //res.json(null);
    res.json(null);
  }
  //res.redirect('/');
};

////
// Helper Functions
////

function filterJSON(parsedData, filterValue, keyIndex, callback){

  for (var outKey in parsedData) {
    var outObject = parsedData[outKey];
    var thisPlayerID = outObject['player_id'];
    if (filterValue != thisPlayerID) {
      delete parsedData[outKey];
    }
  }

  callback(parsedData);
};

function filterJSONOnEqual(parsedData, filterValue, keyIndex, callback){

  for (var outKey in parsedData) {
    var outObject = parsedData[outKey];
    var thisPlayerID = outObject[keyIndex];
    if (filterValue === thisPlayerID) {
      delete parsedData[outKey];
    }
  }

  callback(parsedData);
};

////
// Achievements
////

function processAchievementData(achievementData, towerBuildsData, playerID, callback){

  var parsedAchievementData = JSON.parse(achievementData);
  var parsedTowerBuildsData = JSON.parse(towerBuildsData);

  var resultObject = {'Claims': {'Player': [], 'Value': [-1, -1, -1, -1, -1], 'Target': 'claim_count'}, 
    'ClaimedTowers': {'Player': [], 'Value': [-1, -1, -1, -1, -1], 'Target': 'tower_count'}, 
    'GeldCollected': {'Player': [], 'Value': [-1, -1, -1, -1, -1], 'Target': 'geld_collected'}, 
    'Bonus': {'Player': [], 'Value': [-1, -1, -1, -1, -1], 'Target': 'geld_bonus'}};



  for(var outerKey in resultObject){
      var outerObj = resultObject[outerKey];

    parsedAchievementData.sort(function(b,a) {
        var aVal = a[outerObj['Target']];
        var bVal = b[outerObj['Target']];
        if((/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(aVal)) && 
            (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(bVal))){
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }
        return (aVal > bVal) ? 1 : ((bVal > aVal) ? -1 : 0);
    });

    for(var innerKey in parsedAchievementData){
      var innerObj = parsedAchievementData[innerKey];

      var floatVal = parseFloat(innerObj[outerObj['Target']]);

      if(innerObj['player_id'] === playerID){
        resultObject[outerKey]['Value'][3] = (parseFloat(innerKey) + 1);
        resultObject[outerKey]['Value'][4] = floatVal.toFixed(1);
        resultObject[outerKey]['Player'][3] = innerObj['player_alias'];
      }

      if(floatVal > outerObj['Value'][0]){
        outerObj['Value'][0] = floatVal.toFixed(1);
        outerObj['Player'][0] = innerObj['player_alias'];
      }
      else if(floatVal > outerObj['Value'][1]){
        outerObj['Value'][1] = floatVal.toFixed(1);
        outerObj['Player'][1] = innerObj['player_alias'];
      }
      else if(floatVal > outerObj['Value'][2]){
        outerObj['Value'][2] = floatVal.toFixed(1);
        outerObj['Player'][2] = innerObj['player_alias'];
      }
    }
  }

  resultObject['BuiltTowers'] = {'Player': [], 'Value': [-1, -1, -1, -1, -1], 'Target': 'count'};

  for(var outerKey in parsedTowerBuildsData){
    var outerObj = parsedTowerBuildsData[outerKey];

    var floatVal = parseFloat(outerObj['count']);

    if(outerObj['player_id'] === playerID){
      resultObject['BuiltTowers']['Value'][3] = (parseFloat(outerKey) + 1);
      resultObject['BuiltTowers']['Value'][4] = floatVal.toFixed(1);
      resultObject['BuiltTowers']['Player'][3] = outerObj['player_alias'];
    }
      
    if(floatVal > resultObject['BuiltTowers']['Value'][0]){
      resultObject['BuiltTowers']['Value'][0] = floatVal.toFixed(1);
      resultObject['BuiltTowers']['Player'][0] = outerObj['player_alias'];
    }
    else if(floatVal > resultObject['BuiltTowers']['Value'][1]){
      resultObject['BuiltTowers']['Value'][1] = floatVal.toFixed(1);
      resultObject['BuiltTowers']['Player'][1] = outerObj['player_alias'];
    }
    else if(floatVal > resultObject['BuiltTowers']['Value'][2]){
      resultObject['BuiltTowers']['Value'][2] = floatVal.toFixed(1);
      resultObject['BuiltTowers']['Player'][2] = outerObj['player_alias'];
    }
  }

  callback(resultObject);
};

function processTowerMap(geoData, objectData, sortOn, playerID, callback){
  var parsedGeoObject = JSON.parse(geoData);
  var parsedObject = JSON.parse(objectData);

  var tempResultObject = {'Gold': [0, 0, -1], 'Silver': [0, 0, -1], 'Bronze': [0, 0, -1]};

  var innerKey = 0;

  for (var outerKey = 0; (outerKey < parsedObject.length) && (innerKey < parsedGeoObject.length); outerKey++) {
    var outerObj = parsedObject[outerKey];
    var innerObj = parsedGeoObject[innerKey]; // Remember to check if not empty first!!!

    while(innerObj['tower_id'] !== outerObj['tower_id']){
      innerKey += 1;
      innerObj = parsedGeoObject[innerKey]; 
    }

    var floatVal = parseFloat(outerObj[sortOn]);

    if((innerObj['player_id'] === playerID) || (playerID === '-1')){

      if(floatVal > tempResultObject['Gold'][2]){

        tempResultObject['Bronze'][2] = tempResultObject['Silver'][2];
        tempResultObject['Bronze'][1] = tempResultObject['Silver'][1];
        tempResultObject['Bronze'][0] = tempResultObject['Silver'][0];

        tempResultObject['Silver'][2] = tempResultObject['Gold'][2];
        tempResultObject['Silver'][1] = tempResultObject['Gold'][1];
        tempResultObject['Silver'][0] = tempResultObject['Gold'][0];

        tempResultObject['Gold'][2] = floatVal;
        tempResultObject['Gold'][1] = innerKey;
        tempResultObject['Gold'][0] = outerKey;



      }
      else if(floatVal > tempResultObject['Silver'][2]){

        tempResultObject['Bronze'][2] = tempResultObject['Silver'][2];
        tempResultObject['Bronze'][1] = tempResultObject['Silver'][1];
        tempResultObject['Bronze'][0] = tempResultObject['Silver'][0];

        tempResultObject['Silver'][2] = floatVal;
        tempResultObject['Silver'][1] = innerKey;
        tempResultObject['Silver'][0] = outerKey;
      }
      else if(floatVal > tempResultObject['Bronze'][2]){
        
        tempResultObject['Bronze'][2] = floatVal;
        tempResultObject['Bronze'][1] = innerKey;
        tempResultObject['Bronze'][0] = outerKey;
      }
    }
  }


  var resultObject = {};

  var tempGeoObject = parsedGeoObject[tempResultObject['Gold'][1]];
  var towerName = (tempGeoObject['tower_name'] ? tempGeoObject['tower_name'] : tempGeoObject['tower_id']);

  resultObject['1. ' + towerName] = 
  [{'latitude': tempGeoObject['latitude'], 
        'longitude': tempGeoObject['longitude'], 'tower': towerName,
        'description': ("<b>Created by:</b> " + tempGeoObject['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObject['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObject['formatted_address'] +
        "<br><b>"+ sortOn.replace(/\_/g, ' ') +":</b> " + tempResultObject['Gold'][2])}];


  tempGeoObject = parsedGeoObject[tempResultObject['Silver'][1]];
  towerName = (tempGeoObject['tower_name'] ? tempGeoObject['tower_name'] : tempGeoObject['tower_id']);   
  resultObject['2. ' + towerName] = 
  [{'latitude': tempGeoObject['latitude'], 
        'longitude': tempGeoObject['longitude'], 'tower': towerName,
        'description': ("<b>Created by:</b> " + tempGeoObject['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObject['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObject['formatted_address'] +
        "<br><b>"+ sortOn.replace(/\_/g, ' ') +":</b> " + tempResultObject['Silver'][2])}];


  tempGeoObject = parsedGeoObject[tempResultObject['Bronze'][1]];
  towerName = (tempGeoObject['tower_name'] ? tempGeoObject['tower_name'] : tempGeoObject['tower_id']); 
  resultObject['3. ' + towerName] = 
  [{'latitude': tempGeoObject['latitude'], 
        'longitude': tempGeoObject['longitude'], 'tower': towerName,
        'description': ("<b>Created by:</b> " + tempGeoObject['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObject['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObject['formatted_address'] +
        "<br><b>"+ sortOn.replace(/\_/g, ' ') +":</b> " + tempResultObject['Bronze'][2])}];
  
  callback(resultObject);
}

function processTowerMapByRegion(geoData, objectData, sortOn, region, top3, playerID, callback){
  var parsedGeoObject = JSON.parse(geoData);
  var parsedObject = JSON.parse(objectData);

  var tempResultObject = {};

  var innerKey = 0;

  for (var outerKey = 0; (outerKey < parsedObject.length) && (innerKey < parsedGeoObject.length); outerKey++) {
    var outerObj = parsedObject[outerKey];
    var innerObj = parsedGeoObject[innerKey]; // Empty ?

    while(innerObj['tower_id'] !== outerObj['tower_id']){
      innerKey += 1;
      innerObj = parsedGeoObject[innerKey]; 
    }

    if((innerObj[region] !== null) && ((playerID === innerObj['player_id']) || (playerID === '-1'))){
    var floatVal = parseFloat(outerObj[sortOn]);

    if(!tempResultObject.hasOwnProperty(innerObj[region])){
      tempResultObject[innerObj[region]] = {'Gold': [0, 0, -1, 0, 0], 'Silver': [0, 0, -1, 0, 0], 'Bronze': [0, 0, -1, 0, 0]};
    }
    tempResultObject[innerObj[region]]['Gold'][3] += floatVal;
    tempResultObject[innerObj[region]]['Gold'][4] += 1;

      if(floatVal > tempResultObject[innerObj[region]]['Gold'][2]){

        tempResultObject[innerObj[region]]['Gold'][2] = floatVal;
        tempResultObject[innerObj[region]]['Gold'][1] = innerKey;
        tempResultObject[innerObj[region]]['Gold'][0] = outerKey;
      }
    }
  }


  var resultObject = {};
  var tempGeoObjIndex = 0;
  var towerName = '';

  // 3 elemets exist ?
  if(top3 === false){
    resultObject['Region'] = [];
    for(var outerRegionKey in tempResultObject){
      var outerRegionObj = tempResultObject[outerRegionKey];

      tempGeoObjIndex = parsedGeoObject[outerRegionObj['Gold'][1]];
      towerName = (tempGeoObjIndex['tower_name'] ? tempGeoObjIndex['tower_name'] : tempGeoObjIndex['tower_id']);
      resultObject['Region'].push({'latitude': tempGeoObjIndex['latitude'], 
        'longitude': tempGeoObjIndex['longitude'], 'tower': tempGeoObjIndex[region],
        'description': ("<ins><b>Best Tower</b></ins>" +
        "<br><b>Name:</b> " + towerName + 
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + outerRegionObj['Gold'][2] +
        "<br><b>Created by:</b> " + tempGeoObjIndex['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObjIndex['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObjIndex['formatted_address'] +
        "<br><ins><b>Whole Region</b></ins>" +
        "<br><b>Number of Towers:</b> " + outerRegionObj['Gold'][4] +
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + outerRegionObj['Gold'][3])});
    }
  }
  else{
    var topRegionObj = {};
    topRegionObj['Gold'] = [0, -1, 0, 0];
    topRegionObj['Silver'] = [0, -1, 0, 0];
    topRegionObj['Bronze'] = [0, -1, 0, 0];
    
    for(var outerRegionKey in tempResultObject){
      var outerRegionObj = tempResultObject[outerRegionKey];

      if(outerRegionObj['Gold'][3] > topRegionObj['Gold'][1]){
          
        topRegionObj['Bronze'][3] = topRegionObj['Silver'][3];  
        topRegionObj['Bronze'][2] = topRegionObj['Silver'][2];
        topRegionObj['Bronze'][1] = topRegionObj['Silver'][1];
        topRegionObj['Bronze'][0] = topRegionObj['Silver'][0];

        topRegionObj['Silver'][3] = topRegionObj['Gold'][3];
        topRegionObj['Silver'][2] = topRegionObj['Gold'][2];
        topRegionObj['Silver'][1] = topRegionObj['Gold'][1];
        topRegionObj['Silver'][0] = topRegionObj['Gold'][0];

        topRegionObj['Gold'][3] = outerRegionObj['Gold'][2];
        topRegionObj['Gold'][2] = outerRegionObj['Gold'][4];
        topRegionObj['Gold'][1] = outerRegionObj['Gold'][3];
        topRegionObj['Gold'][0] = outerRegionObj['Gold'][1];
      }
      else if(outerRegionObj['Gold'][3] > topRegionObj['Silver'][1]){
        topRegionObj['Bronze'][3] = topRegionObj['Silver'][3];
        topRegionObj['Bronze'][2] = topRegionObj['Silver'][2];
        topRegionObj['Bronze'][1] = topRegionObj['Silver'][1];
        topRegionObj['Bronze'][0] = topRegionObj['Silver'][0];

        topRegionObj['Silver'][3] = outerRegionObj['Gold'][2];
        topRegionObj['Silver'][2] = outerRegionObj['Gold'][4];
        topRegionObj['Silver'][1] = outerRegionObj['Gold'][3];
        topRegionObj['Silver'][0] = outerRegionObj['Gold'][1];
      }
      else if(outerRegionObj['Gold'][3] > topRegionObj['Bronze'][1]){
        topRegionObj['Bronze'][3] = outerRegionObj['Gold'][2];
        topRegionObj['Bronze'][2] = outerRegionObj['Gold'][4];
        topRegionObj['Bronze'][1] = outerRegionObj['Gold'][3];
        topRegionObj['Bronze'][0] = outerRegionObj['Gold'][1];
      }
    }
    tempGeoObjIndex = parsedGeoObject[topRegionObj['Gold'][0]];
    towerName = (tempGeoObjIndex['tower_name'] ? tempGeoObjIndex['tower_name'] : tempGeoObjIndex['tower_id']);
    resultObject['1. ' + tempGeoObjIndex[region]] = [{'latitude': tempGeoObjIndex['latitude'], 
        'longitude': tempGeoObjIndex['longitude'], 'tower': tempGeoObjIndex[region],
        'description': ("<ins><b>Best Tower</b></ins>" +
        "<br><b>Name:</b> " + towerName + 
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Gold'][3] +
        "<br><b>Created by:</b> " + tempGeoObjIndex['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObjIndex['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObjIndex['formatted_address'] +
        "<br><ins><b>Whole Region</b></ins>" +
        "<br><b>Number of Towers:</b> " + topRegionObj['Gold'][2] +
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Gold'][1])}];

    tempGeoObjIndex = parsedGeoObject[topRegionObj['Silver'][0]];
    towerName = (tempGeoObjIndex['tower_name'] ? tempGeoObjIndex['tower_name'] : tempGeoObjIndex['tower_id']);
    resultObject['2. ' + tempGeoObjIndex[region]] = [{'latitude': tempGeoObjIndex['latitude'], 
        'longitude': tempGeoObjIndex['longitude'], 'tower': tempGeoObjIndex[region],
        'description': ("<ins><b>Best Tower</b></ins>" +
        "<br><b>Name:</b> " + towerName + 
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Silver'][3] +
        "<br><b>Created by:</b> " + tempGeoObjIndex['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObjIndex['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObjIndex['formatted_address'] +
        "<br><ins><b>Whole Region</b></ins>" +
        "<br><b>Number of Towers:</b> " + topRegionObj['Silver'][2] +
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Silver'][1])}];

    tempGeoObjIndex = parsedGeoObject[topRegionObj['Bronze'][0]];
    towerName = (tempGeoObjIndex['tower_name'] ? tempGeoObjIndex['tower_name'] : tempGeoObjIndex['tower_id']);
    resultObject['3. ' + tempGeoObjIndex[region]] = [{'latitude': tempGeoObjIndex['latitude'], 
        'longitude': tempGeoObjIndex['longitude'], 'tower': tempGeoObjIndex[region],
        'description': ("<ins><b>Best Tower</b></ins>" +
        "<br><b>Name:</b> " + towerName + 
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Bronze'][3] +
        "<br><b>Created by:</b> " + tempGeoObjIndex['player_alias'] +
        "<br><b>Created on:</b> " + tempGeoObjIndex['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + tempGeoObjIndex['formatted_address'] +
        "<br><ins><b>Whole Region</b></ins>" +
        "<br><b>Number of Towers:</b> " + topRegionObj['Bronze'][2] +
        "<br><b>" + sortOn.replace(/\_/g, ' ') +":</b> " + topRegionObj['Bronze'][1])}];
  }

  callback(resultObject);
};

function processPlayerMap(geoData, playerData, filterPlayer, targetData, callback){
  var parsedGeoObject = JSON.parse(geoData);
  var parsedClaimsObject = JSON.parse(playerData);

  var tempClaimObject = {};
  var resObject = {};


  for(var outerKey in parsedClaimsObject){
    var outerObj = parsedClaimsObject[outerKey];

    if(!tempClaimObject.hasOwnProperty(outerObj[targetData])){
        tempClaimObject[outerObj[targetData]] = 0;
    } 
  }

  resObject[filterPlayer] = [];

  for(var outerKey in parsedGeoObject){
    var outerObj = parsedGeoObject[outerKey];
    
    if(tempClaimObject.hasOwnProperty(outerKey)){
        var towerName = outerObj['tower_id'];
        if(outerObj['tower_name']){
          towerName = outerObj['tower_name'];
        }
        resObject[filterPlayer].push({'latitude': outerObj['latitude'], 
        'longitude': outerObj['longitude'], 'tower': towerName,
        'description': ("<b>Created by:</b> " + outerObj['player_alias'] +
        "<br><b>Created on:</b> " + outerObj['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + outerObj['formatted_address'])});
    } 
  }

  callback(resObject);
};

function processLeaderboardMap(geoData, filterPlayer, callback){

  var parsedObject = JSON.parse(geoData);

  var resObject = {};
  var sortable = [];
  var counter = 0;

  for(var outerKey in parsedObject){
    var outerObj = parsedObject[outerKey];

    if(outerObj['player_id'] === filterPlayer){
      if(!resObject.hasOwnProperty(outerObj['player_alias'])){
        resObject[outerObj['player_alias']] = [];
      } 
      var towerTitle = outerObj['tower_id'];
      if(outerObj['tower_name']){ towerTitle = outerObj['tower_name']}
      resObject[outerObj['player_alias']].push({'latitude': outerObj['latitude'], 
        'longitude': outerObj['longitude'], 'tower': towerTitle,
        'description': ("<b>Created by:</b> " + outerObj['player_alias'] +
        "<br><b>Created on:</b> " + outerObj['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + outerObj['formatted_address'])});
    }
    else{
      if(!resObject.hasOwnProperty('Other')){
        resObject['Other'] = [];
      }
       
      var towerTitle = outerObj['tower_id'];
      if(outerObj['tower_name']){ towerTitle = outerObj['tower_name']}
      resObject['Other'].push({'latitude': outerObj['latitude'], 
        'longitude': outerObj['longitude'], 'tower': towerTitle,
        'description': ("<b>Created by:</b> " + outerObj['player_alias'] +
        "<br><b>Created on:</b> " + outerObj['created_on'].substring(0, 10).replace(/\-/g, '/') +
        "<br><b>Adress:</b> " + outerObj['formatted_address'])});

    }

  }
 
  callback(resObject);
};

exports.updateMap = function(req, res){
  var geoCategory = req.body.myGeoCategory;
  var geoRegion = req.body.myGeoRegion;
  var geoPlayer = req.body.myGeoPlayer;
  var geoTop = (req.body.myGeoTop === '0' ? false : true);

  if((typeof req.session.currentKey !== 'undefined') && (typeof req.session.currentPlayer !== 'undefined')
    && (typeof req.session.currentPlayerID !== 'undefined')){
    
    var selectedJSON = '6';
    switch(geoCategory){
      case '0':
        selectedJSON = '5';
      break;
    }

    var pID = req.session.currentPlayerID;
    if(geoPlayer === '0'){
      pID = '-1';
    }

    getJSON(req.session.currentKey, selectedJSON, function(mapData){
      if(mapData != null){
        if(geoCategory === '2'){
          getJSON(req.session.currentKey, '0', function(playerData){
            processPlayerMap(mapData, playerData, req.session.currentPlayer, 'tower_id', function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '3'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMap(mapData, towerData, 'claim_count', pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '4'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMap(mapData, towerData, 'total_geld_collected', pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '5'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMap(mapData, towerData, 'total_geld_bonus', pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '6'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMap(mapData, towerData, 'player_count', pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '7'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMapByRegion(mapData, towerData, 'claim_count', geoRegion, geoTop, pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '8'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMapByRegion(mapData, towerData, 'total_geld_collected', geoRegion, geoTop,pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '9'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMapByRegion(mapData, towerData, 'total_geld_bonus', geoRegion, geoTop,pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else if(geoCategory === '10'){
          getJSON(req.session.currentKey, '7', function(towerData){
            processTowerMapByRegion(mapData, towerData, 'player_count', geoRegion, geoTop,pID, function(resultData){
              res.json(JSON.stringify(resultData));
            });
          });
        }
        else{
          processLeaderboardMap(mapData, req.session.currentPlayerID, function(resultData){
            res.json(JSON.stringify(resultData));
          }); 
        }
      }
      else{
        res.send(null);
      }
    });
  }
  else{
    res.send(null);
  }
};

exports.getAchievements = function(req, res){
  if((typeof req.session.currentKey !== 'undefined') && (typeof req.session.currentPlayer !== 'undefined')
    && (typeof req.session.currentPlayerID !== 'undefined')){
    var currentKey = req.session.currentKey;
    var currentPlayer = req.session.currentPlayer;
    getJSON(req.session.currentKey, '2', function(achievementData){
      if(achievementData != null){
        getJSON(req.session.currentKey, '3', function(towerBuildsData){
          processAchievementData(achievementData, towerBuildsData, req.session.currentPlayerID, function(processedAchievementData){
            var returnData = {'achievementData': processedAchievementData, 'keyValue': currentKey, 'playerAlias': currentPlayer};
            res.json(JSON.stringify(returnData));
          });
        });
      }
      else{
        res.json(null);
      }
    });
  } 
  else{
    res.json(null);
  }
};

////
// Graph Functions
////

function processLeaderboard(resultObject, parsedStatData, objectIndex, selectRange, playerID, callback){

  var sortable = [];

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    var isPlayer = false;
    if(outClaimsObject['player_id'] === playerID){
      isPlayer = true;
    }
    sortable.push([outClaimsObject['player_alias'], parseInt(outClaimsObject[objectIndex], 10), isPlayer]);
  }

  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  resultObject['timeAxle'] = ['Leaderboard'];

  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]], sortable[m][2]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]], sortable[m][2]]);
    };
  }

  callback(resultObject);
}

function processGraphPerDayInMonth(resultObject, parsedStatData, graphParams, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var outerObjKey = 0;
  var timeCounter = 0;
  var avg = 0;

  while((resultObject['timeAxle'].length > (timeCounter + 1)) && (outerObjKey < parsedStatData.length)){
    var outerObj = parsedStatData[outerObjKey];

    var currentIndex = ((graphParams['selectRange'] > 0) ? outerObj[graphParams['targetKey']] : graphParams['playerName']);

    if(!statObject.hasOwnProperty(currentIndex)){
      statObject[currentIndex] = [{'1': [0, 0], '2': [0, 0], '3': [0, 0], '4': [0, 0], '5': [0, 0], '6': [0, 0], 
                    '7': [0, 0], '8': [0, 0], '9': [0, 0], '10': [0, 0], '11': [0, 0], 
                    '12': [0, 0], '13': [0, 0], '14': [0, 0], '15': [0, 0], '16': [0, 0], '17': [0, 0], '18': [0, 0], 
                      '19': [0, 0], '20': [0, 0], '21': [0, 0], '22': [0, 0], '23': [0, 0], '24': [0, 0], 
                      '25': [0, 0], '26': [0, 0], '27': [0, 0], '28': [0, 0], '29': [0, 0], '30': [0, 0], '31': [0, 0]}, 0, new Date("1970")];
      statObject[currentIndex][1] = sortIndex;
      sortIndex++;
      sortable.push([currentIndex, 0]);
 
    }
      var firstNewMoonDay = resultObject['timeAxle'][timeCounter];
      var lastNewMoonDay = resultObject['timeAxle'][timeCounter + 1];
      var claimedDay = new Date(outerObj[graphParams['timeKey']]);
    
      if(claimedDay < firstNewMoonDay){
        outerObjKey += 1;
      }
      else if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          
          if(graphParams['incValueKey'].length > 0){
            statObject[currentIndex][0][String(claimedDay.getDate())][1] += parseFloat(outerObj[graphParams['incValueKey']]);
          }
          else{
            statObject[currentIndex][0][String(claimedDay.getDate())][1] += 1;
          }
          
          if((statObject[currentIndex][2].getDate() != claimedDay.getDate()) ||
            (statObject[currentIndex][2].getMonth() != claimedDay.getMonth()) ||
              (statObject[currentIndex][2].getFullYear() != claimedDay.getFullYear())){
            statObject[currentIndex][0][String(claimedDay.getDate())][0] += 1;
            statObject[currentIndex][2] = claimedDay; 
          }
          sortable[statObject[currentIndex][1]][1] += 1;
          outerObjKey += 1;
      }
      else{
        timeCounter += 1;
      }
  }

  resultObject.timeAxle.length = 0;
  resultObject['timeAxle'] = ['01', '02', '03', '04', '05','06','07','08','09','10','11','12','13','14','15','16','17','18','19',
  '20','21','22','23','24','25','26','27','28','29','30','31'];
  
  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  if((graphParams['selectRange'] <= 0) && (sortable.length > 0)){
    graphParams['selectRange'] = 1;
  }
  else if(sortable.length >= graphParams['selectRange']){

  }
  else{
    graphParams['selectRange'] = sortable.length;
  }
  
  for (var m = 0; m < graphParams['selectRange']; m++) {
    var arr1 = [];
    var statKey = sortable[m][0];
    for(var j in statObject[statKey][0]){
      
      if(statObject[statKey][0][j][0] != 0){
        statObject[statKey][0][j][1] = (statObject[statKey][0][j][1] / statObject[statKey][0][j][0]);
        arr1.push(statObject[statKey][0][j][1]);
      }
      else{
        arr1.push(0);
      }  
    }
    resultObject['valueAxle'].push([statKey, arr1, false]);
  };
  
 
  callback(resultObject);
}

function processGraphPerNewMoon(resultObject, parsedStatData, graphParams, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var timeCounter = 0;
  var outerObjKey = 0;

  while((resultObject['timeAxle'].length > (timeCounter + 1)) && (outerObjKey < parsedStatData.length)){
    var outerObj = parsedStatData[outerObjKey];

    var currentIndex = ((graphParams['selectRange'] > 0) ? outerObj[graphParams['targetKey']] : graphParams['playerName']);

    if(!statObject.hasOwnProperty(currentIndex)){
      statObject[currentIndex] = [[], 0, 0];
      statObject[currentIndex][1] = sortIndex;
      sortIndex++;
      sortable.push([currentIndex, 0])
      for (var k = 0; k < (resultObject['timeAxle'].length - 1); k++) {
        statObject[currentIndex][0].push(0);
      };
    }

    var firstNewMoonDay = resultObject['timeAxle'][timeCounter];
    var lastNewMoonDay = resultObject['timeAxle'][timeCounter + 1];
    var claimedDay = new Date(outerObj[graphParams['timeKey']]);
     
      if(claimedDay < firstNewMoonDay){
        outerObjKey += 1;
      }
      else if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(graphParams['incValueKey'].length > 0){
             statObject[currentIndex][2] += parseFloat(outerObj[graphParams['incValueKey']]);
          }
          else{
            statObject[currentIndex][2] += 1;
          }
          sortable[statObject[currentIndex][1]][1] += 1;
          outerObjKey += 1;
      }  
      else{
        
        var d1 = (lastNewMoonDay);
        var d2 = (firstNewMoonDay);
        
        var daySpan = (graphParams['average'] === true ? (Math.abs(d1-d2) / 86400000) : 1);

        for (var statObjKey in statObject) {
          statObject[statObjKey][0][timeCounter] = (statObject[statObjKey][2] / daySpan);

          if(graphParams['runningTotal'] === false){
             statObject[statObjKey][2] = 0;
          }
          else{
            for (var i = 0; i < (resultObject['timeAxle'].length - timeCounter - 1); i++) {
              statObject[statObjKey][0][i + timeCounter] = (statObject[statObjKey][2] / daySpan);
            };
          }
        };

        timeCounter += 1;
      }
  }

  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  if((graphParams['selectRange'] <= 0) && (sortable.length > 0)){
    resultObject['valueAxle'].push([sortable[0][0], statObject[sortable[0][0]][0], false]);
  }
  else{
    if(sortable.length >= graphParams['selectRange']){
      for (var m = 0; m < graphParams['selectRange']; m++) {
        resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0], false]);
      };
    }
    else{
      for (var m = 0; m < sortable.length; m++) {
        resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0], false]);
      };
    }
  }
  
  for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
    resultObject['timeAxle'][i] = resultObject['timeAxle'][i].getFullYear() + "/" + (resultObject['timeAxle'][i].getMonth() + 1) + "/" +
    resultObject['timeAxle'][i].getDate() + '-' + resultObject['timeAxle'][i + 1].getFullYear() + "/" + (resultObject['timeAxle'][i + 1].getMonth() + 1) + 
    "/" + resultObject['timeAxle'][i + 1].getDate();
  };
  resultObject['timeAxle'].pop();
 
  callback(resultObject);
};

function processGraphAvgPerHour(resultObject, parsedStatData, graphParams, callback){

  var weekDay = new Array(7);
  weekDay[0]=  'Monday';
  weekDay[1] = 'Tuesday';
  weekDay[2] = 'Wednesday';
  weekDay[3] = 'Thursday';
  weekDay[4] = 'Friday';
  weekDay[5] = 'Saturday';
  weekDay[6] = 'Sunday';

  var hours = {'0': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]},
  '1': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '2': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '3': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '4': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '5': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '6': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '7': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '8': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '9': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '10': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '11': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '12': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '13': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '14': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '15': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '16': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '17': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '18': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '19': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '20': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '21': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '22': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  '23': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}};
  

  var prevDay = new Date("1970");
  var prevHour = '';
  var timeCounter = 0;
  var outerObjKey = 0;
  var tot = 0;

  while((resultObject['timeAxle'].length > (timeCounter + 1)) && (outerObjKey < parsedStatData.length)){
    var outClaimsObject = parsedStatData[outerObjKey];

      var firstNewMoonDay = resultObject['timeAxle'][timeCounter];
      var lastNewMoonDay = resultObject['timeAxle'][timeCounter + 1];
      var claimedDay = new Date(outClaimsObject[graphParams['timeKey']]);
      var claimedHour = String(claimedDay.getHours());

      if(claimedDay < firstNewMoonDay){
        outerObjKey += 1;
      }
      else if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(graphParams['incValueKey'].length > 0){
             hours[claimedHour][weekDay[claimedDay.getDay()]][1] += parseFloat(outClaimsObject[graphParams['incValueKey']]);      
          }
          else{
            hours[claimedHour][weekDay[claimedDay.getDay()]][1] += 1;
          }

          if(((prevDay.getFullYear() != claimedDay.getFullYear()) && (prevDay.getMonth() != claimedDay.getMonth()) && (prevDay.getDate() != claimedDay.getDate())) || (prevHour != claimedHour)) {
            hours[claimedHour][weekDay[claimedDay.getDay()]][0] += 1;
            prevDay = claimedDay; 
            prevHour = claimedHour;
          }
          outerObjKey += 1;
      }
      else{
        timeCounter += 1;
      }
  }
  resultObject.timeAxle.length = 0;
  resultObject['valueAxle'] = [['Monday', [], false], ['Tuesday', [], false], ['Wednesday', [], false], 
  ['Thursday', [], false], ['Friday', [], false], ['Saturday', [], false], ['Sunday', [], false]];
  for(var i in hours){
    var iObj = hours[i];
    var jCounter = 0;
    for(var j in iObj){
      var jObj = iObj[j];

      hours[i][j][1] = (hours[i][j][1] / ((hours[i][j][0] > 0) ? hours[i][j][0] : 1 ));

      resultObject['valueAxle'][jCounter][1].push(hours[i][j][1]);
      jCounter++;
    }
    resultObject['timeAxle'].push(i);
  }
  
  callback(resultObject);
}

function processGraphTopDate(resultObject, parsedStatData, graphParams, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var timeCounter = 0;
  var outerObjKey = 0;
  var avg = 0;

  while((resultObject['timeAxle'].length > (timeCounter + 1)) && (outerObjKey < parsedStatData.length)){
    var outClaimsObject = parsedStatData[outerObjKey];

    var selectedObject = '';
    var tempSelectedDate = new Date(outClaimsObject[graphParams['timeKey']]);
    switch(graphParams['groupBy']){
      case GroupByValue.Overall :
      break;
      case GroupByValue.ByDate :
        selectedObject = tempSelectedDate.getFullYear() + "/" + (tempSelectedDate.getMonth() + 1) +
        "/" + tempSelectedDate.getDate();
      break;
      case GroupByValue.ByMonth :
        selectedObject = (tempSelectedDate.getMonth() + 1);
      break;
      case GroupByValue.ByHour :
        selectedObject = tempSelectedDate.getHours();
      break;
    }

    if(!statObject.hasOwnProperty(selectedObject)){
      statObject[selectedObject] = [0, 0];
      statObject[selectedObject][1] = sortIndex;
      sortIndex++;
      sortable.push([selectedObject, 0])
    }

      var firstNewMoonDay = resultObject['timeAxle'][timeCounter];
      var lastNewMoonDay = resultObject['timeAxle'][timeCounter + 1];
      var claimedDay = new Date(outClaimsObject[graphParams['timeKey']]);

      if(claimedDay < firstNewMoonDay){
        outerObjKey += 1;
      }
      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(graphParams['incValueKey'].length > 0){
            statObject[selectedObject][0] +=  parseFloat(outClaimsObject[graphParams['incValueKey']]);
          }
          else{
            statObject[selectedObject][0] +=  1;
          }
          sortable[statObject[selectedObject][1]][1] += 1;
          outerObjKey += 1;
      }
      else{
        timeCounter += 1;
      }
  }
  
  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  resultObject['timeAxle'] = ['Top Date'];
  if(sortable.length >= graphParams['selectRange']){
    for (var m = 0; m < graphParams['selectRange']; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [statObject[sortable[m][0]][0]], false]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [statObject[sortable[m][0]][0]], false]);
    };
  }
 
  callback(resultObject);
}

function processMultipleGraphData(resultObject, filteredData, graphParams, callback){


  if(graphParams['timeframeSelector'] ===  TimeFrame.PerDay){
    graphParams['average'] = true;
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.PerDayInMonth){
    processGraphPerDayInMonth(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.PerMoon){
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.AllTime){
    graphParams['runningTotal'] = true;
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(totData){
        callback(totData);
    });
  }
  else{
    callback(null);
  }
}

function processSingleGraphData(resultObject, filteredData, graphParams, callback){

  if(graphParams['timeframeSelector'] ===  TimeFrame.PerDay){
    graphParams['selectRange'] = 0;
    graphParams['average'] = true;
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.PerMoon){
    graphParams['selectRange'] = 0;
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.PerDayInMonth){
    graphParams['selectRange'] = 0;
    processGraphPerDayInMonth(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.PerHourInWeek){
    processGraphAvgPerHour(resultObject, filteredData, graphParams, function(averageData){
      callback(averageData);
    });
  }
  else if(graphParams['timeframeSelector'] ===  TimeFrame.AllTime){
    graphParams['selectRange'] = 0;
    graphParams['runningTotal'] = true;
    processGraphPerNewMoon(resultObject, filteredData, graphParams, function(totData){
        callback(totData);
    });
  }
  else{
    callback(null);
  }
}

function processGraph(graphParams, resultObject, filteredData, callback){
  if(graphParams['groupBy'] === GroupByValue.Overall){
    processSingleGraphData(resultObject, filteredData, graphParams, function(graphData){
        callback(graphData);
    });
  }
  else if(graphParams['groupBy'] === GroupByValue.Tower){
    graphParams['targetKey'] = 'tower_id';
    processMultipleGraphData(resultObject, filteredData, graphParams, function(graphData){
        callback(graphData);
    });
  }
  else if((graphParams['groupBy'] === GroupByValue.ByDate) || (graphParams['groupBy'] === GroupByValue.ByMonth) || (graphParams['groupBy'] === GroupByValue.ByHour)){
    processGraphTopDate(resultObject, filteredData, graphParams, function(graphData){
        callback(graphData);
    });
  }
  else{
    graphParams['targetKey'] = 'formatted_address';
    processMultipleGraphData(resultObject, filteredData, graphParams, function(graphData){
        callback(graphData);
    })
  }
}

exports.updateGraph = function(req, res){
  var fromDate = new Date(req.body.myFromDate);
  var toDate = new Date(req.body.myToDate);
  var presetSelector = req.body.myPresetSelector;
  var timeframeSelector = req.body.myTimeframeSelector;
  var groupBy = req.body.myGroupByRadio;
  var selectRange = parseInt(req.body.mySelectionRange, 10);
  
  if(typeof req.session.currentKey !== 'undefined'){
  

  var reqSelectedItem = '0';
    switch(presetSelector){
      case GraphValue.NumberOfBuiltTowers:
        reqSelectedItem = '6';
      break;
      case GraphValue.NumberOfBuiltTowersAllPlayers:
        reqSelectedItem = '6';
      break;
      case GraphValue.MostClaims:
        reqSelectedItem = '2';
      break;
      case GraphValue.MostGeldCollected:
        reqSelectedItem = '2';
      break;
      case GraphValue.HighestGeldBonus:
        reqSelectedItem = '2';
      break;
      case GraphValue.MostBuiltTowers:
        reqSelectedItem = '3';
      break;
      
    }

    getJSON(req.session.currentKey, '8', function(moonData){
    if(moonData != null){
      var parsedNewMoon = JSON.parse(moonData); 

      var resultObject = {valueAxle: [], timeAxle: []};
      for (var outKey in parsedNewMoon) {
        var outObject = parsedNewMoon[outKey];
        var currDate = new Date(outObject['iso8601']);
        if ((currDate >= fromDate) && (currDate <= toDate)) {
          resultObject['timeAxle'].push(currDate);
        }
      } 
      var currentDate = new Date(new Date().toJSON().slice(0,10).replace(/\-/g, '/'));

      if ((currentDate >= fromDate) && (currentDate <= toDate)) {
          resultObject['timeAxle'].push(currentDate);
      }

      getJSON(req.session.currentKey, reqSelectedItem, function(statData){
        var parsedStatData = JSON.parse(statData);

        var graphParams = {'playerName': req.session.currentPlayer, 
        'selectRange': selectRange, 'groupBy': groupBy, 'timeframeSelector': timeframeSelector,
        'timeKey': '', 'incValueKey': '', 'targetKey': '', 'runningTotal': false, 'average': false};
        
        if(presetSelector === GraphValue.NumberOfBuiltTowers){

          filterJSON(parsedStatData, req.session.currentPlayerID,'player_id', function(filteredData){

            graphParams['timeKey'] = 'created_on';
            processGraph(graphParams, resultObject, filteredData, function(graphData){
              res.json(JSON.stringify(graphData));
            });
          
          });
          
        }
        else if(presetSelector === GraphValue.NumberOfClaimsOnOtherPlayersTowers){
          filterJSONOnEqual(parsedStatData, req.session.currentPlayerID,'previous_player_id', function(filteredData){

            graphParams['timeKey'] = 'claimed_on';
            processGraph(graphParams, resultObject, filteredData, function(graphData){
              res.json(JSON.stringify(graphData));
            });
          
          });
        
        }
        else if(presetSelector === GraphValue.AmountOfGeldCollected){
          graphParams['timeKey'] = 'claimed_on';
          graphParams['incValueKey'] = 'geld_collected';
          processGraph(graphParams, resultObject, parsedStatData, function(graphData){
            res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.AmountOfBonusCollected){
          graphParams['timeKey'] = 'claimed_on';
          graphParams['incValueKey'] = 'geld_bonus';
          processGraph(graphParams, resultObject, parsedStatData, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.NumberOfClaimedTowers){
          graphParams['timeKey'] = 'claimed_on';
          processGraph(graphParams, resultObject, parsedStatData, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.NumberOfBuiltTowersAllPlayers){
          graphParams['timeKey'] = 'created_on';
          processGraph(graphParams, resultObject, parsedStatData, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostClaims){
          processLeaderboard(resultObject, parsedStatData, 'claim_count', selectRange, req.session.currentPlayerID, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostGeldCollected){
          processLeaderboard(resultObject, parsedStatData, 'geld_collected', selectRange, req.session.currentPlayerID, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostBuiltTowers){
          processLeaderboard(resultObject, parsedStatData, 'count', selectRange, req.session.currentPlayerID, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.HighestGeldBonus){
          processLeaderboard(resultObject, parsedStatData, 'geld_bonus', selectRange, req.session.currentPlayerID, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
      });
    }
    else{
      res.json(null);
    }
    });
  }
  else{
    res.json(null);
  }
};


////
// Table Functions
////

function processTable(tableObject, currentPage, fValArray, fTypeArray, fColumnArray, sortCol, orderCol, callback){

  var nrOfRows = 70;//Temporary

  currentPage = parseFloat(currentPage, 10);
  var parsedObject = JSON.parse(tableObject);
  if(Object.keys(parsedObject).length > 0)
  {
  var headers = Object.keys(parsedObject[0]);
  for (var i = (headers.length - 1); i >= 0; i--) {
    if(headers[i] == 'player_id'){
      headers.splice(i,1);
    }else if(headers[i] == 'previous_player_id'){
      headers.splice(i,1);
    }
  };

  for (var outKey = (parsedObject.length - 1); outKey >= 0; outKey--){
    var outObject = parsedObject[outKey];
    var filterRow = false;

    for(var innerKey in outObject){
      for (var fCounter = 0; fCounter < fColumnArray.length; fCounter++) {
        if(innerKey === headers[fColumnArray[fCounter]]){
        if(outObject[innerKey] !== null && outObject[innerKey] !== "undefined"){
          if((/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(outObject[innerKey])) && 
            (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(fValArray[fCounter]))){
            switch(fTypeArray[fCounter]){
              case "0" :
                if(parseFloat(outObject[innerKey]) < parseFloat(fValArray[fCounter])){  
                  filterRow = true;
                }
              break;
              case "1" :
                if(parseFloat(outObject[innerKey]) > parseFloat(fValArray[fCounter])){
                  filterRow = true;
                }
              break;
              case "2" :
                if(parseFloat(outObject[innerKey]) != parseFloat(fValArray[fCounter])){
                  filterRow = true;
                }
              break;
              case "4" :
                if(parseFloat(outObject[innerKey]) <= parseFloat(fValArray[fCounter])){   
                  filterRow = true;
                }
              break;
              case "5" :
                if(parseFloat(outObject[innerKey]) >= parseFloat(fValArray[fCounter])){
                  filterRow = true;
                }
              break;
            }
          }
          else{
            if(fValArray[fCounter] != null && fValArray[fCounter] != "undefined" && fValArray[fCounter].length > 0){
                      
              switch(fTypeArray[fCounter]){
                case "0" :
                  var tempCurrentDate = new Date(outObject[innerKey]);
                  var tempFilterDate = new Date(fTypeArray[fCounter]);
                  if((!isNaN(tempCurrentDate)) && (!isNaN(tempFilterDate))){
                    if(tempCurrentDate < tempFilterDate){
                      filterRow = true;
                    }
                  }
                break;
                case "1" :
                  var tempCurrentDate = new Date(outObject[innerKey]);
                  var tempFilterDate = new Date(fValArray[fCounter]);
                  if((!isNaN(tempCurrentDate)) && (!isNaN(tempFilterDate))){
                    if(tempCurrentDate > tempFilterDate){
                      filterRow = true;
                    }
                  }
                break;
                case "4" :
                  var tempCurrentDate = new Date(outObject[innerKey]);
                  var tempFilterDate = new Date(fValArray[fCounter]);
                  if((!isNaN(tempCurrentDate)) && (!isNaN(tempFilterDate))){
                    if(tempCurrentDate <= tempFilterDate){
                      filterRow = true;
                    }
                  }
                break;
                case "5" :
                  var tempCurrentDate = new Date(outObject[innerKey]);
                  var tempFilterDate = new Date(fValArray[fCounter]);
                  if((!isNaN(tempCurrentDate)) && (!isNaN(tempFilterDate))){
                    if(tempCurrentDate >= tempFilterDate){
                      filterRow = true;
                    }
                  }
                break;
                case "2" :
                if(outObject[innerKey] != (fValArray[fCounter])){
                  filterRow = true;
                }
                break;
                case "3" :
                  if(outObject[innerKey].indexOf(fValArray[fCounter]) < 0){
                    filterRow = true;
                  }
                break;
              }
            }
          }
        }
        else{
          filterRow = true;
        }
        }
      }
    }
    if(filterRow === true){
      parsedObject.splice(outKey,1);
    }
  }

  if((headers[sortCol]) && (orderCol!='0')){
    if(orderCol === '1'){
      parsedObject.sort(function(a,b) {
        var aVal = a[headers[sortCol]];
        var bVal = b[headers[sortCol]];
        if((/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(aVal)) && 
            (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(bVal))){
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }
          return (aVal > bVal) ? 1 : ((bVal > aVal) ? -1 : 0);
      });
    }
    else{
      parsedObject.sort(function(b,a) {
        var aVal = a[headers[sortCol]];
        var bVal = b[headers[sortCol]];
        if((/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(aVal)) && 
            (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(bVal))){
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }
          return (aVal > bVal) ? 1 : ((bVal > aVal) ? -1 : 0);
      });
    }
  }

  var nrOfPages = Math.floor(parsedObject.length/nrOfRows);

  var newTableObject = [];
  if(parsedObject.length >= ((nrOfRows * currentPage) + nrOfRows)){
    for (var i = (nrOfRows * currentPage); i < ((nrOfRows * currentPage) + nrOfRows); i++) {
      if(parsedObject[i].hasOwnProperty('player_id')){
        delete parsedObject[i]['player_id'];
      }else if(parsedObject[i].hasOwnProperty('previous_player_id')){
        delete parsedObject[i]['previous_player_id'];
      }
      newTableObject.push(parsedObject[i]);
    };
  }
  else{
    for (var i = (nrOfRows * currentPage); i < parsedObject.length; i++) {
      if(parsedObject[i].hasOwnProperty('player_id')){
        delete parsedObject[i]['player_id'];
      }else if(parsedObject[i].hasOwnProperty('previous_player_id')){
        delete parsedObject[i]['previous_player_id'];
      }
      newTableObject.push(parsedObject[i]);
    };
  }
    var resultObject = {'tableData': newTableObject, 'tableNrOfPages': nrOfPages};
    callback(JSON.stringify(resultObject));
  }
  else{
    callback(null);
  }
};

exports.updateTable = function(req, res){
  var reqApiKey = req.body.myApiKey;
  var reqCurrentPage = req.body.myCurrentPage;
  var reqSelectedItem = req.body.myKeySelector;

  var reqFilterValArray = req.body.myFilterValArray;
  var reqFilterTypeArray = req.body.myFilterTypeArray;
  var reqFilterColumnArray = req.body.myFilterColumnArray;

  var reqSortColumn = req.body.mySortColumn;
  var reqOrderColumn = req.body.myOrderColumn;

  if(typeof req.session.currentKey !== 'undefined'){
    getJSON(req.session.currentKey, reqSelectedItem, function(resultData){
      if(resultData != null){
        processTable(resultData, reqCurrentPage, reqFilterValArray, reqFilterTypeArray, 
          reqFilterColumnArray, reqSortColumn, reqOrderColumn, function(resultTable){
          res.json(resultTable);
        });
      }
    });
  }
  else{
    res.json(null);
  }
};


