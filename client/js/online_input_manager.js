/*
 * this manager only handle data received
 * including moves of self and opponent
 */

function OnlineInputManager() {
  this.events = {};
  this.listen();
}

OnlineInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

OnlineInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

OnlineInputManager.prototype.listen = function () {
  var self = this;
  window._io.addListener(function (msg) {
    self.emit("move", msg);
  });
};

OnlineInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};
