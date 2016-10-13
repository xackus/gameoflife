/**
 * 
 */

var state = {
	width : 0,
	height : 0,
	neighbors : [ [ -1, -1 ], [ -1, 0, ], [ -1, 1 ], [ 0, -1 ], [ 0, 1 ],
			[ 1, -1 ], [ 1, 0 ], [ 1, 1 ] ],
	death : 'neigh < 2 || neigh > 3',
	birth : 'neigh == 3',
	table : []
// table is built only for export and read from only on import
};

var running = false;
var interval = 600;

var table_cache;

function cell(x, y) {
	return $('#t #tr' + y + " #td" + x);
}

function build_cache(w, h) {
	table_cache = [];
	for (var x = 0; x < w; ++x) {
		table_cache.push([]);
		for (var y = 0; y < h; ++y) {
			table_cache[x].push(cell(x, y));
		}
	}
}

function resize(w, h) {
	if (h < state.height) {
		for (var y = h; y < state.height; ++y) {
			$('#t #tr' + y).remove();
		}
	} else {
		for (var y = state.height; y < h; ++y) {
			tr = $('<tr></tr>', {
				id : 'tr' + y
			});
			for (var x = 0; x < Math.min(w, state.width); ++x) {
				$('<td></td>', {
					id : 'td' + x
				}).click(function() {
					$(this).toggleClass('alive');
				}).appendTo(tr);
			}
			tr.appendTo('#t');
		}

	}
	if (w < state.width) {
		for (var x = w; x < state.width; ++x) {
			$('#t tr #td' + x).remove();
		}
	} else {
		for (var x = state.width; x < w; ++x) {
			$('<td></td>', {
				id : 'td' + x
			}).click(function() {
				$(this).toggleClass('alive');
			}).appendTo('#t tr');
		}
	}
	state.width = w;
	state.height = h;
	build_cache(w, h);
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

function pause() {
	running = false;
	$('#play').val("Play");
}

function export_() {
	pause();
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
	pause();
	new_state = JSON.parse(data);// resize uses old state.width and
									// state.height
	resize(new_state.width, new_state.height);
	state = new_state;
	$('#t tr td').removeClass('alive');
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
	neigh = JSON.stringify(state.neighbors);
	neigh = neigh.substring(1, neigh.length - 1)
	$('#neigh').val(neigh);
	$('#birth').val(state.birth);
	$('#death').val(state.death);
	$('#width').val(state.width);
	$('#height').val(state.height);
}

$(function() {
	resize(100, 100);
	$('#tick').click(function() {
		tick();
	});
	$('#play').click(function() {
		if (running) {
			pause();
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
		resize(Math.round($('#width').val()), Math.round($('#height').val()))
	});
	$('#export').click(function() {
		$('#asjson').val(export_());
	});
	$('#import').click(function() {
		import_($('#asjson').val());
	});
});