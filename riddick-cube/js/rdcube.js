/*global jQuery, sfx */
(function (w, doc, $, undefined) {
	'use strict';

	var sideBaseClass = 'side';
	var opposite = {
		left: 'right',
		right: 'left',
		top: 'bottom',
		bottom: 'top',
		front: 'back',
		back: 'front'
	};

	/**
	 * Cube side.
	 */
	function Side(cubesPerSide, cubeletSize, options) {
		options = $.extend({}, Side.defaults, options);
		var self = this;

		self.origin = options.origin;
		self.element = doc.createElement('div');
		self.cubelets = [];
		self.rows = [];
		self.cols = [];
		self.cursor = {
			x: options.padding,
			y: options.padding
		};

		/**
		 * Write text to a current cursor position.
		 *
		 * @param  {String} text
		 * @param  {String} align
		 *
		 * @return {Array} Array of affected cubelets.
		 */
		function write(text, align) {
			switch (align) {
				case 'left':
					self.cursor.x = options.padding;
					break;
				case 'right':
					self.cursor.x = cubesPerSide - options.padding - text.length;
					break;
				case 'center':
					self.cursor.x = Math.floor((cubesPerSide - text.length) / 2);
					break;
			}
			var affected = [];
			for (var l = 0; l < text.length; l++) {
				affected.push(self.rows[self.cursor.y][self.cursor.x]);
				if (text[l]) {
					self.rows[self.cursor.y][self.cursor.x].appendChild(document.createTextNode(text[l]));
				}
				self.cursor.x++;
			}
			return affected;
		}

		/**
		 * Adds a title to the center of a current line.
		 *
		 * @param {String} title
		 *
		 * @return {Object} Side
		 */
		self.addTitle = function (title) {
			write(title, 'center');
			self.newLine(2);
			return self;
		};

		/**
		 * Add text to side. Starts at current cursor position.
		 *
		 * @param {String} text
		 *
		 * @return {Object} Side
		 */
		self.addText = function (text) {
			var words = text.split(' ');
			for (var w = 0; w < words.length; w++) {
				// Switch to a new line
				if (self.cursor.x + words[w].length > cubesPerSide - options.padding) {
					self.newLine();
				}
				// Write a word
				write(words[w]);
				// Space between words
				if (w < words.length - 1 && self.cursor.x < cubesPerSide - options.padding) {
					self.cursor.x++;
				}
			}
			return self;
		};

		/**
		 * Adds a link to the current cursor position.
		 *
		 * @param {String} target Link target. Can be URL, or #! prefixed name of other side.
		 * @param {String} title  Link title.
		 * @param {String} align  Whether to align link somehow. Can be: center, right. Default is left.
		 *
		 * @return {Object} Side
		 */
		self.addLink = function (target, title, align) {
			title = title || target;
			// Switch to a new line if link won't fit on current one
			if (self.cursor.x > cubesPerSide - options.padding - title.length) {
				self.newLine();
			}
			// Write link
			var affected = write(title, align);
			$('<a href="' + target + '" target="_blank">').append(affected).insertAfter(self.rows[self.cursor.y][self.cursor.x - title.length - 1]);
			return self;
		};

		/**
		 * Shift cursor one or multiple lines down.
		 *
		 * @param  {Integer} count Number of lines. Default is 1.
		 *
		 * @return {Object} Side
		 */
		self.newLine = function (count) {
			self.cursor.y += count || 1;
			self.cursor.x = options.padding;
			return self;
		};

		/**
		 * Move side to a specific position.
		 *
		 * @param  {String}  newPos    New position name. Can be: front, left, right, top, bottom, back.
		 * @param  {Boolean} immediate True to position immediately without transition.
		 *
		 * @return {Object} Side
		 */
		self.to = function (newPos, immediate) {
			self.element.className = sideBaseClass + (immediate ? '' : ' transition') + ' ' + newPos;
			// Pop cubelets while transitioning
			if (!immediate && newPos === 'front') {
				sfx.move.play();
				self.popCubelets();
			}
			return self;
		};

		/**
		 * Pops random cubelets.
		 *
		 * @return {Object} Side
		 */
		self.popCubelets = function (chance) {
			chance = chance || 0.1;
			sfx.popping.play();
			for (var y = 0, yl = self.cols.length; y < yl; y++) {
				for (var x = 0, xl = self.cols[y].length; x < xl; x++) {
					// if (self.cols[y][x].innerText) {
					if (Math.random() < chance) {
						popCubelet(x, y);
					}
				}
			}
			return self;
		};

		/**
		 * Pops a cubelet while transitioning.
		 *
		 * @param  {Integer} x Cubelet row index.
		 * @param  {Integer} y Cubelet column index.
		 *
		 * @return {Void}
		 */
		function popCubelet(x, y) {
			var offset = Math.random() * 1000 ;
			// var offset = y / cubesPerSide * 800 + 300;
			setTimeout(function () {
				self.cols[y][x].className = 'cubelet pop';
			}, offset);

			setTimeout(function () {
				self.cols[y][x].className = 'cubelet';
			}, offset + options.popDuration);
		}

		/**
		 * Hide side.
		 *
		 * @return {Object} Side
		 */
		self.hide = function () {
			self.element.style.display = 'none';
			return self;
		};

		/**
		 * Show side.
		 *
		 * @return {Object} Side
		 */
		self.show = function () {
			self.element.style.display = 'block';
			return self;
		};

		/* Construct */
		(function () {
			// Add base class
			self.element.className = sideBaseClass;

			// Generate cubelets
			var cubelet;
			for (var y = 0; y < cubesPerSide; y++) {
				if (!self.rows[y]) {
					self.rows[y] = [];
				}

				for (var x = 0; x < cubesPerSide; x++) {
					if (!self.cols[x]) {
						self.cols[x] = [];
					}

					cubelet = $(
						'<span class="cubelet">' +
							'<span class="wall top"></span>' +
							'<span class="wall right"></span>' +
							'<span class="wall bottom"></span>' +
							'<span class="wall left"></span>' +
						'</span>'
					).css({
						top: (y * cubeletSize) + 'px',
						left: (x * cubeletSize) + 'px',
						backgroundPosition: (x * -cubeletSize) + 'px ' + (y * -cubeletSize) + 'px'
					})[0];

					self.cubelets.push(cubelet);
					self.rows[y].push(cubelet);
					self.cols[x].push(cubelet);
				}
			}
			$(self.element).append(self.cubelets);
		}());
	}

	/**
	 * RDCube.
	 *
	 * @param {Element} frame        Frame element.
	 * @param {Integer} cubesPerSide Cubes count per side.
	 * @param {Object}  options      RDCube options.
	 */
	function RDCube(frame, cubesPerSide, options) {
		options = $.extend({}, RDCube.defaults, options);

		var self = this;
		var $frame = $(frame);
		var sideSize = $frame.outerWidth();
		var cubeletSize = Math.round(sideSize / cubesPerSide);

		self.frame = frame = $frame[0];
		self.sides = {};
		self.index = '';
		self.active = '';
		self.leaving = '';
		self.locked = false;
		self.history = [];

		/**
		 * Add new side to a cube.
		 *
		 * @param {String}  name    Side name.
		 * @param {Origin}  origin  Side origin point. Can be: left, right, top, bottom.
		 * @param {Boolean} isIndex Whether this side is the index side (side that should be displayed on load).
		 *
		 * @return {Object} RDCube
		 */
		self.addSide = function (name, origin, isIndex) {
			var sideOptions = $.extend({}, options);
			if (typeof origin === 'string') {
				sideOptions.origin = origin;
			} else {
				isIndex = origin;
			}
			var side = self.sides[name] = new Side(cubesPerSide, cubeletSize, sideOptions);

			if (isIndex && !self.index) {
				self.index = self.active = name;
				side.to('front', 1);
			}

			frame.appendChild(side.element);

			if (name !== self.index) {
				side.hide();
			}

			return side;
		};

		/**
		 * Return side object.
		 *
		 * @param  {String} name Side name.
		 *
		 * @return {Object} Side
		 */
		self.side = function (name) {
			return self.sides[name];
		};

		/**
		 * Transition end handler.
		 *
		 * @return {Void}
		 */
		function transitionEnd() {
			self.locked = false;
			$(self.sides[self.leaving].element).hide();
		}

		/**
		 * Activate a side.
		 *
		 * Animates current side out, and moves request side to front.
		 *
		 * @param  {String} name    Name of a side to activate.
		 * @param  {String} origin  Force to animate from this origin. Can be: left, right, top, bottom.
		 *
		 * @return {Object} RDCube
		 */
		self.activate = function (name, origin, forget) {
			if (self.locked || name === self.active) {
				return self;
			}
			origin = origin || self.sides[name].origin;
			self.locked = true;
			// Add navigation step into history
			if (!forget) {
				self.history.push(self.active);
			}
			// Set new side states
			self.leaving = self.active;
			self.active = name;
			// Trigger onActive callback
			if (typeof options.onActive === 'function') {
				options.onActive.call(self);
			}
			// Position new side to origin, and show it
			self.sides[name].to(origin, 1).show();
			// Delay the transition so the browser will have time to render just showed side
			// Without this there is a noticeable gap between sides while in transition
			setTimeout(function () {
				self.sides[name].to('front');
				self.sides[self.leaving].to(opposite[origin]);
				setTimeout(transitionEnd, options.moveDuration);
			}, 30);
			return self;
		};

		/**
		 * Go back in navigation.
		 *
		 * @return {Object} RDCube
		 */
		self.back = function () {
			if (self.history.length > 0) {
				self.activate(self.history.pop(), opposite[self.sides[self.active].origin], 1);
			}
			return self;
		};

		/**
		 * Go to index, and flush the history.
		 *
		 * @return {Object} RDCube
		 */
		self.home = function () {
			self.history.length = 0;
			self.activate(self.index, opposite[self.sides[self.active].origin], 1);
			return self;
		};

		/* Construct */
		(function() {
			// Bind cube navigation links
			$frame.on('click mouseup', 'a[href^="#!"]', function (event) {
				if (event.type === 'mouseup') {
					var name = $(this).attr('href').substr(2);
					self.activate(name);
				}
				return false;
			});
		}());
	}

	// Defaults
	RDCube.defaults = {
		padding: 1,
		origin: 'right',
		moveDuration: 700,
		popDuration: 100
	};

	// Expose globally
	w.RDCube = RDCube;
}(window, document, jQuery));