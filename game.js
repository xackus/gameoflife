/**
 * author: Maciej Walczak
 */

let state = {
	width : 0,
	height : 0,
	neighbors : [ [ -1, -1 ], [ -1, 0, ], [ -1, 1 ], [ 0, -1 ], [ 0, 1 ], [ 1, -1 ], [ 1, 0 ], [ 1, 1 ] ],
	death : 'neigh < 2 || neigh > 3',
	birth : 'neigh == 3',
	table : []
// table is built only for export and read from only on import
};

let running = false;
let interval = 300;

let table_cache;

let history = [];

function build_cache(w, h) {
	table_cache = [];
	for (var x = 0; x < w; ++x) {
		table_cache.push([]);
	}
	for (var y = 0; y < h; ++y) {
		table_cache.push([]);
		$('#tr' + y).children().each(function(x) {
			table_cache[x].push($(this));
		});
	}
}

function resize(w, h) {
	if (h < state.height) {
		for (var y = h; y < state.height; ++y) {
			$('#tr' + y).remove();
		}
	} else {
		for (var y = state.height; y < h; ++y) {
			tr = $('<tr></tr>', {
				id : 'tr' + y
			});
			for (var x = 0; x < Math.min(w, state.width); ++x) {
				$('<td></td>', {
					'class' : 'td' + x
				}).click(function() {
					$(this).toggleClass('alive');
				}).appendTo(tr);
			}
			tr.appendTo('#t');
		}

	}
	if (w < state.width) {
		for (var x = w; x < state.width; ++x) {
			$('.td' + x).remove();
		}
	} else {
		for (var x = state.width; x < w; ++x) {
			$('<td></td>', {
				'class' : 'td' + x
			}).click(function() {
				$(this).toggleClass('alive');
			}).appendTo('#t > tr');
		}
	}
	state.width = w;
	state.height = h;
	build_cache(w, h);
}

function tick() {
	history.push([]);
	let h = history.length - 1;
	for (var x = 0; x < state.width; ++x) {
		history[h].push([]);
		for (var y = 0; y < state.height; ++y) {
			var neigh = 0;
			var curr = table_cache[x][y];
			var alive = curr.hasClass('alive');
			history[h][x][y] = alive;
			state.neighbors.forEach(function(elem) {
				let cx = x + elem[0];
				let cy = y + elem[1];
				if (cx < 0 || cx >= state.width || cy < 0 || cy >= state.height) {
					return;
				}
				if (table_cache[cx][cy].hasClass('alive')) {
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

function revert(index) {
	if(history.length === 0){
		return;
	}
	$('.alive').removeClass('alive');
	for (var x = 0; x < state.width; ++x) {
		for (var y = 0; y < state.height; ++y) {
			if (history[index][x][y]) {
				table_cache[x][y].addClass('alive');
			}
		}
	}
	history.splice(index, history.length - index);
}

function loop() {
	let time = performance.now();
	
	if (!running) {
		return;
	}
	
	tick();
	$('#counter').html(parseInt($('#counter').html(), 10) + 1);
	
	setTimeout(loop, Math.max(0, interval - (performance.now() - time)));
}

function reverse_loop() {
	let time = performance.now();
	
	if(history.length === 0){
		running = false;
	}
	if (!running) {
		return;
	}
	
	revert(history.length - 1);
	$('#counter').html(parseInt($('#counter').html(), 10) - 1);
	
	setTimeout(reverse_loop, Math.max(0, interval - (performance.now() - time)));
}

function pause() {
	running = false;
	$('#play').html('Play');
	$('#rev').html('Reverse');
}

function export_() {
	pause();
	let table = [];
	let empty = 0;
	for (var x = 0; x < state.width; ++x) {
		table.push([]);
		var last = 0;
		for (var y = 0; y < state.height; ++y) {
			while (y < state.height && !table_cache[x][y].hasClass('alive')) {
				++y;
			}
			if (y - last !== 0 && y !== state.height) {
				if (empty !== 0) {
					table.pop()
					table.push(empty);
					table.push([]);
					empty = 0;
				}
				table[table.length - 1].push((y - last) * 2);
			}
			last = y;
			while (y < state.height && table_cache[x][y].hasClass('alive')) {
				++y;
			}
			if (y - last !== 0) {
				if (empty !== 0) {
					table.pop()
					table.push(empty);
					table.push([]);
					empty = 0;
				}
				table[table.length - 1].push((y - last) * 2 + 1);
			}
			last = y;
		}
		if (table[table.length - 1].length === 0) {
			++empty;
			table.pop();
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
	$('.alive').removeClass('alive');
	history = [];
	let x = 0;
	for (var i = 0; i < state.table.length; ++i) {
		if (typeof state.table[i] === 'number') {
			x += state.table[i];
			continue;
		}
		var y = 0;
		for (var j = 0; j < state.table[i].length; ++j) {
			if (state.table[i][j] === 1) {// legacy
				table_cache[x][y].addClass('alive');
				++y;
			} else if (state.table[i][j] % 2 === 1) {
				var end = y + Math.trunc(state.table[i][j] / 2);
				for (; y < end; ++y) {
					table_cache[x][y].addClass('alive');
				}
			} else if (state.table[i][j] === 0) {// legacy
				++y;
			} else if (state.table[i][j] % 2 === 0) {
				y += state.table[i][j] / 2;
			}
		}
		++x;
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
		pause();
		let step = Math.round($('#step').val());
		for(var i = 0; i < step; ++i){
			tick();
		}
		$('#counter').html(parseInt($('#counter').html(), 10) + step);
		return false;
	});
	$('#prev').click(function() {
		pause();
		let step = Math.min(Math.round($('#step').val()), history.length);
		revert(history.length - step);
		$('#counter').html(parseInt($('#counter').html(), 10) - step);
	});
	$('#play').click(function() {
		if (running) {
			pause();
		} else {
			running = true;
			$(this).html('Pause');
			$('#rev').html('Pause');
			interval = Math.round($('#interval').val());
			loop();
		}
		return false;
	});
	$('#rev').click(function() {
		if (running) {
			pause();
		} else {
			running = true;
			$(this).html('Pause');
			$('#play').html('Pause');
			interval = Math.round($('#interval').val());
			reverse_loop();
		}
		return false;
	});
	$('#submit').click(function() {
		state.neighbors = JSON.parse('[' + $('#neigh').val() + ']');
		state.death = $('#death').val();
		state.birth = $('#birth').val();
		resize(Math.round($('#width').val()), Math.round($('#height').val()))
		return false;
	});
	$('#export').click(function() {
		$('#asjson').val(export_());
	});
	$('#import').click(function() {
		import_($('#asjson').val());
		return false;
	});
	$('#reset_counter').click(function() {
		$('#counter').html('0');
	});
});