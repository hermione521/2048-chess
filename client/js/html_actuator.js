function HTMLActuator() {
  this.tileContainer    = document.getElementsByClassName("tile-container")[0];
  this.myScoreContainer   = document.getElementsByClassName("my-score-container")[0];
  this.opScoreContainer   = document.getElementsByClassName("op-score-container")[0];
  this.messageContainer = document.getElementsByClassName("game-message")[0];

  this.myScore = 0;
  this.opScore = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;
  console.log('=== ACTUATE ===');
  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);
    console.log("here!!!");
    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.myScore, metadata.opScore);

    console.log('metadata:', metadata);
    if (metadata.over && metadata.won) self.message(true); // You win!
    if (metadata.over && !metadata.won) self.message(false); // You lose
    
  });
};

HTMLActuator.prototype.restart = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var element   = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];
  this.applyClasses(element, classes);

  element.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(element, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(element, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(element, classes);
  }

  // Put the tile on the board
  this.tileContainer.appendChild(element);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (myScore, opScore) {
  this.clearContainer(this.myScoreContainer);

  var myDifference = myScore - this.myScore;
  this.myScore = myScore;

  this.myScoreContainer.textContent = this.myScore;

  if (myDifference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + myDifference;

    this.myScoreContainer.appendChild(addition);
  }


  this.clearContainer(this.opScoreContainer);

  var opDifference = opScore - this.opScore;
  this.opScore = opScore;

  this.opScoreContainer.textContent = this.opScore;

  if (opDifference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + opDifference;

    this.opScoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "Winner!" : "Loser!"

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won", "game-over");
};