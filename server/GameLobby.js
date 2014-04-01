'use strict';

var winston = require('winston');


/* 
	GameLobby constructs a new game lobby
	id - uuid of game loby
	gamer1 -  a SockJS connection instance of a gamer 
	gamer2 - a connection instance of a gamer
*/
function GameLobby (id, gamer1, gamer2, startCells, size, cleanup) {
	this.id = id;
	this.gamer1 = gamer1;
	this.gamer2 = gamer2;
	this.startCells = startCells;
	this.size = size;
	this.cleanup = cleanup;

	this.nowGamer = gamer1;

	this.setup(gamer1, 1);
	this.setup(gamer2, 2);
}

GameLobby.prototype.setup = function(gamer, playerNum) {
	var self = this;
	gamer.send(JSON.stringify({player: playerNum, startCells: this.startCells, size: this.size, start: true}));
	
	gamer.on('message', function(data, flag) {
		winston.info('message called in GameLobby, data: ' + data);
		winston.info('onMessage gamer = ' + gamer.id);

		if (data.indexOf("move") == -1){
			self.emit(data);
			return;
		}

		if (self.nowGamer === gamer) {
			winston.info("[before] nowGamer = " + self.nowGamer);
			self.emit(data);
			if (self.nowGamer === self.gamer1){
				self.nowGamer = self.gamer2;
			}
			else{
				self.nowGamer = self.gamer1;
			}
			winston.info("[after] nowGamer = " + self.nowGamer);
		}
		else{
			winston.info('unexpected move, nothing should happen...')
		}
	});
	gamer.on('close', function() {
		//gamer.send(JSON.stringify({player: 0, dead: true}));
		self.gamer1.close();
		self.gamer2.close();
		self.cleanup(self.id);
	});
};

GameLobby.prototype.emit = function(msg) {
	this.gamer1.send(msg);
	this.gamer2.send(msg);
	if (msg.gameEnd) {
		this.gamer1.close();
		this.gamer2.close();
		this.cleanup(this.id);
	}
};

module.exports = GameLobby;