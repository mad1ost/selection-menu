'use strict';

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener('submit', saveOptions);
document.querySelector("select").addEventListener('change', changeSearchEngine);

function saveOptions(event) {
	chrome.storage.local.set({
		searchEngineName: document.querySelector("select").value,
		searchEngineURL: document.querySelector("#search-engine-url").value,
		styleFontFamily: document.querySelector("#style-font-family").value,
		searchButtonText: document.querySelector("#search-button-text").value,
		copyButtonText: document.querySelector("#copy-button-text").value
	});
	event.preventDefault();
}

function restoreOptions() {
	chrome.storage.local.get({
		searchEngineName: 'google',
		searchEngineURL: 'https://www.google.com/search?q=',
		styleFontFamily: '',
		searchButtonText: 'Search in Google',
		copyButtonText: 'Copy'
	}, (options) => {
		document.querySelector("select").value = options.searchEngineName;
		if (options.searchEngineName !== 'custom') {
			document.querySelector("#search-engine-url").disabled = true;
		}
		document.querySelector("#search-engine-url").value = options.searchEngineURL;
		document.querySelector("#style-font-family").value = options.styleFontFamily;
		document.querySelector("#search-button-text").value = options.searchButtonText;
		document.querySelector("#copy-button-text").value = options.copyButtonText;
	});
}

function changeSearchEngine() {
	const searchEngines = {
		google: 'https://www.google.com/search?q=',
		bing: 'https://www.bing.com/search?q=',
		yahoo: 'https://search.yahoo.com/search?p=',
		baidu: 'https://www.baidu.com/s?wd=',
		yandex: 'https://yandex.ru/search/?text=',
		duckduckgo: 'https://duckduckgo.com/?q='
	}
	if (searchEngines.hasOwnProperty(this.value)) {
		document.querySelector("#search-engine-url").disabled = true;
		document.querySelector("#search-engine-url").value = searchEngines[this.value];
	} else {
		document.querySelector("#search-engine-url").disabled = false;
		document.querySelector("#search-engine-url").value = '';
	}
	document.querySelector("#search-button-text").value = 'Search in ' + this.options[this.selectedIndex].text;
}
