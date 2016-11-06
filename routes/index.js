//Require
var http = require('https');
var request = require('request');

//Global
var keyValue = "Key Value"; //9zEUDsWNqr0jCQ0MbIad8QgWH0giPxF4

//Enum
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

//Header


// main-page
exports.main = function(req, res){
	res.render('main', {keyValue : keyValue});
};

// table-page
exports.tablePage = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;

  res.render('tables', {currentKey : currentKey});
};

// graph-page
exports.graphPage = function(req, res){
  var currentKey = req.session.currentKey;
  var currentPlayer = req.session.currentPlayer;

  res.render('graphs', {currentKey : currentKey});
};


//Key functions
exports.getNewMoons = function(req, res){
  if((typeof req.session.currentKey !== 'undefined') && (typeof req.session.currentPlayer !== 'undefined')){
    var currentKey = req.session.currentKey;
    var currentPlayer = req.session.currentPlayer;
    getJSON(req.session.currentKey, '8', function(moonData){
      returnData = {'moonData': moonData, 'keyValue': currentKey, 'playerAlias': currentPlayer};
      res.json(JSON.stringify(returnData));
      //res.json(moonData);
    });
  }
};

//Key Helper Function
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
  //console.log(reqPath);

  request.get({
    url: reqPath, 
    qs: {apiKey: currKey, start: '2016-01-01',
    end: '2017-01-01'},
    method: 'GET',
    headers: { accept: 'application/json' } }, 

    function(error, response, body){
      if(error) {
        console.log(error);
        callback(null);
      } 
      else {
        console.log('Status: ' + response.statusCode);
        //console.log(body);
        if(response.statusCode != '200'){
          callback(null);
        }
        else{
          callback(body); 
        }
      }
    });

  //return null;
};

function filterJSON(parsedData, filterValue, keyIndex, callback){

  //var playerID = parsedPlayerData["playerId"];

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

function getLeaderboard(resultObject, parsedStatData, objectIndex, selectRange, callback){

  var sortable = [];

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    sortable.push([outClaimsObject['player_alias'], parseInt(outClaimsObject[objectIndex], 10)]);
  }

  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  resultObject['timeAxle'] = ['Leaderboard'];

  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]]]);
    };
  }

  callback(resultObject);
}

function calcMultipleAverageData(resultObject, parsedStatData, objectIndex, keyIndex, avgIncIndex, selectRange, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var avg = 0;

  var firstNewMoonDay;
  var lastNewMoonDay;
  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    if(!statObject.hasOwnProperty(outClaimsObject[objectIndex])){
      statObject[outClaimsObject[objectIndex]] = [[], 0];
      statObject[outClaimsObject[objectIndex]][1] = sortIndex;
      sortIndex++;
      sortable.push([outClaimsObject[objectIndex], 0])
      for (var k = 0; k < resultObject['timeAxle'].length; k++) {
        statObject[outClaimsObject[objectIndex]][0].push(0);
      };
    }
    if(resultObject['timeAxle'].length > (counter + 1)){

      firstNewMoonDay = resultObject['timeAxle'][counter];
      lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');

      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(avgIncIndex.length > 0){
            statObject[outClaimsObject[objectIndex]][0][counter] +=  parseFloat(outClaimsObject[avgIncIndex]);
          }
          else{
            statObject[outClaimsObject[objectIndex]][0][counter] +=  1;
          }
          sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
      }
      else if(claimedDay > lastNewMoonDay){
       
        var d1 = new Date(lastNewMoonDay);
        var d2 = new Date(firstNewMoonDay);
        
        var daySpan = (Math.abs(d1-d2) / 86400000);
        
        for (var statObjKey in statObject) {
          statObject[statObjKey][0][counter] = (statObject[statObjKey][0][counter] / daySpan);
        };
       
        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(avgIncIndex.length > 0){
              statObject[outClaimsObject[objectIndex]][0][counter] +=  parseFloat(outClaimsObject[avgIncIndex]);
            }
            else{
              statObject[outClaimsObject[objectIndex]][0][counter] +=  1;
            }
           
            sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
          }
        }
      }
    }
  }

  var d1 = new Date(lastNewMoonDay);
  var d2 = new Date(firstNewMoonDay);
        
  var daySpan = (Math.abs(d1-d2) / 86400000);
        
  for (var statObjKey in statObject) {
    statObject[statObjKey][0][counter] = (statObject[statObjKey][0][counter] / daySpan);
  };
  
  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
      resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0]]);
    };
  }
 
  callback(resultObject);
}

function calcMultipleAvgPerDayInMonth(resultObject, parsedStatData, objectIndex, keyIndex, avgIncIndex, selectRange, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var avg = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    if(!statObject.hasOwnProperty(outClaimsObject[objectIndex])){
      statObject[outClaimsObject[objectIndex]] = [{'/01': [0, 0], '/02': [0, 0], '/03': [0, 0], '/04': [0, 0], '/05': [0, 0], '/06': [0, 0], 
                    '/07': [0, 0], '/08': [0, 0], '/09': [0, 0], '/10': [0, 0], '/11': [0, 0], 
                    '/12': [0, 0], '/13': [0, 0], '/14': [0, 0], '/15': [0, 0], '/16': [0, 0], '/17': [0, 0], '/18': [0, 0], 
                      '/19': [0, 0], '/20': [0, 0], '/21': [0, 0], '/22': [0, 0], '/23': [0, 0], '/24': [0, 0], 
                      '/25': [0, 0], '/26': [0, 0], '/27': [0, 0], '/28': [0, 0], '/29': [0, 0], '/30': [0, 0], '/31': [0, 0]}, 0, ''];
      statObject[outClaimsObject[objectIndex]][1] = sortIndex;
      sortIndex++;
      sortable.push([outClaimsObject[objectIndex], 0]);
 
    }
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      

      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(avgIncIndex.length > 0){
            statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][1] +=  parseFloat(outClaimsObject[avgIncIndex]);
          }
          else{
            statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][1] +=  1;
          }
          if(statObject[outClaimsObject[objectIndex]][2] != claimedDay){
            statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][0] += 1;
            statObject[outClaimsObject[objectIndex]][2] = claimedDay; 
          }
          sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
      }
      else if(claimedDay > lastNewMoonDay){

        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(avgIncIndex.length > 0){
            statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][1] +=  parseFloat(outClaimsObject[avgIncIndex]);
            }
            else{
              statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][1] +=  1;
            }
            if(statObject[outClaimsObject[objectIndex]][2] != claimedDay){
              statObject[outClaimsObject[objectIndex]][0][claimedDay.substring(7, 10)][0] += 1;
              statObject[outClaimsObject[objectIndex]][2] = claimedDay; 
            }
            sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
          }
        }
      }
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

  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
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
      resultObject['valueAxle'].push([statKey, arr1]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      var arr1 = [];
      for(var j in statObject[sortable[m][0]][0]){
        if(statObject[statKey][0][j][0] != 0){
          statObject[sortable[m][0]][0][j][1] = (statObject[sortable[m][0]][0][j][1] / statObject[sortable[m][0]][0][j][0]);
          arr1.push(statObject[sortable[m][0]][0][j][1]);
        }
        else{
          arr1.push(0);
        }
      }
      resultObject['valueAxle'].push([sortable[m][0], arr1]);
    };
  }
 
  callback(resultObject);
}

function calcMultipleTotalStats(resultObject, parsedStatData, objectIndex, keyIndex, totIncIndex, resetTot, selectRange, callback){

  resultObject['valueAxle'] = [];

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var tot = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    if(!statObject.hasOwnProperty(outClaimsObject[objectIndex])){
      statObject[outClaimsObject[objectIndex]] = [[], 0, 0];
      statObject[outClaimsObject[objectIndex]][1] = sortIndex;
      sortIndex++;
      sortable.push([outClaimsObject[objectIndex], 0])
      for (var k = 0; k < resultObject['timeAxle'].length; k++) {
        statObject[outClaimsObject[objectIndex]][0].push(0);
      };
    }
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(totIncIndex.length > 0){
             statObject[outClaimsObject[objectIndex]][2] += parseFloat(outClaimsObject[totIncIndex]);
          }
          else{
            statObject[outClaimsObject[objectIndex]][2] += 1;
          }
          sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
      }
      else if(claimedDay > lastNewMoonDay){
        
        //resultObject['valueAxle'].push(tot); //Float?
        for (var statObjKey in statObject) {
          statObject[statObjKey][0][counter] = (statObject[statObjKey][2]);

          if(resetTot === true){
             statObject[statObjKey][2] = 0;
          }
        };

        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(totIncIndex.length > 0){
              statObject[outClaimsObject[objectIndex]][2] += parseFloat(outClaimsObject[totIncIndex]);
            }
            else{
              statObject[outClaimsObject[objectIndex]][2] += 1;
            }
            sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
          }
        }
      }
    }
  }

  for (var statObjKey in statObject) {
          statObject[statObjKey][0][counter] = (statObject[statObjKey][2]);
    if(resetTot === true){
      statObject[statObjKey][2] = 0;
    }
  };

  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
      resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], statObject[sortable[m][0]][0]]);
    };
  }
  //console.log(statObject);
  //console.log(resultObject);
  callback(resultObject);
};

function calcAvgPerHour(resultObject, parsedStatData, keyIndex, totIncIndex, callback){

  var weekDay = new Array(7);
  weekDay[0]=  'Monday';
  weekDay[1] = 'Tuesday';
  weekDay[2] = 'Wednesday';
  weekDay[3] = 'Thursday';
  weekDay[4] = 'Friday';
  weekDay[5] = 'Saturday';
  weekDay[6] = 'Sunday';

  var hours = {'T00': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]},
  'T01': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T02': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T03': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T04': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T05': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T06': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T07': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T08': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T09': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T10': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T11': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T12': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T13': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T14': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T15': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T16': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T17': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T18': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T19': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T20': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T21': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T22': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}, 
  'T23': {'Monday': [0, 0], 'Tuesday': [0, 0], 'Wednesday': [0, 0], 'Thursday': [0, 0], 'Friday': [0, 0], 'Saturday': [0, 0], 'Sunday': [0, 0]}};
  

  var prevDay = '';
  var prevHour = '';
  var counter = 0;
  var tot = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
      var claimedHour = outClaimsObject[keyIndex].substring(10, 13);

      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(totIncIndex.length > 0){
             hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][1] += parseFloat(outClaimsObject[totIncIndex]);      
          }
          else{
            hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][1] += 1;
          }

          if((prevDay != claimedDay) || (prevHour != claimedHour)) {
            hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][0] += 1;
            prevDay = claimedDay; 
            prevHour = claimedHour;
          }
      }
      else if(claimedDay > lastNewMoonDay){

        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(totIncIndex.length > 0){
              //tot +=  parseFloat(outClaimsObject[totIncIndex]);
              hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][1] += parseFloat(outClaimsObject[totIncIndex]);
            }
            else{
              //tot += 1;
              hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][1] += 1;
            }

            if(prevDay != claimedDay){
              hours[claimedHour][weekDay[new Date(claimedDay).getDay()]][0] += 1;
              prevDay = claimedDay; 
            }
          }
        }
      }
    }
  }
  resultObject.timeAxle.length = 0;
  resultObject['valueAxle'] = [['Monday', []], ['Tuesday', []], ['Wednesday', []], ['Thursday', []], ['Friday', []], 
  ['Saturday', []], ['Sunday', []]];
  for(var i in hours){
    var iObj = hours[i];
    var jCounter = 0;
    for(var j in iObj){
      var jObj = iObj[j];
      hours[i][j][1] = (hours[i][j][1] / ((hours[i][j][0] > 0) ? hours[i][j][0] : 1 ));

      resultObject['valueAxle'][jCounter][1].push(hours[i][j][1]);
      jCounter++;
    }
    resultObject['timeAxle'].push(i.substring(1, 3));
  }
  //console.log(resultObject);
  callback(resultObject);
}

function calcAvgPerDayInMonth(resultObject, parsedStatData, keyIndex, totIncIndex, callback){

  var monthDays = {'/01': [0, 0], '/02': [0, 0], '/03': [0, 0], '/04': [0, 0], '/05': [0, 0], '/06': [0, 0], 
                    '/07': [0, 0], '/08': [0, 0], '/09': [0, 0], '/10': [0, 0], '/11': [0, 0], 
                    '/12': [0, 0], '/13': [0, 0], '/14': [0, 0], '/15': [0, 0], '/16': [0, 0], '/17': [0, 0], '/18': [0, 0], 
                      '/19': [0, 0], '/20': [0, 0], '/21': [0, 0], '/22': [0, 0], '/23': [0, 0], '/24': [0, 0], 
                      '/25': [0, 0], '/26': [0, 0], '/27': [0, 0], '/28': [0, 0], '/29': [0, 0], '/30': [0, 0], '/31': [0, 0]};
  

  var prevDate = '';
  var counter = 0;
  var tot = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(totIncIndex.length > 0){
             monthDays[claimedDay.substring(7, 10)][1] += parseFloat(outClaimsObject[totIncIndex]);
              
          }
          else{
            monthDays[claimedDay.substring(7, 10)][1] += 1;
          }

          if(prevDate != claimedDay){
            monthDays[claimedDay.substring(7, 10)][0] += 1;
            prevDate = claimedDay; 
          }
      }
      else if(claimedDay > lastNewMoonDay){

        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(totIncIndex.length > 0){
              monthDays[claimedDay.substring(7, 10)][1] += parseFloat(outClaimsObject[totIncIndex]);
            }
            else{
              monthDays[claimedDay.substring(7, 10)][1] += 1;
            }

            if(prevDate != claimedDay){
              monthDays[claimedDay.substring(7, 10)][0] += 1;
              prevDate = claimedDay; 
            }
          }
        }
      }
    }
  }
  resultObject.timeAxle.length = 0;
  resultObject['valueAxle'] = [['_', []]];
  for(var i in monthDays){

    if(monthDays[i][0] != 0){
      monthDays[i][1] = (monthDays[i][1] / monthDays[i][0]);
      resultObject['valueAxle'][0][1].push(monthDays[i][1]);
    }
    else{
      resultObject['valueAxle'][0][1].push(0);
    }

    resultObject['timeAxle'].push(i.substring(1, 3));
    
  }
  callback(resultObject);
}

function calcTotalStats(resultObject, parsedStatData, keyIndex, totIncIndex, resetTot, callback){

  resultObject['valueAxle'] = [['_', []]];

  var counter = 0;
  var tot = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(totIncIndex.length > 0){
             tot +=  parseFloat(outClaimsObject[totIncIndex]);
          }
          else{
            tot += 1;
          }
      }
      else if(claimedDay > lastNewMoonDay){
        
        resultObject['valueAxle'][0][1].push(tot); 

        if(resetTot === true){
          tot = 0;
        }
        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(totIncIndex.length > 0){
              tot +=  parseFloat(outClaimsObject[totIncIndex]);
            }
            else{
              tot += 1;
            }
          }
        }
      }
    }
  }

  resultObject['valueAxle'][0][1].push(tot);

  for(var i = ((resultObject['timeAxle'].length - 1) - resultObject['valueAxle'][0][1].length); i >= 0; i--){
    resultObject['valueAxle'][0][1].push(0);
  }
  //console.log(resultObject);
  callback(resultObject);
};

function calcAverageData(resultObject, parsedStatData, keyIndex, avgIncIndex, callback){

  resultObject['valueAxle'] = [['_', []]];

  var counter = 0;
  var avg = 0;

  var firstNewMoonDay;
  var lastNewMoonDay;
  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    if(resultObject['timeAxle'].length > (counter + 1)){

      firstNewMoonDay = resultObject['timeAxle'][counter];
      lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(avgIncIndex.length > 0){
             avg +=  parseFloat(outClaimsObject[avgIncIndex]);
          }
          else{
            avg += 1;
          }
      }
      else if(claimedDay > lastNewMoonDay){
       
        var d1 = new Date(lastNewMoonDay);
        var d2 = new Date(firstNewMoonDay);
        
        var daySpan = (Math.abs(d1-d2) / 86400000);
        
        resultObject['valueAxle'][0][1].push((avg / daySpan));

        avg = 0;
        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(avgIncIndex.length > 0){
              avg +=  parseFloat(outClaimsObject[avgIncIndex]);
            }
            else{
              avg += 1;
            }
          }
        }
      }
    }
  }
  var d1 = new Date(lastNewMoonDay);
  var d2 = new Date(firstNewMoonDay);
      
  var daySpan = (Math.abs(d1-d2) / 86400000);
        
  resultObject['valueAxle'][0][1].push((avg / daySpan));

  for(var i = ((resultObject['timeAxle'].length - 1) - resultObject['valueAxle'][0][1].length); i >= 0; i--){
    resultObject['valueAxle'][0][1].push(0);
  }

  callback(resultObject);
};

function calcStatTopDate(resultObject, parsedStatData, objectIndex, keyIndex, avgIncIndex, selectedType, selectRange, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var avg = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    var selectedObject = outClaimsObject[objectIndex];
    switch(selectedType){
      case GroupByValue.Overall :
      break;
      case GroupByValue.ByDate :
        selectedObject = selectedObject.substring(0, 10).replace(/\-/g, '/');
      break;
      case GroupByValue.ByMonth :
        selectedObject = selectedObject.substring(0, 7).replace(/\-/g, '/');
      break;
      case GroupByValue.ByHour :
        selectedObject = selectedObject.substring(10, 13);
      break;
    }

    if(!statObject.hasOwnProperty(selectedObject)){
      statObject[selectedObject] = [0, 0];
      statObject[selectedObject][1] = sortIndex;
      sortIndex++;
      sortable.push([selectedObject, 0])
    }
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');  

      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(avgIncIndex.length > 0){
            statObject[selectedObject][0] +=  parseFloat(outClaimsObject[avgIncIndex]);
          }
          else{
            statObject[selectedObject][0] +=  1;
          }
          sortable[statObject[selectedObject][1]][1] += 1;
      }
      else if(claimedDay > lastNewMoonDay){
       
        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(avgIncIndex.length > 0){
              statObject[selectedObject][0] +=  parseFloat(outClaimsObject[avgIncIndex]);
            }
            else{
              statObject[selectedObject][0] +=  1;
            }
            sortable[statObject[selectedObject][1]][1] += 1;
          }
        }
      }
    }
  }
  
  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  resultObject['timeAxle'] = ['Top Date'];
  if(sortable.length >= selectRange){
    for (var m = 0; m < selectRange; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [statObject[sortable[m][0]][0]]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [statObject[sortable[m][0]][0]]]);
    };
  }
 
  callback(resultObject);
}

function getGraphMultipleObjectsData(selectRange, timeframeSelector, resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, callback){


  if(timeframeSelector ===  TimeFrame.PerDay){
    calcMultipleAverageData(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, selectRange, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      resultObject['timeAxle'].pop();
      for (var i = 0; i < resultObject['valueAxle'].length; i++) {
        resultObject['valueAxle'][i][1].pop();
      };
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerDayInMonth){
    calcMultipleAvgPerDayInMonth(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, selectRange, function(averageData){
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerMoon){
    calcMultipleTotalStats(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, true, selectRange, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      resultObject['timeAxle'].pop();
      for (var i = 0; i < resultObject['valueAxle'].length; i++) {
        resultObject['valueAxle'][i][1].pop();
      };
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.AllTime){
    calcMultipleTotalStats(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, false, selectRange, function(totData){
        for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
          resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
        };
        resultObject['timeAxle'].pop();
        for (var i = 0; i < resultObject['valueAxle'].length; i++) {
          resultObject['valueAxle'][i][1].pop();
        };
        callback(totData);
    });
  }
  else{
    callback(null);
  }
  /*
  else if(timeframeSelector ===  TimeFrame.PerHourInWeek){
    calcAvgPerHour(resultObject, filteredData, avgTimeIndex, avgIncIndex, function(averageData){
      callback(averageData);
    });
  }
  
  */

}

function getGraphSingleObjectData(timeframeSelector, resultObject, filteredData, avgTimeIndex, avgIncIndex, callback){


  if(timeframeSelector ===  TimeFrame.PerDay){
    calcAverageData(resultObject, filteredData, avgTimeIndex, avgIncIndex, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      resultObject['timeAxle'].pop();
      resultObject['valueAxle'][0][1].pop();
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerMoon){
    calcTotalStats(resultObject, filteredData, avgTimeIndex, avgIncIndex, true, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      resultObject['timeAxle'].pop();
      resultObject['valueAxle'][0][1].pop();
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerDayInMonth){
    calcAvgPerDayInMonth(resultObject, filteredData, avgTimeIndex, avgIncIndex, function(averageData){
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerHourInWeek){
    calcAvgPerHour(resultObject, filteredData, avgTimeIndex, avgIncIndex, function(averageData){
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.AllTime){
    calcTotalStats(resultObject, filteredData, avgTimeIndex, avgIncIndex, false, function(totData){
        for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
          resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
        };
        resultObject['timeAxle'].pop();
        resultObject['valueAxle'][0][1].pop();
        callback(totData);
    });
  }
  else{
    callback(null);
  }
}

function getGraph(selectRange, groupBy, timeframeSelector, resultObject, filteredData, avgTimeIndex, avgIncIndex, callback){
  if(groupBy === GroupByValue.Overall){
    getGraphSingleObjectData(timeframeSelector, resultObject, filteredData, avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    });
  }
  else if(groupBy === GroupByValue.Tower){
    getGraphMultipleObjectsData(selectRange, timeframeSelector, resultObject, filteredData, 'tower_id', avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    });
  }
  else if((groupBy === GroupByValue.ByDate) || (groupBy === GroupByValue.ByMonth) || (groupBy === GroupByValue.ByHour)){
    calcStatTopDate(resultObject, filteredData, avgTimeIndex, avgTimeIndex, avgIncIndex, groupBy, selectRange, function(graphData){
        callback(graphData);
    });
  }
  else{
    getGraphMultipleObjectsData(selectRange, timeframeSelector, resultObject, filteredData, 'formatted_address', avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    })
  }
}

exports.setKey = function(req, res){
  var reqApiKey = req.body.myApiKey;

  if(typeof reqApiKey !== 'undefined'){
    req.session.currentKey = reqApiKey;

    console.log(req.session.currentKey);
    
    getJSON(req.session.currentKey, '1', function(playerData){
      if(playerData != null){
        if(JSON.parse(playerData).hasOwnProperty('alias')){
          req.session.currentPlayer = JSON.parse(playerData)["alias"];

          console.log("player: " + req.session.currentPlayer);
        }
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

exports.updateGraph = function(req, res){
  //var reqApiKey = req.body.myApiKey;
  //var reqSelectedItem = req.body.myKeySelector;
  var fromDate = req.body.myFromDate;
  var toDate = req.body.myToDate;
  var presetSelector = req.body.myPresetSelector;
  var timeframeSelector = req.body.myTimeframeSelector;
  var groupBy = req.body.myGroupByRadio;
  var selectRange = parseInt(req.body.mySelectionRange, 10);
  
  console.log('selectRange: ' + selectRange);
  console.log('presetSelector: ' + presetSelector);
  console.log('timeframeSelector: ' + timeframeSelector);
  console.log('groupBy: ' + groupBy);
  //console.log(req.session.currentKey);
  
  if(typeof req.session.currentKey !== 'undefined'){
  
  console.log(req.session.currentKey);

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
    //console.log(reqSelectedItem);
    console.log(presetSelector);
    getJSON(req.session.currentKey, '8', function(moonData){
    if(moonData != null){
      var parsedNewMoon = JSON.parse(moonData); 

      var resultObject = {valueAxle: [], timeAxle: []};
      for (var outKey in parsedNewMoon) {
        var outObject = parsedNewMoon[outKey];
        var currDate = outObject['iso8601'].substring(0, 10).replace(/\-/g, '/');
        if ((currDate >= fromDate) && (currDate <= toDate)) {
          resultObject['timeAxle'].push(currDate);
        }
      } 
      var currentDate = new Date().toJSON().slice(0,10).replace(/\-/g, '/');
      if ((currentDate >= fromDate) && (currentDate <= toDate)) {
          resultObject['timeAxle'].push(currentDate);
      }

      getJSON(req.session.currentKey, reqSelectedItem, function(statData){
        var parsedStatData = JSON.parse(statData);
        if(presetSelector === GraphValue.NumberOfBuiltTowers){
          getJSON(req.session.currentKey, '1', function(playerData){
            var parsedPlayerData = JSON.parse(playerData);

            filterJSON(parsedStatData, parsedPlayerData["playerId"],'player_id', function(filteredData){

              getGraph(selectRange, groupBy, timeframeSelector, resultObject, filteredData, 'created_on', '', function(graphData){
                res.json(JSON.stringify(graphData));
              });
          
            });
          });
        }
        else if(presetSelector === GraphValue.NumberOfClaimsOnOtherPlayersTowers){
          getJSON(req.session.currentKey, '1', function(playerData){
            var parsedPlayerData = JSON.parse(playerData);

            filterJSONOnEqual(parsedStatData, parsedPlayerData["playerId"],'previous_player_id', function(filteredData){

              getGraph(selectRange, groupBy, timeframeSelector, resultObject, filteredData, 'claimed_on', '', function(graphData){
                res.json(JSON.stringify(graphData));
              });
          
            });
          });
        }
        else if(presetSelector === GraphValue.AmountOfGeldCollected){
          getGraph(selectRange, groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', 'geld_collected', function(graphData){
            res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.AmountOfBonusCollected){
          getGraph(selectRange, groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', 'geld_bonus', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.NumberOfClaimedTowers){
          getGraph(selectRange, groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        /*else if(presetSelector === GraphValue.PopularLocations){
          getGraph(selectRange, groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        } */ 
        else if(presetSelector === GraphValue.NumberOfBuiltTowersAllPlayers){
          getGraph(selectRange, groupBy, timeframeSelector, resultObject, parsedStatData, 'created_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostClaims){
          getLeaderboard(resultObject, parsedStatData, 'claim_count', selectRange, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostGeldCollected){
          getLeaderboard(resultObject, parsedStatData, 'geld_collected', selectRange, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostBuiltTowers){
          getLeaderboard(resultObject, parsedStatData, 'count', selectRange, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.HighestGeldBonus){
          getLeaderboard(resultObject, parsedStatData, 'geld_bonus', selectRange, function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
      });
    }
    else{
      res.json(JSON.stringify({}));
    }
    });
  };
};

function getTable(tableObject, currentPage, fValArray, fTypeArray, fColumnArray, sortCol, orderCol, callback){

  var nrOfRows = 70;//Temporary

  currentPage = parseFloat(currentPage, 10);
  var parsedObject = JSON.parse(tableObject);

  var headers = Object.keys(parsedObject[0]);
  //console.log(headers);

  for (var outKey = (parsedObject.length - 1); outKey >= 0; outKey--){
    var outObject = parsedObject[outKey];

    var filterRow = false;

    for(var innerKey in outObject){
      //console.log(innerKey);
      for (var fCounter = 0; fCounter < fColumnArray.length; fCounter++) {
        if(innerKey === headers[fColumnArray[fCounter]]){

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
  console.log(nrOfPages);

  var newTableObject = [];
  if(parsedObject.length >= ((nrOfRows * currentPage) + nrOfRows)){
    for (var i = (nrOfRows * currentPage); i < ((nrOfRows * currentPage) + nrOfRows); i++) {
      newTableObject.push(parsedObject[i]);
    };
  }
  else{
    for (var i = (nrOfRows * currentPage); i < parsedObject.length; i++) {
      newTableObject.push(parsedObject[i]);
    };
  }

  resultObject = {'tableData': newTableObject, 'tableNrOfPages': nrOfPages};

  callback(JSON.stringify(resultObject));

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

  //console.log('reqSortColumn: ' + reqSortColumn);
  //console.log('reqOrderColumn: ' + reqOrderColumn);

  /*console.log('reqFilterValArray: ' + reqFilterValArray.length);
  console.log('reqFilterTypeArray: ' + reqFilterTypeArray.length);
  console.log('reqFilterColumnArray: ' + reqFilterColumnArray.length);
  console.log('reqFilterValArray: ' + reqFilterValArray[0]);
  console.log('reqFilterTypeArray: ' + reqFilterTypeArray[0]);
  console.log('reqFilterColumnArray: ' + reqFilterColumnArray[0]);*/
  

  //console.log('reqCurrentPage: ' + reqCurrentPage);

  if(typeof req.session.currentKey !== 'undefined'){
    getJSON(req.session.currentKey, reqSelectedItem, function(resultData){
      getTable(resultData, reqCurrentPage, reqFilterValArray, reqFilterTypeArray, 
        reqFilterColumnArray, reqSortColumn, reqOrderColumn, function(resultTable){
        res.json(resultTable);
      });
    });
  }
  else{
    res.json(JSON.stringify({}));
  }
};

exports.notFound = function(req, res){
	res.send('404');
};

