## Introduction

**undo.js** allows to detect undo and redo actions on contenteditable elements, textareas and inputs elements by calling custom events `onbeforeundo`, `undo`, `onbeforeredo` and `onredo`. It is then possible to monitor these events using `addEventListener`.

By default, **undo.js** will force-enable undo and redo actions, meaning that such actions will be detectable, and events will be triggered, even if there no action to undo/redo. In the context menu of the browser (right-click), undo and redo buttons will be enabled.

## undo.observe(element, param)

Calling `undo.observe(HTMLElement element, Optional Object param)` on an element will monitor events and allow the custom events `onbeforeundo`, `undo`, `onbeforeredo` and `onredo` for all children using `addEventListener`.

The optional argument `param` can have the following properties:

**allowUntrusted** (default: `false`) : If set to `false`, the library will ignore all events that are not from the browser. If you would like the library to react to `dispatchEvent`, it should be set to `true`.

**captureAll** (default: `true`) : Whether to force undo and redo to be enabled even if there is nothing to undo or redo. If set to `true`, in the context menu of the browser, undo and redo will always be enabled. If set to `false`, undo and redo events will be only be captured if there is, indeed, something to undo or redo.

**preventDefault** (default: `false`) : Whether to prevent the default behaviour of undo and redo events. It can be useful if you want to implement your own undo/redo stack. You can also call `event.preventDefault()` in a `beforeundo` or `beforeredo` event. `undo` and `redo` events are still triggered even if the action was default-prevented.

This table can be useful:

|   | preventDefault = false (default)   | preventDefault = true   |
| ------------ | ------------ | ------------ |
| **captureAll = true** (default)  | Undo and redo events are enabled and captured even if such action would not be possible (ex: there is nothing to undo or redo)  |  Undo and redo events are enabled and captured, but prevented, even if such action would not be possible (ex: there is nothing to undo or redo). |
| **captureAll = false**  | Undo and redo events are captured when such action is possible.  | Undo and redo events are captured, but prevented, when such action is possible. As they are prevented, they will still be possible after the event is triggered.  |

`undo.observe()` returns an object will a single method: `.disconnect()`.

##Example:

```js

var observer = undo.observe(document.body, {
	allowUntrusted: false,
	captureAll: true,
	preventDefault:false
});
myelement.addEventListener("beforeundo", function(e){
})
myelement.addEventListener("undo", function(e){
	console.log(e.detail.shortcut) // whether the undo event was caused by a shortcut (CTRL+Z)
})
myelement.addEventListener("beforeredo", function(e){
})
myelement.addEventListener("redo", function(e){
})
```

## License

Released under MIT License.
