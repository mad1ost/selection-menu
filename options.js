'use strict';

const form = document.forms[0];
document.addEventListener('DOMContentLoaded', restoreOptions);
form.addEventListener('submit', saveOptions);
form['select-search-engine'].addEventListener('change', changeSearchEngine);

function saveOptions(event) {
	chrome.storage.local.set({
		searchEngineName: form['select-search-engine'].value,
		searchEngineURL:  form['search-engine-url'].value,
		styleFontFamily:  form['style-font-family'].value,
		searchButtonText: form['search-button-text'].value,
		copyButtonText:   form['copy-button-text'].value
	});
	event.preventDefault();
}

function restoreOptions() {
	chrome.storage.local.get({
		searchEngineName: 'google',
		searchEngineURL:  'https://www.google.com/search?q=',
		styleFontFamily:  '',
		searchButtonText: 'Search in Google',
		copyButtonText:   'Copy'
	}, (options) => {
		form['select-search-engine'].value = options.searchEngineName;
		if (options.searchEngineName !== 'custom') {
			form['search-engine-url'].disabled = true;
		}
		form['search-engine-url'].value  = options.searchEngineURL;
		form['style-font-family'].value  = options.styleFontFamily;
		form['search-button-text'].value = options.searchButtonText;
		form['copy-button-text'].value   = options.copyButtonText;
	});
}

function changeSearchEngine() {
	const searchEngines = {
		google:     'https://www.google.com/search?q=',
		bing:       'https://www.bing.com/search?q=',
		yahoo:      'https://search.yahoo.com/search?p=',
		baidu:      'https://www.baidu.com/s?wd=',
		yandex:     'https://yandex.ru/search/?text=',
		duckduckgo: 'https://duckduckgo.com/?q='
	}
	if (searchEngines.hasOwnProperty(this.value)) {
		form['search-engine-url'].disabled = true;
		form['search-engine-url'].value = searchEngines[this.value];
	} else {
		form['search-engine-url'].disabled = false;
		form['search-engine-url'].value = '';
	}
	form['search-button-text'].value = 'Search in ' + this.options[this.selectedIndex].text;
}

