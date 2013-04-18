/*global RDCube, Howler, Howl, Motio, sfx */
(function (w, doc, $, undefined) {
	'use strict';

	// Object.keys polyfill
	if (!Object.keys) {
		Object.keys = function (obj) {
			var keys = [], k;
			for (k in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					keys.push(k);
				}
			}
			return keys;
		};
	}

	// Sound effects loader
	var sfxLoading = $.Deferred();
	function sfxLoaded() {
		sfxLoaded.loaded++;
		if (sfxLoaded.loaded === sfxLoaded.total) {
			sfxLoading.resolve();
		}
	}
	sfxLoaded.loaded = 0;

	// Sound effects
	Howler.volume(0.5);
	window.sfx = {
		// Cube
		cubeletOver: new Howl({ urls: ['sfx/cube_cubelet_over.ogg'], volume: 0.5, onload: sfxLoaded }),
		linkOver: new Howl({ urls: ['sfx/cube_link_over.ogg'], onload: sfxLoaded }),
		linkOut: new Howl({ urls: ['sfx/cube_link_out.ogg'], onload: sfxLoaded }),
		move: new Howl({ urls: ['sfx/cube_move.ogg'], onload: sfxLoaded }),
		popping: new Howl({ urls: ['sfx/cube_popping.ogg'], onload: sfxLoaded }),

		// UI
		supportOver: new Howl({ urls: ['sfx/support_over.ogg'], onload: sfxLoaded }),
		supportOut: new Howl({ urls: ['sfx/support_out.ogg'], onload: sfxLoaded }),
		yes: new Howl({ urls: ['sfx/confirm_yes.ogg'], onload: sfxLoaded }),
		no: new Howl({ urls: ['sfx/confirm_no.ogg'], volume: 0.5, onload: sfxLoaded }),
		link: new Howl({ urls: ['sfx/link.ogg'], onload: sfxLoaded }),
		flash: new Howl({ urls: ['sfx/flash.ogg'], volume: 0.4, onload: sfxLoaded }),
		sfxChange: new Howl({ urls: ['sfx/sfx_change.ogg'], onload: sfxLoaded })
	};
	sfxLoaded.total = Object.keys(sfx).length;

	// If audio is not supported, mark resolve sfxLoading immediately,
	// as Howler has no error events
	if (!Modernizr.audio.ogg.length) {
		sfxLoading.resolve();
	}

	// UI
	var $container = $('#container').hide();
	var $cube = $('#cube');
	var $support = $('#support');
	var $warning = $('#warning').hide();
	var $controls = $('#controls').hide();
	var $back = $('#back').hide();
	var $home = $('#home').hide();
	var required = ['csstransforms3d', 'csstransitions'];
	var isCapable = true;
	var isMuted = false;

	// Navigation development
	$('#navigation').on('mousedown', '[data-pos]', function () {
		var $el = $(this);
		var pos = $el.data('pos');

		$cube.children().first()[0].className = 'side transition ' + pos;
	});

	// Mark supported browser features
	sfxLoading.done(function () {
		$support.find('[data-check]').each(function (i, e) {
			var $el = $(e);
			var feature = $el.data('check');
			var check = feature === 'audio' ? Modernizr[feature].ogg.length : Modernizr[feature];

			// Check if feature is required
			if (!check && $.inArray(feature, required) !== -1) {
				isCapable = false;
			}

			// Deferred state mark
			setTimeout(function () {
				$el.addClass(check ? 'yes' : 'no');
				sfx[check ? 'yes' : 'no'].play();
			}, i * 100);
		});
	});

	// Cube links sound effects
	$cube.on('mouseenter mouseleave mousedown mouseup', 'a', function (event) {
		var effect = 'linkOver';
		switch (event.type) {
			case 'mouseenter':
			case 'mouseup':
				break;
			case 'mouseleave':
			case 'mousedown':
				effect = 'linkOut';
				break;

		}
		sfx[effect].play();
	});

	// Cubelet sound effects
	$cube.on('mouseenter', '.side > .cubelet', function () {
		sfx.cubeletOver.play();
	});

	// Link sound effect
	$('#warning .browsers a').add('button').add('#soundcontrols li').on('mouseenter', function () {
		sfx.link.play();
	});

	// Buy/Follow link hover effect
	(function () {
		var $buy = $('#buy');
		var $follow = $('#follow');
		var options = { fps: 30, frames: 5, vertical: 1 };

		$buy.data('motio', new Motio($buy[0], options));
		$follow.data('motio', new Motio($follow[0], options));

		$buy.add($follow).on('mouseenter mouseleave', function (event) {
			var motio = $(this).data('motio');
			if (event.type === 'mouseenter') {
				motio.toEnd();
				sfx.flash.play();
			} else {
				motio.toStart(1);
			}
		});

	}());

	// Animation for Browser support panel
	(function () {
		var $plane = $support.children('.plane');
		var $items = $support.find('h2, li');

		$plane.on('mouseenter mouseleave', function (event) {
			var entered = event.type === 'mouseenter';
			sfx[entered ? 'supportOver' : 'supportOut'].play();

			$items.each(function (i, el) {
				if (!i) {
					return;
				}

				var $item = i === 1 ? $(el).add($items[0]) : $(el);

				setTimeout(function () {
					$item[entered ? 'addClass' : 'removeClass']('straight');
				}, (i - 1) * 50);
			});
		});
	}());

	/**
	 * Handler for side activation event.
	 *
	 * @return {Void}
	 */
	function activeHandler() {
		/*jshint validthis:true */
		$back[this.history.length ? 'show' : 'hide']();
		$home[this.active !== this.index ? 'show' : 'hide']();
	}

	// If browser is capable, create a cube
	function loadCube() {
		$container.add($controls).show();

		// Create a cube cube when sound effects are done loading
		sfxLoading.done(function () {
			// Delay cube generation so the browser support panel can finish effects
			setTimeout(function () {
				$container.find('.loading').remove();
				var cube = w.cube = new RDCube($cube, 20, { onActive: activeHandler });

				cube.addSide('index', 1)
					.addText('Riddick game cube menu navigation in HTML, CSS, and JavaScript')
					.newLine(2)
					.addText('As of April 2013 works best in Google Chrome')
					.newLine(3)
					.addLink('#!about', 'About', 'center')
					.newLine(2)
					.addLink('#!resources', 'Resources', 'center')
					.newLine(2)
					.addLink('#!assets', 'Assets', 'center');

				cube.addSide('about')
					.addTitle('About')
					.addText('One side consists of 2000 elements')
					.newLine(2)
					.addText('Animations are 100% CSS and done by adding and removing classes')
					.newLine(2)
					.addText('Framework supports infinite number of sides')
					.newLine(2)
					.addText('Try the looping navigation below')
					.newLine(2)
					.addLink('#!loop', 'Loop', 'center');

				cube.addSide('loop')
					.addTitle('Loop')
					.addText('Clicking on Loop link below cycles through About and Loop sections, always animating in from the right side')
					.newLine(2)
					.addText('This showcases the infinite sides design')
					.newLine(5)
					.addLink('#!about', 'Loop', 'center');

				cube.addSide('resources', 'top')
					.addTitle('Resources')
					.addLink('http://jquery.com', 'jQuery')
						.newLine()
						.addText('-DOM manipulations')
						.newLine(2)
					.addLink('http://modernizr.com', 'Modernizr')
						.newLine()
						.addText('-feature detects')
						.newLine(2)
					.addLink('https://github.com/LeaVerou/prefixfree', 'PrefixFree')
						.newLine()
						.addText('-vendor prefixes')
						.newLine(2)
					.addLink('https://github.com/goldfire/howler.js', 'Howler')
						.newLine()
						.addText('-sound effects')
						.newLine(2)
					.addLink('https://github.com/Darsain/motio', 'Motio')
						.newLine()
						.addText('-sprite animations');

				cube.addSide('assets', 'bottom')
					.addTitle('Assets')
					.addText('Sound effects are taken from Riddick: Assault on Dark Athena. Buy it!')
						.newLine(2)
						.addText('-').addLink('http://atari.com/buy-games/fps/chronicles-riddick-assault-dark-athena', 'Atari.com')
						.newLine()
						.addText('-').addLink('http://www.gog.com/gamecard/the_chronicles_of_riddick_assault_on_dark_athena', 'GOG.com')
					.newLine(2)
					.addText('Background image is from EVE Online')
						.newLine(2)
						.addText('-').addLink('http://www.eveonline.com/', 'EVEOnline.com')
					.newLine(2)
					.addText('Please dont sue me anyone☺');

			}, 1000);
		});
	}

	// Controls
	$(doc).on('click', '[data-action]', function () {
		var action = $(this).data('action');

		switch (action) {
			case 'mute':
				isMuted = !isMuted;
				Howler[isMuted ? 'mute' : 'unmute']();
				$(this)[isMuted ? 'addClass' : 'removeClass']('off')
					.find('i')[0].className = isMuted ? 'icon-volume-off' : 'icon-volume-up';
				sfx.sfxChange.play();
				break;

			case 'pop':
				w.cube.sides[w.cube.active].popCubelets();
				break;

			case 'popMore':
				w.cube.sides[w.cube.active].popCubelets(0.3);
				break;

			case 'popAlot':
				w.cube.sides[w.cube.active].popCubelets(0.7);
				break;

			default:
				w.cube[action]();
		}
	});

	// If browser is not capable, display warning
	if (!isCapable) {
		$warning.show();
	} else {
		loadCube();
	}
}(window, document, jQuery));