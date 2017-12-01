// INIT VARS

var DOT_RADIUS = 6;
var DOT_DIAMETER = DOT_RADIUS * 2;
var DOT_SPACING = 45;
var GRID_PADDING = DOT_SPACING / 2;
var MOUSE_DISTANCE = 15;

// GLOBAL VARS

let dotArray = [];
let squaresArray = [];
let linksArray = [];
let origin = null;
let dotCount = 0;
let colours = { p1: null, p2: null };
let turn = 'p1';
let scores = { p1: 0, p2: 0 };

// CLASSES

function Dot(x, y, radius, gx, gy) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.gx = gx;
  this.gy = gy;

  this.draw = function() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    c.fillStyle = 'white';
    c.fill();
  }

  this.update = function() {
    // expand on hover
    if ((mouse.x - this.x < MOUSE_DISTANCE && mouse.x - this.x > -MOUSE_DISTANCE &&
        mouse.y - this.y < MOUSE_DISTANCE && mouse.y - this.y > -MOUSE_DISTANCE) ||
        origin === this) {
      this.radius = DOT_RADIUS * 1.5;
    } else {
      this.radius = DOT_RADIUS;
    }

    // handle click
    if (click.x < this.x + this.radius && click.x > this.x - this.radius &&
        click.y < this.y + this.radius && click.y > this.y - this.radius) {
      if (origin) {
        if (checkValidMove(this)) {
          createLink(this);
        } else {
          origin = null;
        }
      } else {
        origin = this;
      }

      click.x = undefined;
      click.y = undefined;
    }

    this.draw();
  }
}

function Link(start, end) {
	// always record links left-right or top-bottom
	if (start.gy === end.gy) { // if horizontal move
		if (start.gx < end.gx) {
			this.start = start;
			this.end = end;
		} else {
			this.start = end;
			this.end = start;
		}
	} else { // if vertical move
		if (start.gy < end.gy) {
			this.start = start;
			this.end = end;
		} else {
			this.start = end;
			this.end = start;
		}
	}

  this.draw = function() {
    c.beginPath();
    c.lineWidth = 5;
    c.moveTo(this.start.x, this.start.y);
    c.lineTo(this.end.x, this.end.y);
    c.strokeStyle = '#aaa';
    c.stroke();
  }
}

function Square(startX, startY, endX, endY, colour) {
	this.sX = startX;
	this.sY = startY;
	this.eX = endX;
	this.eY = endY;
	this.colour = colour;

	updateScores();

	this.draw = function() {
		c.fillStyle = this.colour;
		c.fillRect(this.sX, this.sY, this.eX, this.eY);
	}
}

// LINK HANDLING

function renderActiveLink() {
  c.beginPath();
  c.lineWidth = 5;
  c.shadowBlur = 0;
  c.moveTo(origin.x, origin.y);
  c.lineTo(mouse.x, mouse.y);
  c.strokeStyle = '#aaa';
  c.stroke();
}

function checkValidMove(target) {
	// check this move hasn't already been made
	if (linksArray.find(link =>
		(origin.gx === link.start.gx && origin.gy === link.start.gy
		&& target.gx === link.end.gx && target.gy === link.end.gy) ||
		(origin.gx === link.end.gx && origin.gy === link.end.gy
		&& target.gx === link.start.gx && target.gy === link.start.gy)
	)) return false;

	console.log(linksArray.find(link =>
		origin.gx === link.start.gx && origin.gy === link.start.gy
		&& target.gx === link.end.gx && target.gy === link.end.gy
	));

	// only allow moves to adjacent, non-diagonal points
	if (((origin.gx === target.gx - 1 || origin.gx === target.gx + 1) && origin.gy === target.gy) || // x-move
		  ((origin.gy === target.gy - 1 || origin.gy === target.gy + 1) && origin.gx === target.gx)) { // y-move
		return true;
	}

	return false;
}

function createLink(target) {
	var newLink = new Link(origin, target);
  linksArray.push(newLink);

	let squareCount = squaresArray.length;
	checkForSquare(newLink);
  origin = null;

	// only change player turn if new square wasn't added
	if (squareCount === squaresArray.length) {
		turn = turn === 'p1' ? 'p2' : 'p1';
		document.querySelector('#turn').classList.toggle('p2-turn');
	}
}

// SQUARE HANDLING

function checkForSquare(link) {
	// horizontal move
	if (link.start.gy === link.end.gy) {
		// check for square above
		if (link.start.gy !== 0) {
			const upperLeft = linksArray.find(l => l.start.gy === link.start.gy - 1 && l.end.gy === link.start.gy && l.start.gx === link.start.gx);
			const upperTop = linksArray.find(l => l.start.gx === link.start.gx && l.end.gx === link.end.gx && l.start.gy === link.start.gy - 1);
			const upperRight = linksArray.find(l => l.start.gy === link.start.gy - 1 && l.end.gy === link.start.gy && l.start.gx === link.end.gx);

			if (upperLeft && upperTop && upperRight) {
				squaresArray.push(new Square(upperTop.start.x, upperTop.start.y, DOT_SPACING, DOT_SPACING, colours[turn]));
			}
		}

		// check for square below
		if (link.start.gy !== dotCount - 1) {
			const lowerLeft = linksArray.find(l => l.start.gy === link.start.gy && l.end.gy === link.start.gy + 1 && l.start.gx === link.start.gx);
			const lowerBottom = linksArray.find(l => l.start.gx === link.start.gx && l.end.gx === link.end.gx && l.start.gy === link.start.gy + 1);
			const lowerRight = linksArray.find(l => l.start.gy === link.end.gy && l.end.gy === link.end.gy + 1 && l.start.gx === link.end.gx);

			if (lowerLeft && lowerBottom && lowerRight) {
				squaresArray.push(new Square(lowerLeft.start.x, lowerLeft.start.y, DOT_SPACING, DOT_SPACING, colours[turn]));
			}
		}
	}
	// vertical move
	else {
		// check for square to left
		if (link.start.gx !== 0) {
			const leftTop = linksArray.find(l => l.start.gx === link.start.gx - 1 && l.end.gx === link.start.gx && l.start.gy === link.start.gy);
			const leftLeft = linksArray.find(l => l.start.gy === link.start.gy && l.end.gy === link.end.gy && l.start.gx === link.start.gx - 1);
			const leftBottom = linksArray.find(l => l.start.gx === link.end.gx - 1 && l.end.gx === link.end.gx && l.start.gy === link.end.gy);

			if (leftTop && leftLeft && leftBottom) {
				squaresArray.push(new Square(leftTop.start.x, leftTop.start.y, DOT_SPACING, DOT_SPACING, colours[turn]));
			}
		}

		// check for square to right
		if (link.start.gx !== 0) {
			const rightTop = linksArray.find(l => l.start.gx === link.start.gx && l.end.gx === link.start.gx + 1 && l.start.gy === link.start.gy);
			const rightRight = linksArray.find(l => l.start.gy === link.start.gy && l.end.gy === link.end.gy && l.start.gx === link.start.gx + 1);
			const rightBottom = linksArray.find(l => l.start.gx === link.end.gx && l.end.gx === link.end.gx + 1 && l.start.gy === link.end.gy);

			if (rightTop && rightRight && rightBottom) {
				squaresArray.push(new Square(rightTop.start.x, rightTop.start.y, DOT_SPACING, DOT_SPACING, colours[turn]));
			}
		}
	}
}

// TRACK MOUSE

var mouse = {
  x: undefined,
  y: undefined
};

window.addEventListener('mousemove', function(e) {
  var rect = canvas.getBoundingClientRect();

  mouse.x = e.x - rect.left;
  mouse.y = e.y - rect.top;
});

// TRACK CLICKS

var click = {
  x: undefined,
  y: undefined
};

window.addEventListener('mousedown', function(e) {
  var rect = canvas.getBoundingClientRect();

  click.x = e.x - rect.left;
  click.y = e.y - rect.top;
});

// INITIALISE CANVAS

var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');
init();

function init() {
  dotCount = document.querySelector('#gridSize').value;
	colours.p1 = document.querySelector('#p1Colour').value;
	colours.p2 = document.querySelector('#p2Colour').value;

  var size = GRID_PADDING * 2 // grid padding
    + ((DOT_RADIUS * 2) * dotCount) // dot size
    + ((DOT_SPACING - DOT_DIAMETER) * (dotCount - 1)); // dot spacing

  canvas.width = size;
  canvas.height = size;

	squaresArray = [];
	linksArray = [];
	dotArray = [];
  drawDots(dotCount);

  animate();
}

function drawDots(dotCount) {
  for (var i = 0; i < dotCount; i++) {
    for (var j = 0; j < dotCount; j++) {
      dotArray.push(new Dot(
				i * DOT_SPACING + (GRID_PADDING + DOT_RADIUS),
        j * DOT_SPACING + (GRID_PADDING + DOT_RADIUS),
        DOT_RADIUS, i, j)
			);
    }
  }
}

// UPDATE CANVAS

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);

	for (var i = 0; i < squaresArray.length; i++) {
		squaresArray[i].draw();
	}

	for (var i = 0; i < linksArray.length; i++) {
		linksArray[i].draw();
	}

	if (origin) {
		renderActiveLink();
	}

	for (var i = 0; i < dotArray.length; i++) {
    dotArray[i].update();
  }

}

function changeSquareColour(e, player) {
	const oldColour = colours[`p${player}`];
	const newColour = e.target.value;

	playerSquares = squaresArray.filter(square => square.colour === oldColour);
	playerSquares.forEach(square => square.colour = newColour);

	colours[`p${player}`] = newColour;
}

function updateScores() {
	scores[turn] = scores[turn] + 1;
	document.querySelector(`#${turn}Score`).innerHTML = scores[turn];
}

// EVENT LISTENERS

document.querySelector('#gridSize').addEventListener('change', function() {
  init();
});

document.querySelector('#p1Colour').addEventListener('change', function(e) {
	changeSquareColour(e, 1);
});

document.querySelector('#p2Colour').addEventListener('change', function(e) {
	changeSquareColour(e, 2);
});
