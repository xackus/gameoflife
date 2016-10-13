/**
 * 
 */

var w = 50, h = 150;
var offset = [ [ -1, -1 ], [ -1, 0, ], [ -1, 1 ], [ 0, -1 ], [ 0, 1 ],
		[ 1, -1 ], [ 1, 0 ], [ 1, 1 ] ];
var running = false;
var interval = 600;
var death = 'neigh < 2 || neigh > 3';
var survival = 'neigh == 2';
var birth = 'neigh == 3';

var table;

function cell(x, y) {
	return $('#t #tr' + y + " #td" + x);
}

function gen_t(x, y) {
	var tab = '';
	for (var cy = 0; cy < y; ++cy) {
		tab += '<tr id="tr' + cy + '">';
		for (var cx = 0; cx < x; ++cx) {
			tab += '<td id="td' + cx + '"></td>'
		}
		tab += '</tr>';
	}
	$('#t').html(tab);
	$('#t tr td').click(function() {
		$(this).toggleClass('alive');
	});
	table = [];
	for (var x = 0; x < w; ++x) {
		table.push([]);
		for (var y = 0; y < h; ++y) {
			table[x].push(cell(x, y));
		}
	}
}

function notin(x, a, b){
	return x < a || x >= b;
}

function tick() {
	for (var y = 0; y < h; ++y) {
		for (var x = 0; x < w; ++x) {
			var neigh = 0;
			var curr = table[x][y];
			var alive = curr.hasClass('alive');
			offset.forEach(function(elem) {
				if(notin(x + elem[0], 0, w) || notin(y + elem[1], 0, h)){
					return;
				}
				if (table[x + elem[0]][y + elem[1]].hasClass('alive')) {
					++neigh;
				}
			});
			if (alive && eval(death)) {
				curr.data('next', false);
			} else if (!alive && eval(birth)) {
				curr.data('next', true);
			} else {
				curr.data('next', alive);
			}
		}
	}
	for (var y = 0; y < h; ++y) {
		for (var x = 0; x < w; ++x) {
			var curr = table[x][y];
			if (curr.hasClass('alive') != curr.data('next')) {
				curr.toggleClass('alive');
			}
		}
	}
}

function loop() {
	if (!running) {
		return;
	}
	var time = performance.now();
	tick()
	setTimeout(loop, Math.max(0, interval - (performance.now() - time)));
}

$(function() {
	gen_t(w, h);
	$('#tick').click(function() {
		tick();
	});
	$('#play').click(function() {
		if (running) {
			running = false;
			$(this).val("Play");
		} else {
			running = true;
			$(this).val("Pause");
			interval = Math.round($('#interval').val());
			loop();
		}
	});
	$('#submit').click(function() {
		offset = JSON.parse('[' + $("#neigh").val() + ']');
		death = $('#death').val();
		birth = $('#birth').val();
	});
});
