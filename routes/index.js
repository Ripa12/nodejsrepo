//Require
var http = require('https');
var request = require('request');

//Global
var keyValue = "Key Value"; //9zEUDsWNqr0jCQ0MbIad8QgWH0giPxF4

//Enum
const GraphValue = {
  NumberOfClaimedTowers: '0',
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
  res.render('tables', {currentKey : currentKey});
};

// graph-page
exports.graphPage = function(req, res){
  var currentKey = req.session.currentKey;
  res.render('graphs', {currentKey : currentKey});
};


//Key functions
exports.getNewMoons = function(req, res){
  if(typeof req.session.currentKey !== 'undefined'){
    var currentKey = req.session.currentKey;
    getJSON(req.session.currentKey, '8', function(moonData){
      res.json(moonData);
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

//objectIndex = 'tower_id'
function getLeaderboard(resultObject, parsedStatData, objectIndex, callback){

  var sortable = [];

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];

    sortable.push([outClaimsObject['player_alias'], parseInt(outClaimsObject[objectIndex], 10)]);
    //console.log(outClaimsObject);
  }

  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  resultObject['timeAxle'] = ['Leaderboard'];

  if(sortable.length >= 3){
    for (var m = 0; m < 3; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]]]);
    };
  }
  else{
    for (var m = 0; m < sortable.length; m++) {
      resultObject['valueAxle'].push([sortable[m][0], [sortable[m][1]]]);
    };
  }

  //console.log(sortable);
  callback(resultObject);
}

function calcMultipleAverageData(resultObject, parsedStatData, objectIndex, keyIndex, avgIncIndex, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var avg = 0;

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

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
      var claimedDay = outClaimsObject[keyIndex].substring(0, 10).replace(/\-/g, '/');
    
      

      if((claimedDay >= firstNewMoonDay) && 
        (claimedDay <= lastNewMoonDay)){
          if(avgIncIndex.length > 0){
            //avg +=  parseFloat(outClaimsObject[avgIncIndex]);
            statObject[outClaimsObject[objectIndex]][0][counter] +=  parseFloat(outClaimsObject[avgIncIndex]);
          }
          else{
            //avg += 1;
            statObject[outClaimsObject[objectIndex]][0][counter] +=  1;
          }
          //statObject[outClaimsObject[objectIndex]][1] += 1;
          sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
      }
      else if(claimedDay > lastNewMoonDay){
       
        var d1 = new Date(lastNewMoonDay);
        var d2 = new Date(firstNewMoonDay);
        
        var daySpan = (Math.abs(d1-d2) / 86400000);
        
        //resultObject['valueAxle'].push((avg / daySpan)); //Float?
        for (var statObjKey in statObject) {
          statObject[statObjKey][0][counter] = (statObject[statObjKey][0][counter] / daySpan);
        };
        //console.log('avgInc: ' + avgInc);
        //console.log('avg: ' + avg);
        //console.log('daySpan: ' + daySpan);
        //console.log('(avg / daySpan): ' + (avg / daySpan));

        //avg = 0;
        counter += 1;

        firstNewMoonDay = lastNewMoonDay;
        if(resultObject['timeAxle'].length > (counter + 1)){
          lastNewMoonDay = resultObject['timeAxle'][counter + 1];

          if((claimedDay >= firstNewMoonDay) && 
            (claimedDay <= lastNewMoonDay)){
            if(avgIncIndex.length > 0){
              //avg +=  parseFloat(outClaimsObject[avgIncIndex]);
              statObject[outClaimsObject[objectIndex]][0][counter] +=  parseFloat(outClaimsObject[avgIncIndex]);
            }
            else{
              //avg += 1;
              statObject[outClaimsObject[objectIndex]][0][counter] +=  1;
            }
            //statObject[outClaimsObject[objectIndex]][1] += 1;
            sortable[statObject[outClaimsObject[objectIndex]][1]][1] += 1;
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

  if(sortable.length >= 3){
    for (var m = 0; m < 3; m++) {
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

function calcMultipleAvgPerDayInMonth(resultObject, parsedStatData, objectIndex, keyIndex, avgIncIndex, callback){

  var statObject = {};
  var sortable = [];

  var sortIndex = 0;
  var counter = 0;
  var avg = 0;
  //var prevDate = '';

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

  if(sortable.length >= 3){
    for (var m = 0; m < 3; m++) {
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

function calcMultipleTotalStats(resultObject, parsedStatData, objectIndex, keyIndex, totIncIndex, resetTot, callback){

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
  sortable.sort(
    function(a, b) {
      return b[1] - a[1]
    }
  );

  if(sortable.length >= 3){
    for (var m = 0; m < 3; m++) {
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
  for(var i = (resultObject['timeAxle'].length - resultObject['valueAxle'][0][1].length); i >= 0; i--){
    resultObject['valueAxle'][0][1].push(0);
  }
  //console.log(resultObject);
  callback(resultObject);
};

function calcAverageData(resultObject, parsedStatData, keyIndex, avgIncIndex, callback){

  resultObject['valueAxle'] = [['_', []]];

  var counter = 0;
  var avg = 0;

  for (var outClaimsKey in parsedStatData) {
    var outClaimsObject = parsedStatData[outClaimsKey];
    if(resultObject['timeAxle'].length > (counter + 1)){

      var firstNewMoonDay = resultObject['timeAxle'][counter];
      var lastNewMoonDay = resultObject['timeAxle'][counter + 1];
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
        
        resultObject['valueAxle'][0][1].push((avg / daySpan)); //Float?

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
  for(var i = (resultObject['timeAxle'].length - resultObject['valueAxle'][0][1].length); i >= 0; i--){
    resultObject['valueAxle'][0][1].push(0);
  }

  callback(resultObject);
};

function getGraphMultipleObjectsData(timeframeSelector, resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, callback){


  if(timeframeSelector ===  TimeFrame.PerDay){
    calcMultipleAverageData(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerDayInMonth){
    calcMultipleAvgPerDayInMonth(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, function(averageData){
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerMoon){
    calcMultipleTotalStats(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, true, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.AllTime){
    calcMultipleTotalStats(resultObject, filteredData, objectIndex, avgTimeIndex, avgIncIndex, false, function(totData){
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
      callback(averageData);
    });
  }
  else if(timeframeSelector ===  TimeFrame.PerMoon){
    calcTotalStats(resultObject, filteredData, avgTimeIndex, avgIncIndex, true, function(averageData){
      for (var i = 0; i < (resultObject['timeAxle'].length - 1); i++) {
        resultObject['timeAxle'][i] = resultObject['timeAxle'][i].substring(2, 10) + '-' + resultObject['timeAxle'][i + 1].substring(2, 10);
      };
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
        callback(totData);
    });
  }
  else{
    callback(null);
  }
}

function getGraph(groupBy, timeframeSelector, resultObject, filteredData, avgTimeIndex, avgIncIndex, callback){
  if(groupBy === GroupByValue.Overall){
    getGraphSingleObjectData(timeframeSelector, resultObject, filteredData, avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    });
  }
  else if(groupBy === GroupByValue.Tower){
    getGraphMultipleObjectsData(timeframeSelector, resultObject, filteredData, 'tower_id', avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    });
  }
  else{
    getGraphMultipleObjectsData(timeframeSelector, resultObject, filteredData, 'formatted_address', avgTimeIndex, avgIncIndex, function(graphData){
        callback(graphData);
    })
  }
}

exports.setKey = function(req, res){
  var reqApiKey = req.body.myApiKey;

  if(typeof reqApiKey !== 'undefined'){
    req.session.currentKey = reqApiKey;

    console.log(req.session.currentKey);
    getJSON(req.session.currentKey, '8', function(moonData){
      res.json(moonData);
    });
  }
  else{
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
  //console.log('groupBy: ' + groupBy);
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
          //console.log(outObject['iso8601']);
          resultObject['timeAxle'].push(currDate);
        }
      } 
      getJSON(req.session.currentKey, reqSelectedItem, function(statData){
        var parsedStatData = JSON.parse(statData);
        if(presetSelector === GraphValue.NumberOfBuiltTowers){
          getJSON(req.session.currentKey, '1', function(playerData){
            var parsedPlayerData = JSON.parse(playerData);

            filterJSON(parsedStatData, parsedPlayerData["playerId"],'player_id', function(filteredData){

              getGraphSingleObjectData(timeframeSelector, resultObject, filteredData, 'created_on', '', function(graphData){
                res.json(JSON.stringify(graphData));
              });
          
            });
          });
        }
        else if(presetSelector === GraphValue.AmountOfGeldCollected){
          getGraph(groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', 'geld_collected', function(graphData){
            res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.AmountOfBonusCollected){
          getGraph(groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', 'geld_bonus', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.NumberOfClaimedTowers){
          getGraph(groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.PopularLocations){
          getGraph(groupBy, timeframeSelector, resultObject, parsedStatData, 'claimed_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }  
        else if(presetSelector === GraphValue.NumberOfBuiltTowersAllPlayers){
          getGraph(groupBy, timeframeSelector, resultObject, parsedStatData, 'created_on', '', function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostClaims){
          getLeaderboard(resultObject, parsedStatData, 'claim_count',  function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostGeldCollected){
          getLeaderboard(resultObject, parsedStatData, 'geld_collected',  function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.MostBuiltTowers){
          getLeaderboard(resultObject, parsedStatData, 'count',  function(graphData){
              res.json(JSON.stringify(graphData));
          });
        }
        else if(presetSelector === GraphValue.HighestGeldBonus){
          getLeaderboard(resultObject, parsedStatData, 'geld_bonus',  function(graphData){
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

exports.updateTable = function(req, res){
  var reqApiKey = req.body.myApiKey;
  var reqSelectedItem = req.body.myKeySelector;

  if(typeof reqApiKey !== 'undefined'){
    req.session.currentKey = reqApiKey;
    //console.log("Test");
  }

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
        //console.log(data);
        if(data.length > 0){
          /*
          var obj = data;
          for (var key in obj){
              var attrName = key;
              var attrValue = obj[key];
          }
          */
          res.json(body);
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

