(function() {
	'use strict';

	window.$template = function(identifier, data) {
		var html = document.getElementById(identifier).innerHTML;

		html = html.replace(RegExp('\\{\\{(.+?)\\}\\}', 'g'), function(match, p1) {
			return data[p1] !== undefined ? data[p1] : '';
		});

		return html;
	};

	class HistoryItem {
		constructor(history) {
			this.history = history;

			this.data = {};
		}

		set(key, value) {
			this.data[key] = value;
		}

		update() {
			this.history.push(this.data);

			var date = new Date(this.data.date);

			$$.HISTORYLIST.prepend($template('history-list-item', {
				state: this.data.state ? 'success' : 'error',
				query: this.data.query,
				total: this.data.total || 0,
				date: date.getFullYear() + '-' + ('00' + (date.getMonth() + 1)).slice(-2) + '-' + ('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2)
			}));

			// TODO: Based on settings
			if (this.history.items.length > 50) {
				$$HISTORYLIST.find('li').slice(50 - this.history.items.length).remove();
			}
		}
	}

	class History {
		static newItem(key) {
			var history = this.init(key),
				item = new HistoryItem(history);

			return item;
		}

		static init(key) {
			return new this(key);
		}

		constructor(key) {
			this.key = key;
			this.items = $storage.get('history.' + key);

			if (this.items === undefined || this.items === null || this.items.constructor.name !== 'Array') {
				this.items = [];
				$storage.set('history.' + key, this.items);
			}
		}

		push(item) {
			this.items.push(item);

			this.update();
		}

		update(item) {
			// TODO: Shift based on settings
			if (this.items.length > 50) {
				this.items.splice(0, this.items.length - 50);
			}

			$storage.set('history.' + this.key, this.items);
		}
	}

	window.$history = History;
})();
