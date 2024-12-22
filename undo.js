"use strict"
(function (root, undo) {
    if (typeof define === 'function' && define.amd) {
        define([], undo);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = undo();
    } else {
        root.undo = undo();
    }
}
(this, function(){
	var UndoObject = function(elem, param, events){
		param = param || {};
		this.disconnect = function(){
			for(var i in events){
				if(events.hasOwnProperty(i)){
					elem.removeEventListener(i, events[i]);
				}
			}
		}
	}
	var waitToRemoveEmptyComments = function(target){
		var observer = new MutationObserver(function(mutations, observer){
			var foundNodes = [];
			outside: for(var i=0, mutation;i<mutations.length;i++){
				mutation = mutations[i];
				var addedNodes = mutation.addedNodes;
				if(!addedNodes){continue;}
				for(var j=0;j<addedNodes.length;j++){
					if(addedNodes[j].nodeType == 8 && !addedNodes[j].data){
						foundNodes.push(addedNodes[j]);
						if(foundNodes.length >= 2){
							break outside;
						}
					}
				}
			}
			observer.disconnect();
			if(foundNodes.length < 1){return false;}
			for(var i=0;i<foundNodes.length;i++){
				foundNodes[i].remove();
			}
		});
		observer.observe(target, { childList: true, subtree: true });
	}
	var enableUndoRedo = async function(target){
		var tagName = target.tagName.toUpperCase();
		var canUndo = document.queryCommandEnabled("undo");
		var canRedo = document.queryCommandEnabled("redo");
		if(this.isPlainText(target)){
			return new Promise((resolve) => {
				if(canUndo && canRedo){resolve(false);}
				var selectionStart = target.selectionStart,
				selectionEnd = target.selectionEnd,
				selectionDirection = target.selectionDirection;
				if(!canUndo){
					target.selectionStart = target.selectionEnd = 0;
					document.execCommand("insertText", false, "\u200B");
					target.selectionStart = 0;
					target.selectionEnd = 1;
					document.execCommand("cut");
					target.selectionStart = selectionStart;
					target.selectionEnd = selectionEnd;
					target.selectionDirection = selectionDirection;
				}
				if(!canRedo){
					document.execCommand("insertText", false, "\u200B");
					document.execCommand("undo");
				}
				resolve(true);
			});
		}
		return new Promise((resolve) => {
			if(canUndo && canRedo){resolve(false);}
			var observer = new MutationObserver(function(mutations, observer){
				var foundNodes = [];
				outside: for(var i=0, mutation;i<mutations.length;i++){
					mutation = mutations[i];
					var addedNodes = mutation.addedNodes;
					if(!addedNodes){continue;}
					for(var j=0;j<addedNodes.length;j++){
						if(addedNodes[j].nodeType == 8 && !addedNodes[j].data){
							foundNodes.push(addedNodes[j]);
							if(foundNodes.length >= 2){
								break outside;
							}
						}
					}
				}
				observer.disconnect();
				if(foundNodes.length < 1){resolve(false);return false;}
				for(var i=0;i<foundNodes.length;i++){
					foundNodes[i].remove();
				}
				resolve(true);
			});
			observer.observe(target, { childList: true, subtree: true });
			if(!canUndo){
				document.execCommand("insertHTML", false, "<!---->");
			}
			if(!canRedo){
				document.execCommand("insertHTML", false, "<!---->");
				document.execCommand("undo");
			}
		});
	}
	var undo = new (function(){
		var inputEventsObserved = new Set();
		this.observe = function(elem, param){
			param = param || {};
			param.captureAll = !!(!("captureAll" in param) || param.captureAll)
			var inbeforeInputHandler = beforeInputHandler.bind(this, elem, param);
			var ininputHandler = inputHandler.bind(this, elem, param);
			var infocusinHandler = focusinHandler.bind(this, elem, param);
			var inkeydownHandler = keydownHandler.bind(this, elem, param);
			var inkeyupHandler = keyupHandler.bind(this, elem, param);
			elem.addEventListener("beforeinput", inbeforeInputHandler, false);														elem.addEventListener("input", ininputHandler, false);
			elem.addEventListener("focusin", infocusinHandler, false);
			elem.addEventListener("keydown", inkeydownHandler, false);
			elem.addEventListener("keyup", inkeyupHandler, false);
			return new UndoObject(elem, param, {
				"beforeinput":inbeforeInputHandler,
				"input":ininputHandler,
				"focusin":infocusinHandler,
				"keydown":inkeydownHandler,
				"keyup":inkeyupHandler
			});
		}
		this.isPlainText = function(elem){
			if(elem.tagName){
				var tagName = elem.tagName.toUpperCase();
				if(tagName == "INPUT" || tagName == "TEXTAREA"){
					return true;
				}
				else if(elem.contentEditable == "plaintext-only"){
					return true;
				}
				else if(elem.contentEditable == "inherit"){
					var parent = elem.parentElement && elem.parentElement.closest("[contenteditable]");
					if(parent && parent.contentEditable == "plaintext-only"){
						return true;
					}
				}
				return false;
			}
			return false;
		}
		var beforeInputHandler = function(elem, param){
			var e = window.event;
			if(!e.isTrusted && !param.allowUntrusted){return false};
			var type = e.inputType;
			var tagName = e.target.tagName.toUpperCase();
			if(type == "historyUndo" || type == "historyRedo"){
				if(type == "historyRedo" && !param.preventDefault && param.captureAll){
					waitToRemoveEmptyComments(e.target);
				}
				var evnt = new CustomEvent("before" + (type == "historyUndo" ? "undo" : "redo"), {
					detail: {
						originalEvent:e,
						shortcut: lastKey == (type == "historyUndo" ? "z" : "y")
					},
				});
				var returnValue = e.target.dispatchEvent(evnt);
				inputEventsObserved.add(e.target);
				if(param.preventDefault || returnValue){
					e.preventDefault();
					inputHandler.call(this, elem, param, true);
				}
			}

		}
		var lastKey = null;
		var keydownHandler = function(elem, param){
			var e = window.event;
			lastKey = e.key;
		}
		var keyupHandler = function(elem, param){
			lastkey = null;
		}
		var focusinHandler = function(elem, param){
			var e = window.event;
			var undoNext = document.queryCommandEnabled("undo") && document.queryCommandEnabled("redo");
			if(!undoNext && param.captureAll){
				enableUndoRedo.call(this, e.target);
			}
		}
		var inputHandler = async function(elem, param, force){
			var e = window.event;
			if(!e.isTrusted && !param.allowUntrusted){return false;}
			if(!inputEventsObserved.has(e.target)){return false;}
			inputEventsObserved.delete(e.target);
			if(this.isPlainText(e.target) && !force && param.captureAll){
				if(e.target.selectionStart && e.target.selectionEnd && e.target.value[0] == "\u200B"){
					document.execCommand("undo");
				}
			}
			var type = e.inputType;
			if(param.captureAll){
					var modified = await enableUndoRedo.call(this, e.target);
					var evnt = new CustomEvent((type == "historyUndo" ? "undo" : "redo"), {
						detail: {
							modified:modified,
							originalEvent:e,
							shortcut: lastKey == (type == "historyUndo" ? "z" : "y")
						},
					});
					e.target.dispatchEvent(evnt);

			}
			else{
				var evnt = new CustomEvent((type == "historyUndo" ? "undo" : "redo"), {
					detail: {
						originalEvent:e,
						shortcut: lastKey == (type == "historyUndo" ? "z" : "y")
					},
				});
				e.target.dispatchEvent(evnt);
			}
		}
	})();
	return undo;
}));