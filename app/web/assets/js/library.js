(function() {
	'use strict';

	window.$template = function(identifier, data) {
		var html = document.getElementById(identifier).innerHTML;

		data = data || {};

		html = html.replace(new RegExp('\\{\\{(.+?)\\}\\}', 'g'), function(match, p1) {
			return data[p1] !== undefined ? data[p1] : '';
		});

		return html;
	};

	var HistoryItem = function(history) {
		if (this.constructor.name !== 'HistoryItem') {
			return new HistoryItem(history);
		}

		this.history = history;
		this.data = {};
	};

	HistoryItem.prototype.set = function(key, value) {
		this.data[key] = value;
	};

	HistoryItem.prototype.update = function() {
		if (this.history.key === false) {
			return;
		}

		this.history.push(this.data);

		var date = new Date(this.data.date);

		$$.HISTORYLIST.prepend($template('history-list-item', {
			state: this.data.state ? 'success' : 'error',
			query: this.data.query,
			db: this.data.db,
			total: this.data.total || 0,
			date: date.getFullYear() + '-' + ('00' + (date.getMonth() + 1)).slice(-2) + '-' + ('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2)
		}));

		// TODO: Based on settings
		if (this.history.items.length > 50) {
			$$HISTORYLIST.find('li').slice(50 - this.history.items.length).remove();
		}
	};

	var History = function(key) {
		if (!(this instanceof History)) {
			return new History(key);
		}

		if (key !== false) {
			this.items = $storage.get('history.' + key);

			if (this.items === undefined || this.items === null || this.items.constructor.name !== 'Array') {
				this.items = [];
				$storage.set('history.' + key, this.items);
			}
		} else {
			this.items = [];
		}

		this.key = key;
	};

	History.prototype.new = function() {
		var item = new HistoryItem(this);

		return item;
	};

	History.prototype.push = function(item) {
		this.items.unshift(item);

		this.update();
	};

	History.prototype.update = function() {
		if (this.key === false) {
			return;
		}

		// TODO: Shift based on settings
		if (this.items.length > 50) {
			this.items.splice(50 - this.items.length);
		}

		$storage.set('history.' + this.key, this.items);
	};

	window.$history = History;

	var Folder = function(key) {
		if (!(this instanceof Folder)) {
			return new Folder(key);
		}

		this.key = key;
	};

	Folder.prototype.add = function(item) {
		var itemkey = Date.now().toString() + Math.random().toString().slice(2);

		$storage.set('folder.' + this.key + '.' + itemkey, item);

		var date = new Date(item.date);

		$$.FOLDERLIST.append($template('folder-list-item', {
			type: item.name.length === 0 ? 'noname' : '',
			key: itemkey,
			name: item.name,
			query: item.query,
			date: date.getFullYear() + '-' + ('00' + (date.getMonth() + 1)).slice(-2) + '-' + ('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2)
		}));

		return this;
	};

	Folder.prototype.delete = function(itemkey) {
		$storage.delete('folder.' + this.key + '.' + itemkey);
	};

	window.$folder = Folder;
})();
