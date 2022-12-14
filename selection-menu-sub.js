'use strict';

let isLeftMouseDown = false;
let isScrollByClick = false;

window.addEventListener('mousedown', (event) => {
	if (event.which === 1) isLeftMouseDown = true;
	hideSelectionMenu();
});

window.addEventListener('mouseup', (event) => {
	if (event.which !== 1) return;
	isLeftMouseDown = false;
	if (isScrollByClick) {
		isScrollByClick = false;
		return;
	}
	// showSelectionMenu();
	// because clicking on the same selection resets it only after mouseup event
	setTimeout(showSelectionMenu, 0, event.target);
});

window.addEventListener('scroll', debounce(() => {
	if (isLeftMouseDown) {
		isScrollByClick = true;
		return;
	}
	hideSelectionMenu();
}, 200), true);

window.addEventListener('keydown', (event) => {
	if (event.code === 'KeyA' && (event.ctrlKey || event.metaKey)) {
		hideSelectionMenu();
	}
	switch (event.key) {
		case 'ArrowLeft':
		case 'ArrowUp':
		case 'ArrowRight':
		case 'ArrowDown':
		case 'Home':
		case 'End':
		case 'PageUp':
		case 'PageDown':
			hideSelectionMenu();
			break;
	}
}, true);

window.addEventListener('keyup', (event) => {
	if (event.key === 'Shift') showSelectionMenu(event.target);
}, true);

window.addEventListener('resize', debounce(hideSelectionMenu, 200), true);
window.addEventListener('input', debounce(hideSelectionMenu, 200), true);

window.addEventListener('message', (event) => {
	if (event.source === window.top) return;
	switch (event.data.action) {
		case 'show':
			const subFrames = document.getElementsByTagName('iframe');
			
			let subFrame;
			for (let i = 0; i < subFrames.length; i++) {
				if (subFrames[i].contentWindow === event.source) {
					subFrame = subFrames[i];
					break;
				}
			}
			if (subFrame === undefined) throw new Error("can't find sub iframe");
			
			const subFrameOffset = subFrame.getBoundingClientRect();
			const subFrameStyle = getComputedStyle(subFrame);
			const subFramePaddingLeft = parseInt(subFrameStyle.paddingLeft);
			const subFramePaddingTop = parseInt(subFrameStyle.paddingTop);
			
			window.parent.postMessage({
				action: 'show',
				selectedString: event.data.selectedString,
				selectionDirection: event.data.selectionDirection,
				onOneLine: event.data.onOneLine,
				selectionEnd: {
					left: subFrameOffset.left + subFrame.clientLeft + subFramePaddingLeft + event.data.selectionEnd.left,
					top: subFrameOffset.top + subFrame.clientTop + subFramePaddingTop + event.data.selectionEnd.top,
					right: subFrameOffset.left + subFrame.clientLeft + subFramePaddingLeft + event.data.selectionEnd.right,
					bottom: subFrameOffset.top + subFrame.clientTop + subFramePaddingTop + event.data.selectionEnd.bottom
				}
			}, "*");
			break;
		case 'hide':
			window.parent.postMessage({
				action: 'hide'
			}, "*");
			break;
	}
});

function debounce(func, ms) {
	let timer = null;
	return function() {
		if (timer === null) func.apply(this);
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
		}, ms);
	}
}

function hideSelectionMenu() {
	window.parent.postMessage({
		action: 'hide'
	}, '*');
}

function showSelectionMenu(element) { // event.target
	let selectedString,
		selectionDirection,
		onOneLine,
		selectionStart,
		selectionEnd;
	
	switch (element.nodeName) {
		case 'INPUT':
		case 'TEXTAREA':
			selectedString = element.value.substring(element.selectionStart, element.selectionEnd);
			if (selectedString.trim() === '') return;
			
			const mirrorDiv = createMirrorDiv(element);
			mirrorDiv.style.visibility = 'hidden';
			const elementPosition = element.getBoundingClientRect();
			mirrorDiv.style.position = 'fixed';
			mirrorDiv.style.left = elementPosition.left + 'px';
			mirrorDiv.style.top = elementPosition.top + 'px';
			
			document.body.append(mirrorDiv);
			mirrorDiv.scrollLeft = element.scrollLeft;
			mirrorDiv.scrollTop = element.scrollTop;
			
			const textNode = mirrorDiv.firstChild;
			const range = document.createRange();
			range.setStart(textNode, element.selectionStart);
			range.setEnd(textNode, element.selectionEnd);
			selectionDirection = element.selectionDirection;
			selectionStart = getSelectionStart(range, selectionDirection);
			selectionEnd = getSelectionEnd(range, selectionDirection);
			
			let textBorderRight;
			switch (element.nodeName) {
				case 'INPUT':
					textBorderRight = elementPosition.left
						+ mirrorDiv.clientLeft
						+ mirrorDiv.clientWidth;
					break;
				case 'TEXTAREA':
					textBorderRight = elementPosition.left
						+ mirrorDiv.clientLeft
						+ mirrorDiv.clientWidth
						- parseInt(mirrorDiv.style.paddingRight);
					let textBorderBottom = elementPosition.top
						+ mirrorDiv.clientTop
						+ mirrorDiv.clientHeight;
					const isFirefox = (typeof InstallTrigger !== 'undefined');
					if (!isFirefox) {
						textBorderRight = textBorderRight
							+ parseInt(mirrorDiv.style.paddingRight);
						textBorderBottom = textBorderBottom
							+ parseInt(mirrorDiv.style.paddingBottom);
					}
					selectionEnd.bottom = Math.min(selectionEnd.bottom, textBorderBottom);
					break;
			}
			selectionEnd.left = selectionEnd.right = Math.min(selectionEnd.right, textBorderRight);
			
			document.body.removeChild(mirrorDiv);
			break;
		default:
			const selection = window.getSelection();
			if (selection.isCollapsed) return;
			
			const selectedRngArr = getRngArrWithTextNodeBorders(selection);
			if (selectedRngArr.length === 0) return;
			
			selectionDirection = getSelectionDirection(selection);
			const lastSelectedRng = (selectionDirection === 'forward') ? selectedRngArr[selectedRngArr.length - 1] : selectedRngArr[0];
			selectionStart = getSelectionStart(lastSelectedRng, selectionDirection);
			selectionEnd = getSelectionEnd(lastSelectedRng, selectionDirection);
			
			selectedString = selection.toString();
			if (selectedString === '') {
				// Selection.toString() sometimes gives an empty string
				// see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
				for (let i = 0; i < selection.rangeCount; i++) {
					selectedString += selection.getRangeAt(i).toString() + ' ';
				}
			}
			break;
	}
	
	onOneLine = (selectionStart.top === selectionEnd.top) ? true : false;
	
	window.parent.postMessage({
		action: 'show',
		selectedString: selectedString,
		selectionDirection: selectionDirection,
		onOneLine: onOneLine,
		selectionEnd: {
			left: selectionEnd.left,
			top: selectionEnd.top,
			right: selectionEnd.right,
			bottom: selectionEnd.bottom
		}
	}, '*');

	function createMirrorDiv(element) {
		const mirrorDiv = document.createElement('div');
		const textNode = document.createTextNode(element.value);
		mirrorDiv.append(textNode);
		
		const properties = [
			'boxSizing',
			'width',
			'height',
			
			'borderLeftWidth',
			'borderTopWidth',
			'borderRightWidth',
			'borderBottomWidth',
			
			'borderLeftStyle',
			'borderTopStyle',
			'borderRightStyle',
			'borderBottomStyle',
			
			'paddingLeft',
			'paddingTop',
			'paddingRight',
			'paddingBottom',
			
			// https://developer.mozilla.org/en-US/docs/Web/CSS/font
			'fontStyle',
			'fontVariant',
			'fontWeight',
			'fontStretch',
			'fontSize',
			'lineHeight',
			'fontFamily',
			
			'textAlign',
			'textTransform',
			'textIndent',
			'whiteSpace',
			'letterSpacing',
			'wordSpacing',
			
			'overflowX',
			'overflowY',
			'wordWrap',
		];
		const elementStyle = getComputedStyle(element);
		properties.forEach((property) => {
			mirrorDiv.style[property] = elementStyle[property];
		});
		
		switch (element.nodeName) {
			case 'TEXTAREA':
				// by default textarea overflowX overflowY
				// Chrome 'auto' 'auto'
				// Firefox 'visible' 'visible'
				// Chrome ignores overflow 'visible' of the textarea and sets it to 'auto'
				// but Firefox does not
				if (elementStyle.overflowX === 'visible') {
					mirrorDiv.style.overflowX = 'auto';
				}
				if (elementStyle.overflowY === 'visible') {
					mirrorDiv.style.overflowY = 'auto';
				}
				
				// do not display scrollbars in Chrome for correct rendering mirror div
				// Chrome calculates width of textarea without scrollbar, Firefox - with
				const isFirefox = (typeof InstallTrigger !== 'undefined');
				if (!isFirefox) {
					mirrorDiv.style.overflowX = 'hidden';
					mirrorDiv.style.overflowY = 'hidden';
				}
				
				// content of the div ignores padding-bottom if height is set explicitly
				mirrorDiv.style.height = parseInt(mirrorDiv.style.height)
					- parseInt(mirrorDiv.style.paddingBottom)
					+ 'px';
				break;
			case 'INPUT':
				mirrorDiv.style.whiteSpace = 'pre';
				mirrorDiv.style.overflowX = 'hidden';
				mirrorDiv.style.overflowY = 'hidden';
				// content of the div ignores padding-right if width is set explicitly
				mirrorDiv.style.width = parseInt(mirrorDiv.style.width)
					- parseInt(mirrorDiv.style.paddingRight)
					+ 'px';
				break;
		}
		return mirrorDiv;
	}
	
	function getRngArrWithTextNodeBorders(selection) {
		const rngArr = [];
		for (let i = 0; i < selection.rangeCount; i++) {
			const rng = selection.getRangeAt(i).cloneRange();
			if (rng.commonAncestorContainer.nodeType === 3) {
				if (rng.toString().trim() !== '') rngArr.push(rng);
				continue;
			}
			const wlkr = document.createTreeWalker(
				rng.commonAncestorContainer,
				NodeFilter.SHOW_ALL
			);
			const wlkrEndNode = (() => {
				if (rng.endOffset === 0) {
					wlkr.currentNode = rng.endContainer;
					return wlkr.previousNode();
				}
				if (rng.endContainer.childNodes[rng.endOffset]) {
					return rng.endContainer.childNodes[rng.endOffset];
				}
				return rng.endContainer;
			})();
			const wlkrStartNode = (() => {
				if (rng.startContainer.nodeType === 3 && rng.startOffset === rng.startContainer.data.length) {
					wlkr.currentNode = rng.startContainer;
					return wlkr.nextNode();
				}
				if (rng.startContainer.childNodes[rng.startOffset]) {
					return rng.startContainer.childNodes[rng.startOffset];
				}
				return rng.startContainer;
			})();
			const textNodeArr = [];
			wlkr.currentNode = wlkrStartNode;
			while (true) {
				if (wlkr.currentNode.nodeType === 3 && wlkr.currentNode.data.trim() !== '') textNodeArr.push(wlkr.currentNode);
				if (wlkr.currentNode === wlkrEndNode || wlkr.nextNode() === null) break;
			}
			if (textNodeArr.length === 0) continue;
			// firstTextNode
			if (textNodeArr[0] !== rng.startContainer) {
				rng.setStart(textNodeArr[0], 0);
			}
			const lastTextNode = textNodeArr[textNodeArr.length - 1];
			if (lastTextNode !== rng.endContainer) {
				rng.setEnd(lastTextNode, lastTextNode.data.length);
			}
			rngArr.push(rng);
		}
		return rngArr;
	}
	
	function getSelectionDirection(selection) {
		const lastRange = selection.getRangeAt(selection.rangeCount - 1);
		if (lastRange.startContainer === selection.anchorNode
				&& lastRange.startOffset === selection.anchorOffset) {
			return 'forward';
		} else {
			return 'backward';
		}
	}
	
	function getSelectionStart(range, selectionDirection) {
		const newRange = document.createRange();
		if (selectionDirection === 'forward') {
			newRange.setStart(range.startContainer, range.startOffset);
			newRange.setEnd(range.startContainer, range.startOffset);
		} else {
			newRange.setStart(range.endContainer, range.endOffset);
			newRange.setEnd(range.endContainer, range.endOffset);
		}
		const rect = newRange.getBoundingClientRect();
		return {
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom
		}
	}
	
	function getSelectionEnd(range, selectionDirection) {
		const newRange = document.createRange();
		if (selectionDirection === 'forward') {
			newRange.setStart(range.endContainer, range.endOffset);
			newRange.setEnd(range.endContainer, range.endOffset);
		} else {
			newRange.setStart(range.startContainer, range.startOffset);
			newRange.setEnd(range.startContainer, range.startOffset);
		}
		const rect = newRange.getBoundingClientRect();
		return {
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom
		}
	}
}
