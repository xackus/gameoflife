/**
 * 
 */

var state = {
	width : 50,
	height : 150,
	neighbors : [ [ -1, -1 ], [ -1, 0, ], [ -1, 1 ], [ 0, -1 ], [ 0, 1 ],
			[ 1, -1 ], [ 1, 0 ], [ 1, 1 ] ],
	death : 'neigh < 2 || neigh > 3',
	birth : 'neigh == 3',
	table : []
};

var running = false;
var interval = 600;

var table_cache;

function cell(x, y) {
	return $('#t #tr' + y + " #td" + x);
}

function gen_t(w, h) {
	var tab = '';
	for (var y = 0; y < h; ++y) {
		tab += '<tr id="tr' + y + '">';
		for (var x = 0; x < w; ++x) {
			tab += '<td id="td' + x + '"></td>'
		}
		tab += '</tr>';
	}
	$('#t').html(tab);
	$('#t tr td').click(function() {
		$(this).toggleClass('alive');
	});
	table_cache = [];
	for (var x = 0; x < w; ++x) {
		table_cache.push([]);
		for (var y = 0; y < h; ++y) {
			table_cache[x].push(cell(x, y));
		}
	}
}

function notin(x, a, b) {
	return x < a || x >= b;
}

function tick() {
	for (var y = 0; y < state.height; ++y) {
		for (var x = 0; x < state.width; ++x) {
			var neigh = 0;
			var curr = table_cache[x][y];
			var alive = curr.hasClass('alive');
			state.neighbors.forEach(function(elem) {
				if (notin(x + elem[0], 0, state.width)
						|| notin(y + elem[1], 0, state.height)) {
					return;
				}
				if (table_cache[x + elem[0]][y + elem[1]].hasClass('alive')) {
					++neigh;
				}
			});
			if (alive && eval(state.death)) {
				curr.data('next', false);
			} else if (!alive && eval(state.birth)) {
				curr.data('next', true);
			} else {
				curr.data('next', alive);
			}
		}
	}
	for (var y = 0; y < state.height; ++y) {
		for (var x = 0; x < state.width; ++x) {
			var curr = table_cache[x][y];
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
	tick();
	setTimeout(loop, Math.max(0, interval - (performance.now() - time)));
}

function export_() {
	running = false;
	table = [];
	for (var x = 0; x < state.width; ++x) {
		curr = [];
		none = true;
		for (var y = 0; y < state.height; ++y) {
			if (table_cache[x][y].hasClass('alive')) {
				curr.push(1);
				none = false;
			} else {
				curr.push(0);
			}
		}
		if (!none) {
			table.push(curr);
		} else {
			table.push([]);
		}
	}
	state.table = table;
	return JSON.stringify(state);
}

function import_(data) {
	state = JSON.parse(data);
	gen_t(state.width, state.height);
	for (var x = 0; x < state.width; ++x) {
		if (state.table[x].length == 0) {
			continue;
		}
		for (var y = 0; y < state.height; ++y) {
			if (state.table[x][y] == 1) {
				table_cache[x][y].addClass('alive');
			}
		}
	}
}

$(function() {
	gen_t(state.width, state.height);
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
		state.neighbors = JSON.parse('[' + $("#neigh").val() + ']');
		state.death = $('#death').val();
		state.birth = $('#birth').val();
	});
	$('#export').click(function() {
		$('#asjson').val(export_());
	});
	$('#import').click(function() {
		import_($('#asjson').val());
	});
});