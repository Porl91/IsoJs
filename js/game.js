
function Exception(message) {
  this.value = message;

  this.toString = function() {
    return this.value;
  }
}

var Game = function(configExt) {
  var self = this;
  var config = {};
  var canvas, context;
  var tileTypeFactory = new TileTypeFactory();

  self.Camera = new Camera(0, 0);

  self.Initialise = function() {
    if(configExt !== undefined) {
      self.GetConfigOption('canvasId', 'scene');
      self.GetConfigOption('fps', 24);
      self.GetConfigOption('sprites');
      self.GetConfigOption('map');
    }

    self.InitialiseCanvas();
    self.ResizeCanvas(window.innerWidth, window.innerHeight);
  }

  self.GetConfigOption = function(optionId, defaultValue) {
    if(configExt[optionId] !== undefined) {
      config[optionId] = configExt[optionId];
    } else {
      config[optionId] = defaultValue;
    }
  }

  self.InitialiseCanvas = function() {
    canvas = document.getElementById(config.canvasId);
    if(canvas === null)
      throw new Exception('[Game.InitialiseCanvas] Canvas element with ID ' + config.canvasId + ' does not exist.');

    context = canvas.getContext("2d");
  }

  self.ResizeCanvas = function(width, height) {
    canvas.width = width;
    canvas.height = height;
  }

  self.Start = function() {
    if(config.fps === undefined)
      throw new Exception('[Game.Start] No FPS could be inferred.');
    if(config.sprites === undefined)
      throw new Exception('[Game.Start] A spritesheet image must be provided through the `sprites` config option.');
    if(config.map === undefined)
      throw new Exception('[Game.Start] A Map object must be provided through the `map` config option.');

    var msBetweenUpdates = 1000.0 / config.fps;

    self.LoopIteration();
    setInterval(self.LoopIteration, msBetweenUpdates);
  }

  self.LoopIteration = function() {
    self.Update();
    self.Render();
  }

  self.Update = function() {
  }

  self.Render = function() {
    var viewportWidth = 1000;
    var viewportHeight = 500;
    var tileWidth = 64;
    var tileHeight = 32;
    var tilesInWidth = Math.floor(viewportWidth / tileWidth);
    var tilesInHeight = Math.floor(viewportHeight / tileHeight * 2.0);
    var halfTileWidth = tileWidth / 2.0;

    context.fillStyle = "#fff";
    context.fillRect(0, 0, viewportWidth, viewportHeight);

    for(var y = 0; y < tilesInHeight; y++) {
      for(var x = 0; x < tilesInWidth; x++) {
        var xScreen = x * tileWidth - ((y & 1) == 1 ? halfTileWidth : 0);
        var yScreen = y * tileHeight / 2.0;
        var xMap = Math.floor(x + y * 0.5);
        var yMap = -Math.floor(x - y * 0.5);
        var tileTypeId = config.map.GetTileTypeId(xMap, yMap);
        tileTypeFactory.GetTileType(tileTypeId).Render(context, config.sprites, xScreen, yScreen);
      }
    }
  }

  self.Initialise();
}

var Camera = function(xPosition, yPosition) {
  var self = this;

  self.X = xPosition;
  self.Y = yPosition;

  self.Move = function(xDelta, yDelta) {
    self.X += xDelta;
    self.Y += yDelta;
  }
}

var Map = function(width, height) {
  var self = this;

  self.Width = width;
  self.Height = height;
  self.Map = [];

  self.Initialise = function() {
    for(var i = 0; i < width * height; i++) {
      self.Map[i] = Math.random() > 0.8 ? 'grass' : 'grass';
    }
  }

  self.GetTileTypeId = function(xMap, yMap) {
    if(xMap < 0 || yMap < 0 || xMap >= self.Width || yMap >= self.Height)
      return 'water';

    return self.Map[yMap * self.Width + xMap];
  }

  self.Initialise();
}

var TileType = function(id, xSprite, ySprite, spriteWidth, spriteHeight) {
  var self = this;

  self.Id = id;

  var xSprite, ySprite;
  var spriteWidth, spriteHeight;

  self.Render = function(context, image, xPosition, yPosition) {
    context.drawImage(image,
      xSprite, ySprite, spriteWidth, spriteHeight,
      xPosition, yPosition, spriteWidth, spriteHeight);
  }
}

var TileTypeFactory = function() {
  var self = this;
  var tileTypes = [];

  self.InitialiseTileTypes = function() {
    self.AddTileType(new TileType("grass", 0, 0, 64, 32));
    self.AddTileType(new TileType("water", 64, 0, 64, 32));
  }

  self.AddTileType = function(tileType) {
    if(tileTypes[tileType.Id] !== undefined)
      throw new Exception('[TileTypeFactory.AddTileType] Duplicate tile type ID found: ' + tileType.Id);

    tileTypes[tileType.Id] = tileType;
  }

  self.GetTileType = function(id) {
    if(tileTypes[id] === undefined)
      throw new Exception('[TileTypeFactory.GetTileType] Invalid tile type ID provided: ' + id);

    return tileTypes[id];
  }

  self.InitialiseTileTypes();
}

var spriteImage = new Image();
spriteImage.src = "images/sprites.png";
spriteImage.onload = function() {
  var game = new Game({
    canvasId: 'scene',
    fps: 24,
    sprites: spriteImage,
    map: new Map(2, 15)
  });
  game.Start();

  window.onresize = function() {
    game.ResizeCanvas(window.innerWidth, window.innerHeight);
  }

  window.onkeydown = function(e) {
    switch(e.which) {
      case 87:
        game.Camera.Move(0, -5);
        break;
      case 83:
        game.Camera.Move(0, 5);
        break;
      case 65:
        game.Camera.Move(-5, 0);
        break;
      case 63:
        game.Camera.Move(5, 0);
        break;
    }
  }
}
