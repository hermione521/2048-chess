var WebsocketServer = require('ws').Server,
	express = require('express'),
	winston = require('winston'),
	uuid = require('node-uuid'),
	GameLobby = require('./GameLobby'),
	redis = require("redis"),
	client = redis.createClient(),
	url = require('url'),
	gamersHashMap = {},
	gamesBeingPlayed = 0,
	gameStats = JSON.stringify({numPlayers: 0, numGames: 0}),
	channelHashMap = {},
	channelId,
	startLocations;

var app = express();

var CROSS_ORIGIN_HEADERS = {};
CROSS_ORIGIN_HEADERS['Content-Type'] = 'text/plain';
CROSS_ORIGIN_HEADERS['Access-Control-Allow-Origin'] = '*';
CROSS_ORIGIN_HEADERS['Access-Control-Allow-Headers'] = 'X-Requested-With';

var GRID_SIZE = 4;

app.configure(function (){
	app.use(express.static(__dirname + "/public"));
	app.set('views', __dirname);
	app.set('view engine', 'ejs');
});
app.get('/*', function (req, res){
	//res.render('index', { layout: false });
	if (url.parse(req.url).pathname === '/game/players'){
		res.writeHead(200, CROSS_ORIGIN_HEADERS);
		res.write(gameStats);
		res.end();
	}
	else{
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end('Go away <3');
	}
});
app.listen(8080);

/*
 * called when a game closed.
 */
var cleanup = function (channelId){
	if (channelHashMap[channelId]){
		winston.info('===Game Cleanup===');
		winston.info('channelId:', channelId);
		winston.info('channelHashMap[channelId].gamer1.id:', channelHashMap[channelId].gamer1.id);
		winston.info('channelHashMap[channelId].gamer2.id:', channelHashMap[channelId].gamer2.id);
		gamersHashMap[channelHashMap[channelId].gamer1.id] = void 0;
		gamersHashMap[channelHashMap[channelId].gamer2.id] = void 0;
		channelHashMap[channelId] = void 0;
		gamesBeingPlayed--;
	}
};

/*
 * Calculate initial tiles' position
 */
var startCellLocations = function (numLocations, size){
	var unique = function (arr, obj){
		for (var i = 0, len = arr.length; i < len; i++){
			if (arr[i].x === obj.x && arr[i].y === obj.y) 
			return false;
		}
	return true;
	};

	var getRandomInt = function (min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}  
  
	var loc = [];
	for (var i = 0; i < numLocations; i++){
		var obj = {x: getRandomInt(0, size - 1), y: getRandomInt(0, size - 1), value: (Math.random() < 0.9 ? 2 : 4)};
		if (unique(loc, obj)) loc.push(obj);
		else --i;
	}
	return loc;
};


/*
 * log information of players and games
 */
setInterval(function (){
	client.llen('gamers', function(err, listSize){
    if (err) winston.log('err', err);
    winston.info('Number of current players: ' + (listSize + gamesBeingPlayed * 2));
    winston.info('Number of current games: ' + gamesBeingPlayed);
    gameStats = JSON.stringify({numPlayers: (listSize + gamesBeingPlayed * 2), numGames: gamesBeingPlayed});
  });
}, 1000);

/*
 * Test code
 * TODO: onMessage instead of polling
 */
setInterval(function () {
  client.llen('gamers', function (err, len) {
    if (err) winston.log('err', err);
    winston.info('len:', len);
    if (len >= 2) {
      client.lpop('gamers', function (err1, gamer1) {
        if (err1) winston.log('err', err1);
        client.lpop('gamers', function (err2, gamer2) {
          if (err2) winston.log('err', err2);
          winston.info('===New Game===');
          winston.info('channelId:',  channelId);
          winston.info('gamer1:', gamer1);
          winston.info('gamer2:', gamer2);
          channelId = uuid.v4();
          startLocations = startCellLocations (2, GRID_SIZE);
          gamesBeingPlayed++;
          channelHashMap[channelId] = new GameLobby (channelId, gamersHashMap[gamer1], gamersHashMap[gamer2], startLocations, GRID_SIZE, cleanup);
        });
      });
    }
  })
}, 500);

var wsServer = new WebsocketServer({
	port: 18080,
	server: app
});

/*
 * change: ws.id -> wsId=uuid.v4(), cuz there's no id in websocket
 * TODO: maybe there's sth in websocket instead?
 */
wsServer.on('connection', function (ws){
	//record gamer's id
	var wsId = uuid.v4();
	ws.id = wsId;
	client.lpush('gamers', wsId);

	//remove gamer
	ws.on('close', function (){
		client.lrem('gamers', 0, wsId, function (err, count){
			if (err) winston.log('err', err);
			winston.info('Removed gamer from waiting queue');
		});
	});
	gamersHashMap[wsId] = ws;

	ws.on('message', function(data, flag){
		winston.info('message called in wsServer, data: ' + data);
	});
})
