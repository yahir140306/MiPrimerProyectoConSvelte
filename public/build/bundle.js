
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }

    function unsafeStringify(arr, offset = 0) {
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = {
      randomUUID
    };

    function v4(options, buf, offset) {
      if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
      }

      options = options || {};
      const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return unsafeStringify(rnds);
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var noty = {exports: {}};

    /* 
      @package NOTY - Dependency-free notification library 
      @version version: 3.2.0-beta 
      @contributors https://github.com/needim/noty/graphs/contributors 
      @documentation Examples and Documentation - https://ned.im/noty 
      @license Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php 
    */

    (function (module, exports) {
    	(function webpackUniversalModuleDefinition(root, factory) {
    		module.exports = factory();
    	})(commonjsGlobal, function() {
    	return /******/ (function(modules) { // webpackBootstrap
    	/******/ 	// The module cache
    	/******/ 	var installedModules = {};
    	/******/
    	/******/ 	// The require function
    	/******/ 	function __webpack_require__(moduleId) {
    	/******/
    	/******/ 		// Check if module is in cache
    	/******/ 		if(installedModules[moduleId]) {
    	/******/ 			return installedModules[moduleId].exports;
    	/******/ 		}
    	/******/ 		// Create a new module (and put it into the cache)
    	/******/ 		var module = installedModules[moduleId] = {
    	/******/ 			i: moduleId,
    	/******/ 			l: false,
    	/******/ 			exports: {}
    	/******/ 		};
    	/******/
    	/******/ 		// Execute the module function
    	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    	/******/
    	/******/ 		// Flag the module as loaded
    	/******/ 		module.l = true;
    	/******/
    	/******/ 		// Return the exports of the module
    	/******/ 		return module.exports;
    	/******/ 	}
    	/******/
    	/******/
    	/******/ 	// expose the modules object (__webpack_modules__)
    	/******/ 	__webpack_require__.m = modules;
    	/******/
    	/******/ 	// expose the module cache
    	/******/ 	__webpack_require__.c = installedModules;
    	/******/
    	/******/ 	// identity function for calling harmony imports with the correct context
    	/******/ 	__webpack_require__.i = function(value) { return value; };
    	/******/
    	/******/ 	// define getter function for harmony exports
    	/******/ 	__webpack_require__.d = function(exports, name, getter) {
    	/******/ 		if(!__webpack_require__.o(exports, name)) {
    	/******/ 			Object.defineProperty(exports, name, {
    	/******/ 				configurable: false,
    	/******/ 				enumerable: true,
    	/******/ 				get: getter
    	/******/ 			});
    	/******/ 		}
    	/******/ 	};
    	/******/
    	/******/ 	// getDefaultExport function for compatibility with non-harmony modules
    	/******/ 	__webpack_require__.n = function(module) {
    	/******/ 		var getter = module && module.__esModule ?
    	/******/ 			function getDefault() { return module['default']; } :
    	/******/ 			function getModuleExports() { return module; };
    	/******/ 		__webpack_require__.d(getter, 'a', getter);
    	/******/ 		return getter;
    	/******/ 	};
    	/******/
    	/******/ 	// Object.prototype.hasOwnProperty.call
    	/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    	/******/
    	/******/ 	// __webpack_public_path__
    	/******/ 	__webpack_require__.p = "";
    	/******/
    	/******/ 	// Load entry module and return exports
    	/******/ 	return __webpack_require__(__webpack_require__.s = 6);
    	/******/ })
    	/************************************************************************/
    	/******/ ([
    	/* 0 */
    	/***/ (function(module, exports, __webpack_require__) {


    	Object.defineProperty(exports, "__esModule", {
    	  value: true
    	});
    	exports.css = exports.deepExtend = exports.animationEndEvents = undefined;

    	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    	exports.inArray = inArray;
    	exports.stopPropagation = stopPropagation;
    	exports.generateID = generateID;
    	exports.outerHeight = outerHeight;
    	exports.addListener = addListener;
    	exports.hasClass = hasClass;
    	exports.addClass = addClass;
    	exports.removeClass = removeClass;
    	exports.remove = remove;
    	exports.classList = classList;
    	exports.visibilityChangeFlow = visibilityChangeFlow;
    	exports.createAudioElements = createAudioElements;

    	var _api = __webpack_require__(1);

    	var API = _interopRequireWildcard(_api);

    	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

    	exports.animationEndEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

    	function inArray(needle, haystack, argStrict) {
    	  var key = void 0;
    	  var strict = !!argStrict;

    	  if (strict) {
    	    for (key in haystack) {
    	      if (haystack.hasOwnProperty(key) && haystack[key] === needle) {
    	        return true;
    	      }
    	    }
    	  } else {
    	    for (key in haystack) {
    	      if (haystack.hasOwnProperty(key) && haystack[key] === needle) {
    	        return true;
    	      }
    	    }
    	  }
    	  return false;
    	}

    	function stopPropagation(evt) {
    	  evt = evt || window.event;

    	  if (typeof evt.stopPropagation !== 'undefined') {
    	    evt.stopPropagation();
    	  } else {
    	    evt.cancelBubble = true;
    	  }
    	}

    	exports.deepExtend = function deepExtend(out) {
    	  out = out || {};

    	  for (var i = 1; i < arguments.length; i++) {
    	    var obj = arguments[i];

    	    if (!obj) continue;

    	    for (var key in obj) {
    	      if (obj.hasOwnProperty(key)) {
    	        if (Array.isArray(obj[key])) {
    	          out[key] = obj[key];
    	        } else if (_typeof(obj[key]) === 'object' && obj[key] !== null) {
    	          out[key] = deepExtend(out[key], obj[key]);
    	        } else {
    	          out[key] = obj[key];
    	        }
    	      }
    	    }
    	  }

    	  return out;
    	};

    	function generateID() {
    	  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    	  var id = 'noty_' + prefix + '_';

    	  id += 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    	    var r = Math.random() * 16 | 0;
    	    var v = c === 'x' ? r : r & 0x3 | 0x8;
    	    return v.toString(16);
    	  });

    	  return id;
    	}

    	function outerHeight(el) {
    	  var height = el.offsetHeight;
    	  var style = window.getComputedStyle(el);

    	  height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    	  return height;
    	}

    	exports.css = function () {
    	  var cssPrefixes = ['Webkit', 'O', 'Moz', 'ms'];
    	  var cssProps = {};

    	  function camelCase(string) {
    	    return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function (match, letter) {
    	      return letter.toUpperCase();
    	    });
    	  }

    	  function getVendorProp(name) {
    	    var style = document.body.style;
    	    if (name in style) return name;

    	    var i = cssPrefixes.length;
    	    var capName = name.charAt(0).toUpperCase() + name.slice(1);
    	    var vendorName = void 0;

    	    while (i--) {
    	      vendorName = cssPrefixes[i] + capName;
    	      if (vendorName in style) return vendorName;
    	    }

    	    return name;
    	  }

    	  function getStyleProp(name) {
    	    name = camelCase(name);
    	    return cssProps[name] || (cssProps[name] = getVendorProp(name));
    	  }

    	  function applyCss(element, prop, value) {
    	    prop = getStyleProp(prop);
    	    element.style[prop] = value;
    	  }

    	  return function (element, properties) {
    	    var args = arguments;
    	    var prop = void 0;
    	    var value = void 0;

    	    if (args.length === 2) {
    	      for (prop in properties) {
    	        if (properties.hasOwnProperty(prop)) {
    	          value = properties[prop];
    	          if (value !== undefined && properties.hasOwnProperty(prop)) {
    	            applyCss(element, prop, value);
    	          }
    	        }
    	      }
    	    } else {
    	      applyCss(element, args[1], args[2]);
    	    }
    	  };
    	}();

    	function addListener(el, events, cb) {
    	  var useCapture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    	  events = events.split(' ');
    	  for (var i = 0; i < events.length; i++) {
    	    if (document.addEventListener) {
    	      el.addEventListener(events[i], cb, useCapture);
    	    } else if (document.attachEvent) {
    	      el.attachEvent('on' + events[i], cb);
    	    }
    	  }
    	}

    	function hasClass(element, name) {
    	  var list = typeof element === 'string' ? element : classList(element);
    	  return list.indexOf(' ' + name + ' ') >= 0;
    	}

    	function addClass(element, name) {
    	  var oldList = classList(element);
    	  var newList = oldList + name;

    	  if (hasClass(oldList, name)) return;

    	  // Trim the opening space.
    	  element.className = newList.substring(1);
    	}

    	function removeClass(element, name) {
    	  var oldList = classList(element);
    	  var newList = void 0;

    	  if (!hasClass(element, name)) return;

    	  // Replace the class name.
    	  newList = oldList.replace(' ' + name + ' ', ' ');

    	  // Trim the opening and closing spaces.
    	  element.className = newList.substring(1, newList.length - 1);
    	}

    	function remove(element) {
    	  if (element.parentNode) {
    	    element.parentNode.removeChild(element);
    	  }
    	}

    	function classList(element) {
    	  return (' ' + (element && element.className || '') + ' ').replace(/\s+/gi, ' ');
    	}

    	function visibilityChangeFlow() {
    	  var hidden = void 0;
    	  var visibilityChange = void 0;
    	  if (typeof document.hidden !== 'undefined') {
    	    // Opera 12.10 and Firefox 18 and later support
    	    hidden = 'hidden';
    	    visibilityChange = 'visibilitychange';
    	  } else if (typeof document.msHidden !== 'undefined') {
    	    hidden = 'msHidden';
    	    visibilityChange = 'msvisibilitychange';
    	  } else if (typeof document.webkitHidden !== 'undefined') {
    	    hidden = 'webkitHidden';
    	    visibilityChange = 'webkitvisibilitychange';
    	  }

    	  function onVisibilityChange() {
    	    API.PageHidden = document[hidden];
    	    handleVisibilityChange();
    	  }

    	  function onBlur() {
    	    API.PageHidden = true;
    	    handleVisibilityChange();
    	  }

    	  function onFocus() {
    	    API.PageHidden = false;
    	    handleVisibilityChange();
    	  }

    	  function handleVisibilityChange() {
    	    if (API.PageHidden) stopAll();else resumeAll();
    	  }

    	  function stopAll() {
    	    setTimeout(function () {
    	      Object.keys(API.Store).forEach(function (id) {
    	        if (API.Store.hasOwnProperty(id)) {
    	          if (API.Store[id].options.visibilityControl) {
    	            API.Store[id].stop();
    	          }
    	        }
    	      });
    	    }, 100);
    	  }

    	  function resumeAll() {
    	    setTimeout(function () {
    	      Object.keys(API.Store).forEach(function (id) {
    	        if (API.Store.hasOwnProperty(id)) {
    	          if (API.Store[id].options.visibilityControl) {
    	            API.Store[id].resume();
    	          }
    	        }
    	      });
    	      API.queueRenderAll();
    	    }, 100);
    	  }

    	  if (visibilityChange) {
    	    addListener(document, visibilityChange, onVisibilityChange);
    	  }

    	  addListener(window, 'blur', onBlur);
    	  addListener(window, 'focus', onFocus);
    	}

    	function createAudioElements(ref) {
    	  if (ref.hasSound) {
    	    var audioElement = document.createElement('audio');

    	    ref.options.sounds.sources.forEach(function (s) {
    	      var source = document.createElement('source');
    	      source.src = s;
    	      source.type = 'audio/' + getExtension(s);
    	      audioElement.appendChild(source);
    	    });

    	    if (ref.barDom) {
    	      ref.barDom.appendChild(audioElement);
    	    } else {
    	      document.querySelector('body').appendChild(audioElement);
    	    }

    	    audioElement.volume = ref.options.sounds.volume;

    	    if (!ref.soundPlayed) {
    	      audioElement.play();
    	      ref.soundPlayed = true;
    	    }

    	    audioElement.onended = function () {
    	      remove(audioElement);
    	    };
    	  }
    	}

    	function getExtension(fileName) {
    	  return fileName.match(/\.([^.]+)$/)[1];
    	}

    	/***/ }),
    	/* 1 */
    	/***/ (function(module, exports, __webpack_require__) {


    	Object.defineProperty(exports, "__esModule", {
    	  value: true
    	});
    	exports.Defaults = exports.Store = exports.Queues = exports.DefaultMaxVisible = exports.docTitle = exports.DocModalCount = exports.PageHidden = undefined;
    	exports.getQueueCounts = getQueueCounts;
    	exports.addToQueue = addToQueue;
    	exports.removeFromQueue = removeFromQueue;
    	exports.queueRender = queueRender;
    	exports.queueRenderAll = queueRenderAll;
    	exports.ghostFix = ghostFix;
    	exports.build = build;
    	exports.hasButtons = hasButtons;
    	exports.handleModal = handleModal;
    	exports.handleModalClose = handleModalClose;
    	exports.queueClose = queueClose;
    	exports.dequeueClose = dequeueClose;
    	exports.fire = fire;
    	exports.openFlow = openFlow;
    	exports.closeFlow = closeFlow;

    	var _utils = __webpack_require__(0);

    	var Utils = _interopRequireWildcard(_utils);

    	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

    	exports.PageHidden = false;
    	var DocModalCount = exports.DocModalCount = 0;

    	var DocTitleProps = {
    	  originalTitle: null,
    	  count: 0,
    	  changed: false,
    	  timer: -1
    	};

    	var docTitle = exports.docTitle = {
    	  increment: function increment() {
    	    DocTitleProps.count++;

    	    docTitle._update();
    	  },

    	  decrement: function decrement() {
    	    DocTitleProps.count--;

    	    if (DocTitleProps.count <= 0) {
    	      docTitle._clear();
    	      return;
    	    }

    	    docTitle._update();
    	  },

    	  _update: function _update() {
    	    var title = document.title;

    	    if (!DocTitleProps.changed) {
    	      DocTitleProps.originalTitle = title;
    	      document.title = '(' + DocTitleProps.count + ') ' + title;
    	      DocTitleProps.changed = true;
    	    } else {
    	      document.title = '(' + DocTitleProps.count + ') ' + DocTitleProps.originalTitle;
    	    }
    	  },

    	  _clear: function _clear() {
    	    if (DocTitleProps.changed) {
    	      DocTitleProps.count = 0;
    	      document.title = DocTitleProps.originalTitle;
    	      DocTitleProps.changed = false;
    	    }
    	  }
    	};

    	var DefaultMaxVisible = exports.DefaultMaxVisible = 5;

    	var Queues = exports.Queues = {
    	  global: {
    	    maxVisible: DefaultMaxVisible,
    	    queue: []
    	  }
    	};

    	var Store = exports.Store = {};

    	exports.Defaults = {
    	  type: 'alert',
    	  layout: 'topRight',
    	  theme: 'mint',
    	  text: '',
    	  timeout: false,
    	  progressBar: true,
    	  closeWith: ['click'],
    	  animation: {
    	    open: 'noty_effects_open',
    	    close: 'noty_effects_close'
    	  },
    	  id: false,
    	  force: false,
    	  killer: false,
    	  queue: 'global',
    	  container: false,
    	  buttons: [],
    	  callbacks: {
    	    beforeShow: null,
    	    onShow: null,
    	    afterShow: null,
    	    onClose: null,
    	    afterClose: null,
    	    onClick: null,
    	    onHover: null,
    	    onTemplate: null
    	  },
    	  sounds: {
    	    sources: [],
    	    volume: 1,
    	    conditions: []
    	  },
    	  titleCount: {
    	    conditions: []
    	  },
    	  modal: false,
    	  visibilityControl: false

    	  /**
    	   * @param {string} queueName
    	   * @return {object}
    	   */
    	};function getQueueCounts() {
    	  var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'global';

    	  var count = 0;
    	  var max = DefaultMaxVisible;

    	  if (Queues.hasOwnProperty(queueName)) {
    	    max = Queues[queueName].maxVisible;
    	    Object.keys(Store).forEach(function (i) {
    	      if (Store[i].options.queue === queueName && !Store[i].closed) count++;
    	    });
    	  }

    	  return {
    	    current: count,
    	    maxVisible: max
    	  };
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function addToQueue(ref) {
    	  if (!Queues.hasOwnProperty(ref.options.queue)) {
    	    Queues[ref.options.queue] = { maxVisible: DefaultMaxVisible, queue: [] };
    	  }

    	  Queues[ref.options.queue].queue.push(ref);
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function removeFromQueue(ref) {
    	  if (Queues.hasOwnProperty(ref.options.queue)) {
    	    var queue = [];
    	    Object.keys(Queues[ref.options.queue].queue).forEach(function (i) {
    	      if (Queues[ref.options.queue].queue[i].id !== ref.id) {
    	        queue.push(Queues[ref.options.queue].queue[i]);
    	      }
    	    });
    	    Queues[ref.options.queue].queue = queue;
    	  }
    	}

    	/**
    	 * @param {string} queueName
    	 * @return {void}
    	 */
    	function queueRender() {
    	  var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'global';

    	  if (Queues.hasOwnProperty(queueName)) {
    	    var noty = Queues[queueName].queue.shift();

    	    if (noty) noty.show();
    	  }
    	}

    	/**
    	 * @return {void}
    	 */
    	function queueRenderAll() {
    	  Object.keys(Queues).forEach(function (queueName) {
    	    queueRender(queueName);
    	  });
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function ghostFix(ref) {
    	  var ghostID = Utils.generateID('ghost');
    	  var ghost = document.createElement('div');
    	  ghost.setAttribute('id', ghostID);
    	  Utils.css(ghost, {
    	    height: Utils.outerHeight(ref.barDom) + 'px'
    	  });

    	  ref.barDom.insertAdjacentHTML('afterend', ghost.outerHTML);

    	  Utils.remove(ref.barDom);
    	  ghost = document.getElementById(ghostID);
    	  Utils.addClass(ghost, 'noty_fix_effects_height');
    	  Utils.addListener(ghost, Utils.animationEndEvents, function () {
    	    Utils.remove(ghost);
    	  });
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function build(ref) {
    	  findOrCreateContainer(ref);

    	  var markup = '<div class="noty_body">' + ref.options.text + '</div>' + buildButtons(ref) + '<div class="noty_progressbar"></div>';

    	  ref.barDom = document.createElement('div');
    	  ref.barDom.setAttribute('id', ref.id);
    	  Utils.addClass(ref.barDom, 'noty_bar noty_type__' + ref.options.type + ' noty_theme__' + ref.options.theme);

    	  ref.barDom.innerHTML = markup;

    	  fire(ref, 'onTemplate');
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {boolean}
    	 */
    	function hasButtons(ref) {
    	  return !!(ref.options.buttons && Object.keys(ref.options.buttons).length);
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {string}
    	 */
    	function buildButtons(ref) {
    	  if (hasButtons(ref)) {
    	    var buttons = document.createElement('div');
    	    Utils.addClass(buttons, 'noty_buttons');

    	    Object.keys(ref.options.buttons).forEach(function (key) {
    	      buttons.appendChild(ref.options.buttons[key].dom);
    	    });

    	    ref.options.buttons.forEach(function (btn) {
    	      buttons.appendChild(btn.dom);
    	    });
    	    return buttons.outerHTML;
    	  }
    	  return '';
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function handleModal(ref) {
    	  if (ref.options.modal) {
    	    if (DocModalCount === 0) {
    	      createModal();
    	    }

    	    exports.DocModalCount = DocModalCount += 1;
    	  }
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function handleModalClose(ref) {
    	  if (ref.options.modal && DocModalCount > 0) {
    	    exports.DocModalCount = DocModalCount -= 1;

    	    if (DocModalCount <= 0) {
    	      var modal = document.querySelector('.noty_modal');

    	      if (modal) {
    	        Utils.removeClass(modal, 'noty_modal_open');
    	        Utils.addClass(modal, 'noty_modal_close');
    	        Utils.addListener(modal, Utils.animationEndEvents, function () {
    	          Utils.remove(modal);
    	        });
    	      }
    	    }
    	  }
    	}

    	/**
    	 * @return {void}
    	 */
    	function createModal() {
    	  var body = document.querySelector('body');
    	  var modal = document.createElement('div');
    	  Utils.addClass(modal, 'noty_modal');
    	  body.insertBefore(modal, body.firstChild);
    	  Utils.addClass(modal, 'noty_modal_open');

    	  Utils.addListener(modal, Utils.animationEndEvents, function () {
    	    Utils.removeClass(modal, 'noty_modal_open');
    	  });
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function findOrCreateContainer(ref) {
    	  if (ref.options.container) {
    	    ref.layoutDom = document.querySelector(ref.options.container);
    	    return;
    	  }

    	  var layoutID = 'noty_layout__' + ref.options.layout;
    	  ref.layoutDom = document.querySelector('div#' + layoutID);

    	  if (!ref.layoutDom) {
    	    ref.layoutDom = document.createElement('div');
    	    ref.layoutDom.setAttribute('id', layoutID);
    	    ref.layoutDom.setAttribute('role', 'alert');
    	    ref.layoutDom.setAttribute('aria-live', 'polite');
    	    Utils.addClass(ref.layoutDom, 'noty_layout');
    	    document.querySelector('body').appendChild(ref.layoutDom);
    	  }
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function queueClose(ref) {
    	  if (ref.options.timeout) {
    	    if (ref.options.progressBar && ref.progressDom) {
    	      Utils.css(ref.progressDom, {
    	        transition: 'width ' + ref.options.timeout + 'ms linear',
    	        width: '0%'
    	      });
    	    }

    	    clearTimeout(ref.closeTimer);

    	    ref.closeTimer = setTimeout(function () {
    	      ref.close();
    	    }, ref.options.timeout);
    	  }
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function dequeueClose(ref) {
    	  if (ref.options.timeout && ref.closeTimer) {
    	    clearTimeout(ref.closeTimer);
    	    ref.closeTimer = -1;

    	    if (ref.options.progressBar && ref.progressDom) {
    	      Utils.css(ref.progressDom, {
    	        transition: 'width 0ms linear',
    	        width: '100%'
    	      });
    	    }
    	  }
    	}

    	/**
    	 * @param {Noty} ref
    	 * @param {string} eventName
    	 * @return {void}
    	 */
    	function fire(ref, eventName) {
    	  if (ref.listeners.hasOwnProperty(eventName)) {
    	    ref.listeners[eventName].forEach(function (cb) {
    	      if (typeof cb === 'function') {
    	        cb.apply(ref);
    	      }
    	    });
    	  }
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function openFlow(ref) {
    	  fire(ref, 'afterShow');
    	  queueClose(ref);

    	  Utils.addListener(ref.barDom, 'mouseenter', function () {
    	    dequeueClose(ref);
    	  });

    	  Utils.addListener(ref.barDom, 'mouseleave', function () {
    	    queueClose(ref);
    	  });
    	}

    	/**
    	 * @param {Noty} ref
    	 * @return {void}
    	 */
    	function closeFlow(ref) {
    	  delete Store[ref.id];
    	  ref.closing = false;
    	  fire(ref, 'afterClose');

    	  Utils.remove(ref.barDom);

    	  if (ref.layoutDom.querySelectorAll('.noty_bar').length === 0 && !ref.options.container) {
    	    Utils.remove(ref.layoutDom);
    	  }

    	  if (Utils.inArray('docVisible', ref.options.titleCount.conditions) || Utils.inArray('docHidden', ref.options.titleCount.conditions)) {
    	    docTitle.decrement();
    	  }

    	  queueRender(ref.options.queue);
    	}

    	/***/ }),
    	/* 2 */
    	/***/ (function(module, exports, __webpack_require__) {


    	Object.defineProperty(exports, "__esModule", {
    	  value: true
    	});
    	exports.NotyButton = undefined;

    	var _utils = __webpack_require__(0);

    	var Utils = _interopRequireWildcard(_utils);

    	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

    	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    	exports.NotyButton = function NotyButton(html, classes, cb) {
    	  var _this = this;

    	  var attributes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    	  _classCallCheck(this, NotyButton);

    	  this.dom = document.createElement('button');
    	  this.dom.innerHTML = html;
    	  this.id = attributes.id = attributes.id || Utils.generateID('button');
    	  this.cb = cb;
    	  Object.keys(attributes).forEach(function (propertyName) {
    	    _this.dom.setAttribute(propertyName, attributes[propertyName]);
    	  });
    	  Utils.addClass(this.dom, classes || 'noty_btn');

    	  return this;
    	};

    	/***/ }),
    	/* 3 */
    	/***/ (function(module, exports, __webpack_require__) {


    	Object.defineProperty(exports, "__esModule", {
    	  value: true
    	});

    	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    	exports.Push = function () {
    	  function Push() {
    	    var workerPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/service-worker.js';

    	    _classCallCheck(this, Push);

    	    this.subData = {};
    	    this.workerPath = workerPath;
    	    this.listeners = {
    	      onPermissionGranted: [],
    	      onPermissionDenied: [],
    	      onSubscriptionSuccess: [],
    	      onSubscriptionCancel: [],
    	      onWorkerError: [],
    	      onWorkerSuccess: [],
    	      onWorkerNotSupported: []
    	    };
    	    return this;
    	  }

    	  /**
    	   * @param {string} eventName
    	   * @param {function} cb
    	   * @return {Push}
    	   */


    	  _createClass(Push, [{
    	    key: 'on',
    	    value: function on(eventName) {
    	      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

    	      if (typeof cb === 'function' && this.listeners.hasOwnProperty(eventName)) {
    	        this.listeners[eventName].push(cb);
    	      }

    	      return this;
    	    }
    	  }, {
    	    key: 'fire',
    	    value: function fire(eventName) {
    	      var _this = this;

    	      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    	      if (this.listeners.hasOwnProperty(eventName)) {
    	        this.listeners[eventName].forEach(function (cb) {
    	          if (typeof cb === 'function') {
    	            cb.apply(_this, params);
    	          }
    	        });
    	      }
    	    }
    	  }, {
    	    key: 'create',
    	    value: function create() {
    	      console.log('NOT IMPLEMENTED YET');
    	    }

    	    /**
    	     * @return {boolean}
    	     */

    	  }, {
    	    key: 'isSupported',
    	    value: function isSupported() {
    	      var result = false;

    	      try {
    	        result = window.Notification || window.webkitNotifications || navigator.mozNotification || window.external && window.external.msIsSiteMode() !== undefined;
    	      } catch (e) {}

    	      return result;
    	    }

    	    /**
    	     * @return {string}
    	     */

    	  }, {
    	    key: 'getPermissionStatus',
    	    value: function getPermissionStatus() {
    	      var perm = 'default';

    	      if (window.Notification && window.Notification.permissionLevel) {
    	        perm = window.Notification.permissionLevel;
    	      } else if (window.webkitNotifications && window.webkitNotifications.checkPermission) {
    	        switch (window.webkitNotifications.checkPermission()) {
    	          case 1:
    	            perm = 'default';
    	            break;
    	          case 0:
    	            perm = 'granted';
    	            break;
    	          default:
    	            perm = 'denied';
    	        }
    	      } else if (window.Notification && window.Notification.permission) {
    	        perm = window.Notification.permission;
    	      } else if (navigator.mozNotification) {
    	        perm = 'granted';
    	      } else if (window.external && window.external.msIsSiteMode() !== undefined) {
    	        perm = window.external.msIsSiteMode() ? 'granted' : 'default';
    	      }

    	      return perm.toString().toLowerCase();
    	    }

    	    /**
    	     * @return {string}
    	     */

    	  }, {
    	    key: 'getEndpoint',
    	    value: function getEndpoint(subscription) {
    	      var endpoint = subscription.endpoint;
    	      var subscriptionId = subscription.subscriptionId;

    	      // fix for Chrome < 45
    	      if (subscriptionId && endpoint.indexOf(subscriptionId) === -1) {
    	        endpoint += '/' + subscriptionId;
    	      }

    	      return endpoint;
    	    }

    	    /**
    	     * @return {boolean}
    	     */

    	  }, {
    	    key: 'isSWRegistered',
    	    value: function isSWRegistered() {
    	      try {
    	        return navigator.serviceWorker.controller.state === 'activated';
    	      } catch (e) {
    	        return false;
    	      }
    	    }

    	    /**
    	     * @return {void}
    	     */

    	  }, {
    	    key: 'unregisterWorker',
    	    value: function unregisterWorker() {
    	      var self = this;
    	      if ('serviceWorker' in navigator) {
    	        navigator.serviceWorker.getRegistrations().then(function (registrations) {
    	          var _iteratorNormalCompletion = true;
    	          var _didIteratorError = false;
    	          var _iteratorError = undefined;

    	          try {
    	            for (var _iterator = registrations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    	              var registration = _step.value;

    	              registration.unregister();
    	              self.fire('onSubscriptionCancel');
    	            }
    	          } catch (err) {
    	            _didIteratorError = true;
    	            _iteratorError = err;
    	          } finally {
    	            try {
    	              if (!_iteratorNormalCompletion && _iterator.return) {
    	                _iterator.return();
    	              }
    	            } finally {
    	              if (_didIteratorError) {
    	                throw _iteratorError;
    	              }
    	            }
    	          }
    	        });
    	      }
    	    }

    	    /**
    	     * @return {void}
    	     */

    	  }, {
    	    key: 'requestSubscription',
    	    value: function requestSubscription() {
    	      var _this2 = this;

    	      var userVisibleOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    	      var self = this;
    	      var current = this.getPermissionStatus();
    	      var cb = function cb(result) {
    	        if (result === 'granted') {
    	          _this2.fire('onPermissionGranted');

    	          if ('serviceWorker' in navigator) {
    	            navigator.serviceWorker.register(_this2.workerPath).then(function () {
    	              navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
    	                self.fire('onWorkerSuccess');
    	                serviceWorkerRegistration.pushManager.subscribe({
    	                  userVisibleOnly: userVisibleOnly
    	                }).then(function (subscription) {
    	                  var key = subscription.getKey('p256dh');
    	                  var token = subscription.getKey('auth');

    	                  self.subData = {
    	                    endpoint: self.getEndpoint(subscription),
    	                    p256dh: key ? window.btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null,
    	                    auth: token ? window.btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null
    	                  };

    	                  self.fire('onSubscriptionSuccess', [self.subData]);
    	                }).catch(function (err) {
    	                  self.fire('onWorkerError', [err]);
    	                });
    	              });
    	            });
    	          } else {
    	            self.fire('onWorkerNotSupported');
    	          }
    	        } else if (result === 'denied') {
    	          _this2.fire('onPermissionDenied');
    	          _this2.unregisterWorker();
    	        }
    	      };

    	      if (current === 'default') {
    	        if (window.Notification && window.Notification.requestPermission) {
    	          window.Notification.requestPermission(cb);
    	        } else if (window.webkitNotifications && window.webkitNotifications.checkPermission) {
    	          window.webkitNotifications.requestPermission(cb);
    	        }
    	      } else {
    	        cb(current);
    	      }
    	    }
    	  }]);

    	  return Push;
    	}();

    	/***/ }),
    	/* 4 */
    	/***/ (function(module, exports, __webpack_require__) {

    	/* WEBPACK VAR INJECTION */(function(process, global) {var require;/*!
    	 * @overview es6-promise - a tiny implementation of Promises/A+.
    	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
    	 * @license   Licensed under MIT license
    	 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
    	 * @version   4.1.1
    	 */

    	(function (global, factory) {
    		 module.exports = factory() ;
    	}(this, (function () {
    	function objectOrFunction(x) {
    	  var type = typeof x;
    	  return x !== null && (type === 'object' || type === 'function');
    	}

    	function isFunction(x) {
    	  return typeof x === 'function';
    	}

    	var _isArray = undefined;
    	if (Array.isArray) {
    	  _isArray = Array.isArray;
    	} else {
    	  _isArray = function (x) {
    	    return Object.prototype.toString.call(x) === '[object Array]';
    	  };
    	}

    	var isArray = _isArray;

    	var len = 0;
    	var vertxNext = undefined;
    	var customSchedulerFn = undefined;

    	var asap = function asap(callback, arg) {
    	  queue[len] = callback;
    	  queue[len + 1] = arg;
    	  len += 2;
    	  if (len === 2) {
    	    // If len is 2, that means that we need to schedule an async flush.
    	    // If additional callbacks are queued before the queue is flushed, they
    	    // will be processed by this flush that we are scheduling.
    	    if (customSchedulerFn) {
    	      customSchedulerFn(flush);
    	    } else {
    	      scheduleFlush();
    	    }
    	  }
    	};

    	function setScheduler(scheduleFn) {
    	  customSchedulerFn = scheduleFn;
    	}

    	function setAsap(asapFn) {
    	  asap = asapFn;
    	}

    	var browserWindow = typeof window !== 'undefined' ? window : undefined;
    	var browserGlobal = browserWindow || {};
    	var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    	var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

    	// test for web worker but not in IE10
    	var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

    	// node
    	function useNextTick() {
    	  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
    	  // see https://github.com/cujojs/when/issues/410 for details
    	  return function () {
    	    return process.nextTick(flush);
    	  };
    	}

    	// vertx
    	function useVertxTimer() {
    	  if (typeof vertxNext !== 'undefined') {
    	    return function () {
    	      vertxNext(flush);
    	    };
    	  }

    	  return useSetTimeout();
    	}

    	function useMutationObserver() {
    	  var iterations = 0;
    	  var observer = new BrowserMutationObserver(flush);
    	  var node = document.createTextNode('');
    	  observer.observe(node, { characterData: true });

    	  return function () {
    	    node.data = iterations = ++iterations % 2;
    	  };
    	}

    	// web worker
    	function useMessageChannel() {
    	  var channel = new MessageChannel();
    	  channel.port1.onmessage = flush;
    	  return function () {
    	    return channel.port2.postMessage(0);
    	  };
    	}

    	function useSetTimeout() {
    	  // Store setTimeout reference so es6-promise will be unaffected by
    	  // other code modifying setTimeout (like sinon.useFakeTimers())
    	  var globalSetTimeout = setTimeout;
    	  return function () {
    	    return globalSetTimeout(flush, 1);
    	  };
    	}

    	var queue = new Array(1000);
    	function flush() {
    	  for (var i = 0; i < len; i += 2) {
    	    var callback = queue[i];
    	    var arg = queue[i + 1];

    	    callback(arg);

    	    queue[i] = undefined;
    	    queue[i + 1] = undefined;
    	  }

    	  len = 0;
    	}

    	function attemptVertx() {
    	  try {
    	    var r = require;
    	    var vertx = __webpack_require__(9);
    	    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    	    return useVertxTimer();
    	  } catch (e) {
    	    return useSetTimeout();
    	  }
    	}

    	var scheduleFlush = undefined;
    	// Decide what async method to use to triggering processing of queued callbacks:
    	if (isNode) {
    	  scheduleFlush = useNextTick();
    	} else if (BrowserMutationObserver) {
    	  scheduleFlush = useMutationObserver();
    	} else if (isWorker) {
    	  scheduleFlush = useMessageChannel();
    	} else if (browserWindow === undefined && "function" === 'function') {
    	  scheduleFlush = attemptVertx();
    	} else {
    	  scheduleFlush = useSetTimeout();
    	}

    	function then(onFulfillment, onRejection) {
    	  var _arguments = arguments;

    	  var parent = this;

    	  var child = new this.constructor(noop);

    	  if (child[PROMISE_ID] === undefined) {
    	    makePromise(child);
    	  }

    	  var _state = parent._state;

    	  if (_state) {
    	    (function () {
    	      var callback = _arguments[_state - 1];
    	      asap(function () {
    	        return invokeCallback(_state, child, callback, parent._result);
    	      });
    	    })();
    	  } else {
    	    subscribe(parent, child, onFulfillment, onRejection);
    	  }

    	  return child;
    	}

    	/**
    	  `Promise.resolve` returns a promise that will become resolved with the
    	  passed `value`. It is shorthand for the following:

    	  ```javascript
    	  let promise = new Promise(function(resolve, reject){
    	    resolve(1);
    	  });

    	  promise.then(function(value){
    	    // value === 1
    	  });
    	  ```

    	  Instead of writing the above, your code now simply becomes the following:

    	  ```javascript
    	  let promise = Promise.resolve(1);

    	  promise.then(function(value){
    	    // value === 1
    	  });
    	  ```

    	  @method resolve
    	  @static
    	  @param {Any} value value that the returned promise will be resolved with
    	  Useful for tooling.
    	  @return {Promise} a promise that will become fulfilled with the given
    	  `value`
    	*/
    	function resolve$1(object) {
    	  /*jshint validthis:true */
    	  var Constructor = this;

    	  if (object && typeof object === 'object' && object.constructor === Constructor) {
    	    return object;
    	  }

    	  var promise = new Constructor(noop);
    	  resolve(promise, object);
    	  return promise;
    	}

    	var PROMISE_ID = Math.random().toString(36).substring(16);

    	function noop() {}

    	var PENDING = void 0;
    	var FULFILLED = 1;
    	var REJECTED = 2;

    	var GET_THEN_ERROR = new ErrorObject();

    	function selfFulfillment() {
    	  return new TypeError("You cannot resolve a promise with itself");
    	}

    	function cannotReturnOwn() {
    	  return new TypeError('A promises callback cannot return that same promise.');
    	}

    	function getThen(promise) {
    	  try {
    	    return promise.then;
    	  } catch (error) {
    	    GET_THEN_ERROR.error = error;
    	    return GET_THEN_ERROR;
    	  }
    	}

    	function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
    	  try {
    	    then$$1.call(value, fulfillmentHandler, rejectionHandler);
    	  } catch (e) {
    	    return e;
    	  }
    	}

    	function handleForeignThenable(promise, thenable, then$$1) {
    	  asap(function (promise) {
    	    var sealed = false;
    	    var error = tryThen(then$$1, thenable, function (value) {
    	      if (sealed) {
    	        return;
    	      }
    	      sealed = true;
    	      if (thenable !== value) {
    	        resolve(promise, value);
    	      } else {
    	        fulfill(promise, value);
    	      }
    	    }, function (reason) {
    	      if (sealed) {
    	        return;
    	      }
    	      sealed = true;

    	      reject(promise, reason);
    	    }, 'Settle: ' + (promise._label || ' unknown promise'));

    	    if (!sealed && error) {
    	      sealed = true;
    	      reject(promise, error);
    	    }
    	  }, promise);
    	}

    	function handleOwnThenable(promise, thenable) {
    	  if (thenable._state === FULFILLED) {
    	    fulfill(promise, thenable._result);
    	  } else if (thenable._state === REJECTED) {
    	    reject(promise, thenable._result);
    	  } else {
    	    subscribe(thenable, undefined, function (value) {
    	      return resolve(promise, value);
    	    }, function (reason) {
    	      return reject(promise, reason);
    	    });
    	  }
    	}

    	function handleMaybeThenable(promise, maybeThenable, then$$1) {
    	  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    	    handleOwnThenable(promise, maybeThenable);
    	  } else {
    	    if (then$$1 === GET_THEN_ERROR) {
    	      reject(promise, GET_THEN_ERROR.error);
    	      GET_THEN_ERROR.error = null;
    	    } else if (then$$1 === undefined) {
    	      fulfill(promise, maybeThenable);
    	    } else if (isFunction(then$$1)) {
    	      handleForeignThenable(promise, maybeThenable, then$$1);
    	    } else {
    	      fulfill(promise, maybeThenable);
    	    }
    	  }
    	}

    	function resolve(promise, value) {
    	  if (promise === value) {
    	    reject(promise, selfFulfillment());
    	  } else if (objectOrFunction(value)) {
    	    handleMaybeThenable(promise, value, getThen(value));
    	  } else {
    	    fulfill(promise, value);
    	  }
    	}

    	function publishRejection(promise) {
    	  if (promise._onerror) {
    	    promise._onerror(promise._result);
    	  }

    	  publish(promise);
    	}

    	function fulfill(promise, value) {
    	  if (promise._state !== PENDING) {
    	    return;
    	  }

    	  promise._result = value;
    	  promise._state = FULFILLED;

    	  if (promise._subscribers.length !== 0) {
    	    asap(publish, promise);
    	  }
    	}

    	function reject(promise, reason) {
    	  if (promise._state !== PENDING) {
    	    return;
    	  }
    	  promise._state = REJECTED;
    	  promise._result = reason;

    	  asap(publishRejection, promise);
    	}

    	function subscribe(parent, child, onFulfillment, onRejection) {
    	  var _subscribers = parent._subscribers;
    	  var length = _subscribers.length;

    	  parent._onerror = null;

    	  _subscribers[length] = child;
    	  _subscribers[length + FULFILLED] = onFulfillment;
    	  _subscribers[length + REJECTED] = onRejection;

    	  if (length === 0 && parent._state) {
    	    asap(publish, parent);
    	  }
    	}

    	function publish(promise) {
    	  var subscribers = promise._subscribers;
    	  var settled = promise._state;

    	  if (subscribers.length === 0) {
    	    return;
    	  }

    	  var child = undefined,
    	      callback = undefined,
    	      detail = promise._result;

    	  for (var i = 0; i < subscribers.length; i += 3) {
    	    child = subscribers[i];
    	    callback = subscribers[i + settled];

    	    if (child) {
    	      invokeCallback(settled, child, callback, detail);
    	    } else {
    	      callback(detail);
    	    }
    	  }

    	  promise._subscribers.length = 0;
    	}

    	function ErrorObject() {
    	  this.error = null;
    	}

    	var TRY_CATCH_ERROR = new ErrorObject();

    	function tryCatch(callback, detail) {
    	  try {
    	    return callback(detail);
    	  } catch (e) {
    	    TRY_CATCH_ERROR.error = e;
    	    return TRY_CATCH_ERROR;
    	  }
    	}

    	function invokeCallback(settled, promise, callback, detail) {
    	  var hasCallback = isFunction(callback),
    	      value = undefined,
    	      error = undefined,
    	      succeeded = undefined,
    	      failed = undefined;

    	  if (hasCallback) {
    	    value = tryCatch(callback, detail);

    	    if (value === TRY_CATCH_ERROR) {
    	      failed = true;
    	      error = value.error;
    	      value.error = null;
    	    } else {
    	      succeeded = true;
    	    }

    	    if (promise === value) {
    	      reject(promise, cannotReturnOwn());
    	      return;
    	    }
    	  } else {
    	    value = detail;
    	    succeeded = true;
    	  }

    	  if (promise._state !== PENDING) ; else if (hasCallback && succeeded) {
    	      resolve(promise, value);
    	    } else if (failed) {
    	      reject(promise, error);
    	    } else if (settled === FULFILLED) {
    	      fulfill(promise, value);
    	    } else if (settled === REJECTED) {
    	      reject(promise, value);
    	    }
    	}

    	function initializePromise(promise, resolver) {
    	  try {
    	    resolver(function resolvePromise(value) {
    	      resolve(promise, value);
    	    }, function rejectPromise(reason) {
    	      reject(promise, reason);
    	    });
    	  } catch (e) {
    	    reject(promise, e);
    	  }
    	}

    	var id = 0;
    	function nextId() {
    	  return id++;
    	}

    	function makePromise(promise) {
    	  promise[PROMISE_ID] = id++;
    	  promise._state = undefined;
    	  promise._result = undefined;
    	  promise._subscribers = [];
    	}

    	function Enumerator$1(Constructor, input) {
    	  this._instanceConstructor = Constructor;
    	  this.promise = new Constructor(noop);

    	  if (!this.promise[PROMISE_ID]) {
    	    makePromise(this.promise);
    	  }

    	  if (isArray(input)) {
    	    this.length = input.length;
    	    this._remaining = input.length;

    	    this._result = new Array(this.length);

    	    if (this.length === 0) {
    	      fulfill(this.promise, this._result);
    	    } else {
    	      this.length = this.length || 0;
    	      this._enumerate(input);
    	      if (this._remaining === 0) {
    	        fulfill(this.promise, this._result);
    	      }
    	    }
    	  } else {
    	    reject(this.promise, validationError());
    	  }
    	}

    	function validationError() {
    	  return new Error('Array Methods must be provided an Array');
    	}

    	Enumerator$1.prototype._enumerate = function (input) {
    	  for (var i = 0; this._state === PENDING && i < input.length; i++) {
    	    this._eachEntry(input[i], i);
    	  }
    	};

    	Enumerator$1.prototype._eachEntry = function (entry, i) {
    	  var c = this._instanceConstructor;
    	  var resolve$$1 = c.resolve;

    	  if (resolve$$1 === resolve$1) {
    	    var _then = getThen(entry);

    	    if (_then === then && entry._state !== PENDING) {
    	      this._settledAt(entry._state, i, entry._result);
    	    } else if (typeof _then !== 'function') {
    	      this._remaining--;
    	      this._result[i] = entry;
    	    } else if (c === Promise$2) {
    	      var promise = new c(noop);
    	      handleMaybeThenable(promise, entry, _then);
    	      this._willSettleAt(promise, i);
    	    } else {
    	      this._willSettleAt(new c(function (resolve$$1) {
    	        return resolve$$1(entry);
    	      }), i);
    	    }
    	  } else {
    	    this._willSettleAt(resolve$$1(entry), i);
    	  }
    	};

    	Enumerator$1.prototype._settledAt = function (state, i, value) {
    	  var promise = this.promise;

    	  if (promise._state === PENDING) {
    	    this._remaining--;

    	    if (state === REJECTED) {
    	      reject(promise, value);
    	    } else {
    	      this._result[i] = value;
    	    }
    	  }

    	  if (this._remaining === 0) {
    	    fulfill(promise, this._result);
    	  }
    	};

    	Enumerator$1.prototype._willSettleAt = function (promise, i) {
    	  var enumerator = this;

    	  subscribe(promise, undefined, function (value) {
    	    return enumerator._settledAt(FULFILLED, i, value);
    	  }, function (reason) {
    	    return enumerator._settledAt(REJECTED, i, reason);
    	  });
    	};

    	/**
    	  `Promise.all` accepts an array of promises, and returns a new promise which
    	  is fulfilled with an array of fulfillment values for the passed promises, or
    	  rejected with the reason of the first passed promise to be rejected. It casts all
    	  elements of the passed iterable to promises as it runs this algorithm.

    	  Example:

    	  ```javascript
    	  let promise1 = resolve(1);
    	  let promise2 = resolve(2);
    	  let promise3 = resolve(3);
    	  let promises = [ promise1, promise2, promise3 ];

    	  Promise.all(promises).then(function(array){
    	    // The array here would be [ 1, 2, 3 ];
    	  });
    	  ```

    	  If any of the `promises` given to `all` are rejected, the first promise
    	  that is rejected will be given as an argument to the returned promises's
    	  rejection handler. For example:

    	  Example:

    	  ```javascript
    	  let promise1 = resolve(1);
    	  let promise2 = reject(new Error("2"));
    	  let promise3 = reject(new Error("3"));
    	  let promises = [ promise1, promise2, promise3 ];

    	  Promise.all(promises).then(function(array){
    	    // Code here never runs because there are rejected promises!
    	  }, function(error) {
    	    // error.message === "2"
    	  });
    	  ```

    	  @method all
    	  @static
    	  @param {Array} entries array of promises
    	  @param {String} label optional string for labeling the promise.
    	  Useful for tooling.
    	  @return {Promise} promise that is fulfilled when all `promises` have been
    	  fulfilled, or rejected if any of them become rejected.
    	  @static
    	*/
    	function all$1(entries) {
    	  return new Enumerator$1(this, entries).promise;
    	}

    	/**
    	  `Promise.race` returns a new promise which is settled in the same way as the
    	  first passed promise to settle.

    	  Example:

    	  ```javascript
    	  let promise1 = new Promise(function(resolve, reject){
    	    setTimeout(function(){
    	      resolve('promise 1');
    	    }, 200);
    	  });

    	  let promise2 = new Promise(function(resolve, reject){
    	    setTimeout(function(){
    	      resolve('promise 2');
    	    }, 100);
    	  });

    	  Promise.race([promise1, promise2]).then(function(result){
    	    // result === 'promise 2' because it was resolved before promise1
    	    // was resolved.
    	  });
    	  ```

    	  `Promise.race` is deterministic in that only the state of the first
    	  settled promise matters. For example, even if other promises given to the
    	  `promises` array argument are resolved, but the first settled promise has
    	  become rejected before the other promises became fulfilled, the returned
    	  promise will become rejected:

    	  ```javascript
    	  let promise1 = new Promise(function(resolve, reject){
    	    setTimeout(function(){
    	      resolve('promise 1');
    	    }, 200);
    	  });

    	  let promise2 = new Promise(function(resolve, reject){
    	    setTimeout(function(){
    	      reject(new Error('promise 2'));
    	    }, 100);
    	  });

    	  Promise.race([promise1, promise2]).then(function(result){
    	    // Code here never runs
    	  }, function(reason){
    	    // reason.message === 'promise 2' because promise 2 became rejected before
    	    // promise 1 became fulfilled
    	  });
    	  ```

    	  An example real-world use case is implementing timeouts:

    	  ```javascript
    	  Promise.race([ajax('foo.json'), timeout(5000)])
    	  ```

    	  @method race
    	  @static
    	  @param {Array} promises array of promises to observe
    	  Useful for tooling.
    	  @return {Promise} a promise which settles in the same way as the first passed
    	  promise to settle.
    	*/
    	function race$1(entries) {
    	  /*jshint validthis:true */
    	  var Constructor = this;

    	  if (!isArray(entries)) {
    	    return new Constructor(function (_, reject) {
    	      return reject(new TypeError('You must pass an array to race.'));
    	    });
    	  } else {
    	    return new Constructor(function (resolve, reject) {
    	      var length = entries.length;
    	      for (var i = 0; i < length; i++) {
    	        Constructor.resolve(entries[i]).then(resolve, reject);
    	      }
    	    });
    	  }
    	}

    	/**
    	  `Promise.reject` returns a promise rejected with the passed `reason`.
    	  It is shorthand for the following:

    	  ```javascript
    	  let promise = new Promise(function(resolve, reject){
    	    reject(new Error('WHOOPS'));
    	  });

    	  promise.then(function(value){
    	    // Code here doesn't run because the promise is rejected!
    	  }, function(reason){
    	    // reason.message === 'WHOOPS'
    	  });
    	  ```

    	  Instead of writing the above, your code now simply becomes the following:

    	  ```javascript
    	  let promise = Promise.reject(new Error('WHOOPS'));

    	  promise.then(function(value){
    	    // Code here doesn't run because the promise is rejected!
    	  }, function(reason){
    	    // reason.message === 'WHOOPS'
    	  });
    	  ```

    	  @method reject
    	  @static
    	  @param {Any} reason value that the returned promise will be rejected with.
    	  Useful for tooling.
    	  @return {Promise} a promise rejected with the given `reason`.
    	*/
    	function reject$1(reason) {
    	  /*jshint validthis:true */
    	  var Constructor = this;
    	  var promise = new Constructor(noop);
    	  reject(promise, reason);
    	  return promise;
    	}

    	function needsResolver() {
    	  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    	}

    	function needsNew() {
    	  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    	}

    	/**
    	  Promise objects represent the eventual result of an asynchronous operation. The
    	  primary way of interacting with a promise is through its `then` method, which
    	  registers callbacks to receive either a promise's eventual value or the reason
    	  why the promise cannot be fulfilled.

    	  Terminology
    	  -----------

    	  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
    	  - `thenable` is an object or function that defines a `then` method.
    	  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
    	  - `exception` is a value that is thrown using the throw statement.
    	  - `reason` is a value that indicates why a promise was rejected.
    	  - `settled` the final resting state of a promise, fulfilled or rejected.

    	  A promise can be in one of three states: pending, fulfilled, or rejected.

    	  Promises that are fulfilled have a fulfillment value and are in the fulfilled
    	  state.  Promises that are rejected have a rejection reason and are in the
    	  rejected state.  A fulfillment value is never a thenable.

    	  Promises can also be said to *resolve* a value.  If this value is also a
    	  promise, then the original promise's settled state will match the value's
    	  settled state.  So a promise that *resolves* a promise that rejects will
    	  itself reject, and a promise that *resolves* a promise that fulfills will
    	  itself fulfill.


    	  Basic Usage:
    	  ------------

    	  ```js
    	  let promise = new Promise(function(resolve, reject) {
    	    // on success
    	    resolve(value);

    	    // on failure
    	    reject(reason);
    	  });

    	  promise.then(function(value) {
    	    // on fulfillment
    	  }, function(reason) {
    	    // on rejection
    	  });
    	  ```

    	  Advanced Usage:
    	  ---------------

    	  Promises shine when abstracting away asynchronous interactions such as
    	  `XMLHttpRequest`s.

    	  ```js
    	  function getJSON(url) {
    	    return new Promise(function(resolve, reject){
    	      let xhr = new XMLHttpRequest();

    	      xhr.open('GET', url);
    	      xhr.onreadystatechange = handler;
    	      xhr.responseType = 'json';
    	      xhr.setRequestHeader('Accept', 'application/json');
    	      xhr.send();

    	      function handler() {
    	        if (this.readyState === this.DONE) {
    	          if (this.status === 200) {
    	            resolve(this.response);
    	          } else {
    	            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
    	          }
    	        }
    	      };
    	    });
    	  }

    	  getJSON('/posts.json').then(function(json) {
    	    // on fulfillment
    	  }, function(reason) {
    	    // on rejection
    	  });
    	  ```

    	  Unlike callbacks, promises are great composable primitives.

    	  ```js
    	  Promise.all([
    	    getJSON('/posts'),
    	    getJSON('/comments')
    	  ]).then(function(values){
    	    values[0] // => postsJSON
    	    values[1] // => commentsJSON

    	    return values;
    	  });
    	  ```

    	  @class Promise
    	  @param {function} resolver
    	  Useful for tooling.
    	  @constructor
    	*/
    	function Promise$2(resolver) {
    	  this[PROMISE_ID] = nextId();
    	  this._result = this._state = undefined;
    	  this._subscribers = [];

    	  if (noop !== resolver) {
    	    typeof resolver !== 'function' && needsResolver();
    	    this instanceof Promise$2 ? initializePromise(this, resolver) : needsNew();
    	  }
    	}

    	Promise$2.all = all$1;
    	Promise$2.race = race$1;
    	Promise$2.resolve = resolve$1;
    	Promise$2.reject = reject$1;
    	Promise$2._setScheduler = setScheduler;
    	Promise$2._setAsap = setAsap;
    	Promise$2._asap = asap;

    	Promise$2.prototype = {
    	  constructor: Promise$2,

    	  /**
    	    The primary way of interacting with a promise is through its `then` method,
    	    which registers callbacks to receive either a promise's eventual value or the
    	    reason why the promise cannot be fulfilled.
    	  
    	    ```js
    	    findUser().then(function(user){
    	      // user is available
    	    }, function(reason){
    	      // user is unavailable, and you are given the reason why
    	    });
    	    ```
    	  
    	    Chaining
    	    --------
    	  
    	    The return value of `then` is itself a promise.  This second, 'downstream'
    	    promise is resolved with the return value of the first promise's fulfillment
    	    or rejection handler, or rejected if the handler throws an exception.
    	  
    	    ```js
    	    findUser().then(function (user) {
    	      return user.name;
    	    }, function (reason) {
    	      return 'default name';
    	    }).then(function (userName) {
    	      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    	      // will be `'default name'`
    	    });
    	  
    	    findUser().then(function (user) {
    	      throw new Error('Found user, but still unhappy');
    	    }, function (reason) {
    	      throw new Error('`findUser` rejected and we're unhappy');
    	    }).then(function (value) {
    	      // never reached
    	    }, function (reason) {
    	      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    	      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    	    });
    	    ```
    	    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
    	  
    	    ```js
    	    findUser().then(function (user) {
    	      throw new PedagogicalException('Upstream error');
    	    }).then(function (value) {
    	      // never reached
    	    }).then(function (value) {
    	      // never reached
    	    }, function (reason) {
    	      // The `PedgagocialException` is propagated all the way down to here
    	    });
    	    ```
    	  
    	    Assimilation
    	    ------------
    	  
    	    Sometimes the value you want to propagate to a downstream promise can only be
    	    retrieved asynchronously. This can be achieved by returning a promise in the
    	    fulfillment or rejection handler. The downstream promise will then be pending
    	    until the returned promise is settled. This is called *assimilation*.
    	  
    	    ```js
    	    findUser().then(function (user) {
    	      return findCommentsByAuthor(user);
    	    }).then(function (comments) {
    	      // The user's comments are now available
    	    });
    	    ```
    	  
    	    If the assimliated promise rejects, then the downstream promise will also reject.
    	  
    	    ```js
    	    findUser().then(function (user) {
    	      return findCommentsByAuthor(user);
    	    }).then(function (comments) {
    	      // If `findCommentsByAuthor` fulfills, we'll have the value here
    	    }, function (reason) {
    	      // If `findCommentsByAuthor` rejects, we'll have the reason here
    	    });
    	    ```
    	  
    	    Simple Example
    	    --------------
    	  
    	    Synchronous Example
    	  
    	    ```javascript
    	    let result;
    	  
    	    try {
    	      result = findResult();
    	      // success
    	    } catch(reason) {
    	      // failure
    	    }
    	    ```
    	  
    	    Errback Example
    	  
    	    ```js
    	    findResult(function(result, err){
    	      if (err) {
    	        // failure
    	      } else {
    	        // success
    	      }
    	    });
    	    ```
    	  
    	    Promise Example;
    	  
    	    ```javascript
    	    findResult().then(function(result){
    	      // success
    	    }, function(reason){
    	      // failure
    	    });
    	    ```
    	  
    	    Advanced Example
    	    --------------
    	  
    	    Synchronous Example
    	  
    	    ```javascript
    	    let author, books;
    	  
    	    try {
    	      author = findAuthor();
    	      books  = findBooksByAuthor(author);
    	      // success
    	    } catch(reason) {
    	      // failure
    	    }
    	    ```
    	  
    	    Errback Example
    	  
    	    ```js
    	  
    	    function foundBooks(books) {
    	  
    	    }
    	  
    	    function failure(reason) {
    	  
    	    }
    	  
    	    findAuthor(function(author, err){
    	      if (err) {
    	        failure(err);
    	        // failure
    	      } else {
    	        try {
    	          findBoooksByAuthor(author, function(books, err) {
    	            if (err) {
    	              failure(err);
    	            } else {
    	              try {
    	                foundBooks(books);
    	              } catch(reason) {
    	                failure(reason);
    	              }
    	            }
    	          });
    	        } catch(error) {
    	          failure(err);
    	        }
    	        // success
    	      }
    	    });
    	    ```
    	  
    	    Promise Example;
    	  
    	    ```javascript
    	    findAuthor().
    	      then(findBooksByAuthor).
    	      then(function(books){
    	        // found books
    	    }).catch(function(reason){
    	      // something went wrong
    	    });
    	    ```
    	  
    	    @method then
    	    @param {Function} onFulfilled
    	    @param {Function} onRejected
    	    Useful for tooling.
    	    @return {Promise}
    	  */
    	  then: then,

    	  /**
    	    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    	    as the catch block of a try/catch statement.
    	  
    	    ```js
    	    function findAuthor(){
    	      throw new Error('couldn't find that author');
    	    }
    	  
    	    // synchronous
    	    try {
    	      findAuthor();
    	    } catch(reason) {
    	      // something went wrong
    	    }
    	  
    	    // async with promises
    	    findAuthor().catch(function(reason){
    	      // something went wrong
    	    });
    	    ```
    	  
    	    @method catch
    	    @param {Function} onRejection
    	    Useful for tooling.
    	    @return {Promise}
    	  */
    	  'catch': function _catch(onRejection) {
    	    return this.then(null, onRejection);
    	  }
    	};

    	/*global self*/
    	function polyfill$1() {
    	    var local = undefined;

    	    if (typeof global !== 'undefined') {
    	        local = global;
    	    } else if (typeof self !== 'undefined') {
    	        local = self;
    	    } else {
    	        try {
    	            local = Function('return this')();
    	        } catch (e) {
    	            throw new Error('polyfill failed because global object is unavailable in this environment');
    	        }
    	    }

    	    var P = local.Promise;

    	    if (P) {
    	        var promiseToString = null;
    	        try {
    	            promiseToString = Object.prototype.toString.call(P.resolve());
    	        } catch (e) {
    	            // silently ignored
    	        }

    	        if (promiseToString === '[object Promise]' && !P.cast) {
    	            return;
    	        }
    	    }

    	    local.Promise = Promise$2;
    	}

    	// Strange compat..
    	Promise$2.polyfill = polyfill$1;
    	Promise$2.Promise = Promise$2;

    	return Promise$2;

    	})));

    	

    	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7), __webpack_require__(8)));

    	/***/ }),
    	/* 5 */
    	/***/ (function(module, exports) {

    	// removed by extract-text-webpack-plugin

    	/***/ }),
    	/* 6 */
    	/***/ (function(module, exports, __webpack_require__) {


    	Object.defineProperty(exports, "__esModule", {
    	  value: true
    	});

    	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global VERSION */

    	__webpack_require__(5);

    	var _es6Promise = __webpack_require__(4);

    	var _es6Promise2 = _interopRequireDefault(_es6Promise);

    	var _utils = __webpack_require__(0);

    	var Utils = _interopRequireWildcard(_utils);

    	var _api = __webpack_require__(1);

    	var API = _interopRequireWildcard(_api);

    	var _button = __webpack_require__(2);

    	var _push = __webpack_require__(3);

    	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

    	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    	var Noty = function () {
    	  /**
    	   * @param {object} options
    	   * @return {Noty}
    	   */
    	  function Noty() {
    	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    	    _classCallCheck(this, Noty);

    	    this.options = Utils.deepExtend({}, API.Defaults, options);

    	    if (API.Store[this.options.id]) {
    	      return API.Store[this.options.id];
    	    }

    	    this.id = this.options.id || Utils.generateID('bar');
    	    this.closeTimer = -1;
    	    this.barDom = null;
    	    this.layoutDom = null;
    	    this.progressDom = null;
    	    this.showing = false;
    	    this.shown = false;
    	    this.closed = false;
    	    this.closing = false;
    	    this.killable = this.options.timeout || this.options.closeWith.length > 0;
    	    this.hasSound = this.options.sounds.sources.length > 0;
    	    this.soundPlayed = false;
    	    this.listeners = {
    	      beforeShow: [],
    	      onShow: [],
    	      afterShow: [],
    	      onClose: [],
    	      afterClose: [],
    	      onClick: [],
    	      onHover: [],
    	      onTemplate: []
    	    };
    	    this.promises = {
    	      show: null,
    	      close: null
    	    };
    	    this.on('beforeShow', this.options.callbacks.beforeShow);
    	    this.on('onShow', this.options.callbacks.onShow);
    	    this.on('afterShow', this.options.callbacks.afterShow);
    	    this.on('onClose', this.options.callbacks.onClose);
    	    this.on('afterClose', this.options.callbacks.afterClose);
    	    this.on('onClick', this.options.callbacks.onClick);
    	    this.on('onHover', this.options.callbacks.onHover);
    	    this.on('onTemplate', this.options.callbacks.onTemplate);

    	    return this;
    	  }

    	  /**
    	   * @param {string} eventName
    	   * @param {function} cb
    	   * @return {Noty}
    	   */


    	  _createClass(Noty, [{
    	    key: 'on',
    	    value: function on(eventName) {
    	      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

    	      if (typeof cb === 'function' && this.listeners.hasOwnProperty(eventName)) {
    	        this.listeners[eventName].push(cb);
    	      }

    	      return this;
    	    }

    	    /**
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'show',
    	    value: function show() {
    	      var _this = this;

    	      if (this.showing || this.shown) {
    	        return this; // preventing multiple show
    	      }

    	      if (this.options.killer === true) {
    	        Noty.closeAll();
    	      } else if (typeof this.options.killer === 'string') {
    	        Noty.closeAll(this.options.killer);
    	      }

    	      var queueCounts = API.getQueueCounts(this.options.queue);

    	      if (queueCounts.current >= queueCounts.maxVisible || API.PageHidden && this.options.visibilityControl) {
    	        API.addToQueue(this);

    	        if (API.PageHidden && this.hasSound && Utils.inArray('docHidden', this.options.sounds.conditions)) {
    	          Utils.createAudioElements(this);
    	        }

    	        if (API.PageHidden && Utils.inArray('docHidden', this.options.titleCount.conditions)) {
    	          API.docTitle.increment();
    	        }

    	        return this;
    	      }

    	      API.Store[this.id] = this;

    	      API.fire(this, 'beforeShow');

    	      this.showing = true;

    	      if (this.closing) {
    	        this.showing = false;
    	        return this;
    	      }

    	      API.build(this);
    	      API.handleModal(this);

    	      if (this.options.force) {
    	        this.layoutDom.insertBefore(this.barDom, this.layoutDom.firstChild);
    	      } else {
    	        this.layoutDom.appendChild(this.barDom);
    	      }

    	      if (this.hasSound && !this.soundPlayed && Utils.inArray('docVisible', this.options.sounds.conditions)) {
    	        Utils.createAudioElements(this);
    	      }

    	      if (Utils.inArray('docVisible', this.options.titleCount.conditions)) {
    	        API.docTitle.increment();
    	      }

    	      this.shown = true;
    	      this.closed = false;

    	      // bind button events if any
    	      if (API.hasButtons(this)) {
    	        Object.keys(this.options.buttons).forEach(function (key) {
    	          var btn = _this.barDom.querySelector('#' + _this.options.buttons[key].id);
    	          Utils.addListener(btn, 'click', function (e) {
    	            Utils.stopPropagation(e);
    	            _this.options.buttons[key].cb(_this);
    	          });
    	        });
    	      }

    	      this.progressDom = this.barDom.querySelector('.noty_progressbar');

    	      if (Utils.inArray('click', this.options.closeWith)) {
    	        Utils.addClass(this.barDom, 'noty_close_with_click');
    	        Utils.addListener(this.barDom, 'click', function (e) {
    	          Utils.stopPropagation(e);
    	          API.fire(_this, 'onClick');
    	          _this.close();
    	        }, false);
    	      }

    	      Utils.addListener(this.barDom, 'mouseenter', function () {
    	        API.fire(_this, 'onHover');
    	      }, false);

    	      if (this.options.timeout) Utils.addClass(this.barDom, 'noty_has_timeout');
    	      if (this.options.progressBar) {
    	        Utils.addClass(this.barDom, 'noty_has_progressbar');
    	      }

    	      if (Utils.inArray('button', this.options.closeWith)) {
    	        Utils.addClass(this.barDom, 'noty_close_with_button');

    	        var closeButton = document.createElement('div');
    	        Utils.addClass(closeButton, 'noty_close_button');
    	        closeButton.innerHTML = '×';
    	        this.barDom.appendChild(closeButton);

    	        Utils.addListener(closeButton, 'click', function (e) {
    	          Utils.stopPropagation(e);
    	          _this.close();
    	        }, false);
    	      }

    	      API.fire(this, 'onShow');

    	      if (this.options.animation.open === null) {
    	        this.promises.show = new _es6Promise2.default(function (resolve) {
    	          resolve();
    	        });
    	      } else if (typeof this.options.animation.open === 'function') {
    	        this.promises.show = new _es6Promise2.default(this.options.animation.open.bind(this));
    	      } else {
    	        Utils.addClass(this.barDom, this.options.animation.open);
    	        this.promises.show = new _es6Promise2.default(function (resolve) {
    	          Utils.addListener(_this.barDom, Utils.animationEndEvents, function () {
    	            Utils.removeClass(_this.barDom, _this.options.animation.open);
    	            resolve();
    	          });
    	        });
    	      }

    	      this.promises.show.then(function () {
    	        var _t = _this;
    	        setTimeout(function () {
    	          API.openFlow(_t);
    	        }, 100);
    	      });

    	      return this;
    	    }

    	    /**
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'stop',
    	    value: function stop() {
    	      API.dequeueClose(this);
    	      return this;
    	    }

    	    /**
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'resume',
    	    value: function resume() {
    	      API.queueClose(this);
    	      return this;
    	    }

    	    /**
    	     * @param {int|boolean} ms
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'setTimeout',
    	    value: function (_setTimeout) {
    	      function setTimeout(_x) {
    	        return _setTimeout.apply(this, arguments);
    	      }

    	      setTimeout.toString = function () {
    	        return _setTimeout.toString();
    	      };

    	      return setTimeout;
    	    }(function (ms) {
    	      this.stop();
    	      this.options.timeout = ms;

    	      if (this.barDom) {
    	        if (this.options.timeout) {
    	          Utils.addClass(this.barDom, 'noty_has_timeout');
    	        } else {
    	          Utils.removeClass(this.barDom, 'noty_has_timeout');
    	        }

    	        var _t = this;
    	        setTimeout(function () {
    	          // ugly fix for progressbar display bug
    	          _t.resume();
    	        }, 100);
    	      }

    	      return this;
    	    })

    	    /**
    	     * @param {string} html
    	     * @param {boolean} optionsOverride
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'setText',
    	    value: function setText(html) {
    	      var optionsOverride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    	      if (this.barDom) {
    	        this.barDom.querySelector('.noty_body').innerHTML = html;
    	      }

    	      if (optionsOverride) this.options.text = html;

    	      return this;
    	    }

    	    /**
    	     * @param {string} type
    	     * @param {boolean} optionsOverride
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'setType',
    	    value: function setType(type) {
    	      var _this2 = this;

    	      var optionsOverride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    	      if (this.barDom) {
    	        var classList = Utils.classList(this.barDom).split(' ');

    	        classList.forEach(function (c) {
    	          if (c.substring(0, 11) === 'noty_type__') {
    	            Utils.removeClass(_this2.barDom, c);
    	          }
    	        });

    	        Utils.addClass(this.barDom, 'noty_type__' + type);
    	      }

    	      if (optionsOverride) this.options.type = type;

    	      return this;
    	    }

    	    /**
    	     * @param {string} theme
    	     * @param {boolean} optionsOverride
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'setTheme',
    	    value: function setTheme(theme) {
    	      var _this3 = this;

    	      var optionsOverride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    	      if (this.barDom) {
    	        var classList = Utils.classList(this.barDom).split(' ');

    	        classList.forEach(function (c) {
    	          if (c.substring(0, 12) === 'noty_theme__') {
    	            Utils.removeClass(_this3.barDom, c);
    	          }
    	        });

    	        Utils.addClass(this.barDom, 'noty_theme__' + theme);
    	      }

    	      if (optionsOverride) this.options.theme = theme;

    	      return this;
    	    }

    	    /**
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'close',
    	    value: function close() {
    	      var _this4 = this;

    	      if (this.closed) return this;

    	      if (!this.shown) {
    	        // it's in the queue
    	        API.removeFromQueue(this);
    	        return this;
    	      }

    	      API.fire(this, 'onClose');

    	      this.closing = true;

    	      if (this.options.animation.close === null || this.options.animation.close === false) {
    	        this.promises.close = new _es6Promise2.default(function (resolve) {
    	          resolve();
    	        });
    	      } else if (typeof this.options.animation.close === 'function') {
    	        this.promises.close = new _es6Promise2.default(this.options.animation.close.bind(this));
    	      } else {
    	        Utils.addClass(this.barDom, this.options.animation.close);
    	        this.promises.close = new _es6Promise2.default(function (resolve) {
    	          Utils.addListener(_this4.barDom, Utils.animationEndEvents, function () {
    	            if (_this4.options.force) {
    	              Utils.remove(_this4.barDom);
    	            } else {
    	              API.ghostFix(_this4);
    	            }
    	            resolve();
    	          });
    	        });
    	      }

    	      this.promises.close.then(function () {
    	        API.closeFlow(_this4);
    	        API.handleModalClose(_this4);
    	      });

    	      this.closed = true;

    	      return this;
    	    }

    	    // API functions

    	    /**
    	     * @param {boolean|string} queueName
    	     * @return {Noty}
    	     */

    	  }], [{
    	    key: 'closeAll',
    	    value: function closeAll() {
    	      var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    	      Object.keys(API.Store).forEach(function (id) {
    	        if (queueName) {
    	          if (API.Store[id].options.queue === queueName && API.Store[id].killable) {
    	            API.Store[id].close();
    	          }
    	        } else if (API.Store[id].killable) {
    	          API.Store[id].close();
    	        }
    	      });
    	      return this;
    	    }

    	    /**
    	     * @param {string} queueName
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'clearQueue',
    	    value: function clearQueue() {
    	      var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'global';

    	      if (API.Queues.hasOwnProperty(queueName)) {
    	        API.Queues[queueName].queue = [];
    	      }
    	      return this;
    	    }

    	    /**
    	     * @return {API.Queues}
    	     */

    	  }, {
    	    key: 'overrideDefaults',


    	    /**
    	     * @param {Object} obj
    	     * @return {Noty}
    	     */
    	    value: function overrideDefaults(obj) {
    	      API.Defaults = Utils.deepExtend({}, API.Defaults, obj);
    	      return this;
    	    }

    	    /**
    	     * @param {int} amount
    	     * @param {string} queueName
    	     * @return {Noty}
    	     */

    	  }, {
    	    key: 'setMaxVisible',
    	    value: function setMaxVisible() {
    	      var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : API.DefaultMaxVisible;
    	      var queueName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'global';

    	      if (!API.Queues.hasOwnProperty(queueName)) {
    	        API.Queues[queueName] = { maxVisible: amount, queue: [] };
    	      }

    	      API.Queues[queueName].maxVisible = amount;
    	      return this;
    	    }

    	    /**
    	     * @param {string} innerHtml
    	     * @param {String} classes
    	     * @param {Function} cb
    	     * @param {Object} attributes
    	     * @return {NotyButton}
    	     */

    	  }, {
    	    key: 'button',
    	    value: function button(innerHtml) {
    	      var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    	      var cb = arguments[2];
    	      var attributes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    	      return new _button.NotyButton(innerHtml, classes, cb, attributes);
    	    }

    	    /**
    	     * @return {string}
    	     */

    	  }, {
    	    key: 'version',
    	    value: function version() {
    	      return "3.2.0-beta";
    	    }

    	    /**
    	     * @param {String} workerPath
    	     * @return {Push}
    	     */

    	  }, {
    	    key: 'Push',
    	    value: function Push(workerPath) {
    	      return new _push.Push(workerPath);
    	    }
    	  }, {
    	    key: 'Queues',
    	    get: function get() {
    	      return API.Queues;
    	    }

    	    /**
    	     * @return {API.PageHidden}
    	     */

    	  }, {
    	    key: 'PageHidden',
    	    get: function get() {
    	      return API.PageHidden;
    	    }
    	  }]);

    	  return Noty;
    	}();

    	// Document visibility change controller


    	exports.default = Noty;
    	if (typeof window !== 'undefined') {
    	  Utils.visibilityChangeFlow();
    	}
    	module.exports = exports['default'];

    	/***/ }),
    	/* 7 */
    	/***/ (function(module, exports) {

    	// shim for using process in browser
    	var process = module.exports = {};

    	// cached from whatever global is present so that test runners that stub it
    	// don't break things.  But we need to wrap it in a try catch in case it is
    	// wrapped in strict mode code which doesn't define any globals.  It's inside a
    	// function because try/catches deoptimize in certain engines.

    	var cachedSetTimeout;
    	var cachedClearTimeout;

    	function defaultSetTimout() {
    	    throw new Error('setTimeout has not been defined');
    	}
    	function defaultClearTimeout () {
    	    throw new Error('clearTimeout has not been defined');
    	}
    	(function () {
    	    try {
    	        if (typeof setTimeout === 'function') {
    	            cachedSetTimeout = setTimeout;
    	        } else {
    	            cachedSetTimeout = defaultSetTimout;
    	        }
    	    } catch (e) {
    	        cachedSetTimeout = defaultSetTimout;
    	    }
    	    try {
    	        if (typeof clearTimeout === 'function') {
    	            cachedClearTimeout = clearTimeout;
    	        } else {
    	            cachedClearTimeout = defaultClearTimeout;
    	        }
    	    } catch (e) {
    	        cachedClearTimeout = defaultClearTimeout;
    	    }
    	} ());
    	function runTimeout(fun) {
    	    if (cachedSetTimeout === setTimeout) {
    	        //normal enviroments in sane situations
    	        return setTimeout(fun, 0);
    	    }
    	    // if setTimeout wasn't available but was latter defined
    	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    	        cachedSetTimeout = setTimeout;
    	        return setTimeout(fun, 0);
    	    }
    	    try {
    	        // when when somebody has screwed with setTimeout but no I.E. maddness
    	        return cachedSetTimeout(fun, 0);
    	    } catch(e){
    	        try {
    	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
    	            return cachedSetTimeout.call(null, fun, 0);
    	        } catch(e){
    	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
    	            return cachedSetTimeout.call(this, fun, 0);
    	        }
    	    }


    	}
    	function runClearTimeout(marker) {
    	    if (cachedClearTimeout === clearTimeout) {
    	        //normal enviroments in sane situations
    	        return clearTimeout(marker);
    	    }
    	    // if clearTimeout wasn't available but was latter defined
    	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    	        cachedClearTimeout = clearTimeout;
    	        return clearTimeout(marker);
    	    }
    	    try {
    	        // when when somebody has screwed with setTimeout but no I.E. maddness
    	        return cachedClearTimeout(marker);
    	    } catch (e){
    	        try {
    	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
    	            return cachedClearTimeout.call(null, marker);
    	        } catch (e){
    	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
    	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
    	            return cachedClearTimeout.call(this, marker);
    	        }
    	    }



    	}
    	var queue = [];
    	var draining = false;
    	var currentQueue;
    	var queueIndex = -1;

    	function cleanUpNextTick() {
    	    if (!draining || !currentQueue) {
    	        return;
    	    }
    	    draining = false;
    	    if (currentQueue.length) {
    	        queue = currentQueue.concat(queue);
    	    } else {
    	        queueIndex = -1;
    	    }
    	    if (queue.length) {
    	        drainQueue();
    	    }
    	}

    	function drainQueue() {
    	    if (draining) {
    	        return;
    	    }
    	    var timeout = runTimeout(cleanUpNextTick);
    	    draining = true;

    	    var len = queue.length;
    	    while(len) {
    	        currentQueue = queue;
    	        queue = [];
    	        while (++queueIndex < len) {
    	            if (currentQueue) {
    	                currentQueue[queueIndex].run();
    	            }
    	        }
    	        queueIndex = -1;
    	        len = queue.length;
    	    }
    	    currentQueue = null;
    	    draining = false;
    	    runClearTimeout(timeout);
    	}

    	process.nextTick = function (fun) {
    	    var args = new Array(arguments.length - 1);
    	    if (arguments.length > 1) {
    	        for (var i = 1; i < arguments.length; i++) {
    	            args[i - 1] = arguments[i];
    	        }
    	    }
    	    queue.push(new Item(fun, args));
    	    if (queue.length === 1 && !draining) {
    	        runTimeout(drainQueue);
    	    }
    	};

    	// v8 likes predictible objects
    	function Item(fun, array) {
    	    this.fun = fun;
    	    this.array = array;
    	}
    	Item.prototype.run = function () {
    	    this.fun.apply(null, this.array);
    	};
    	process.title = 'browser';
    	process.browser = true;
    	process.env = {};
    	process.argv = [];
    	process.version = ''; // empty string to avoid regexp issues
    	process.versions = {};

    	function noop() {}

    	process.on = noop;
    	process.addListener = noop;
    	process.once = noop;
    	process.off = noop;
    	process.removeListener = noop;
    	process.removeAllListeners = noop;
    	process.emit = noop;
    	process.prependListener = noop;
    	process.prependOnceListener = noop;

    	process.listeners = function (name) { return [] };

    	process.binding = function (name) {
    	    throw new Error('process.binding is not supported');
    	};

    	process.cwd = function () { return '/' };
    	process.chdir = function (dir) {
    	    throw new Error('process.chdir is not supported');
    	};
    	process.umask = function() { return 0; };


    	/***/ }),
    	/* 8 */
    	/***/ (function(module, exports) {

    	var g;

    	// This works in non-strict mode
    	g = (function() {
    		return this;
    	})();

    	try {
    		// This works if eval is allowed (see CSP)
    		g = g || Function("return this")() || (1,eval)("this");
    	} catch(e) {
    		// This works if the window reference is available
    		if(typeof window === "object")
    			g = window;
    	}

    	// g can still be undefined, but nothing to do about it...
    	// We return undefined, instead of nothing here, so it's
    	// easier to handle this case. if(!global) { ...}

    	module.exports = g;


    	/***/ }),
    	/* 9 */
    	/***/ (function(module, exports) {

    	/* (ignored) */

    	/***/ })
    	/******/ ]);
    	});
    	
    } (noty));

    var notyExports = noty.exports;
    var Noty = /*@__PURE__*/getDefaultExportFromCjs(notyExports);

    /* src\App.svelte generated by Svelte v3.59.1 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (109:16) {:else}
    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[2].imagenURL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "img-fluid p-2");
    			add_location(img, file, 109, 18, 2343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*products*/ 1 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[2].imagenURL)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(109:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (103:16) {#if !product.imagenURL}
    function create_if_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "images/no-products.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "img-fluid p-2");
    			add_location(img, file, 103, 18, 2157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(103:16) {#if !product.imagenURL}",
    		ctx
    	});

    	return block;
    }

    // (99:8) {#each products as product}
    function create_each_block(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let h5;
    	let strong;
    	let t1_value = /*product*/ ctx[2].name + "";
    	let t1;
    	let t2;
    	let span;
    	let small;
    	let t3_value = /*product*/ ctx[2].category + "";
    	let t3;
    	let t4;
    	let p;
    	let t5_value = /*product*/ ctx[2].description + "";
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*product*/ ctx[2].imagenURL) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h5 = element("h5");
    			strong = element("strong");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			small = element("small");
    			t3 = text(t3_value);
    			t4 = space();
    			p = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Delete";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Edit";
    			t10 = space();
    			attr_dev(div0, "class", "col-md-4");
    			add_location(div0, file, 101, 14, 2075);
    			add_location(strong, file, 115, 20, 2567);
    			add_location(small, file, 117, 22, 2648);
    			add_location(span, file, 116, 20, 2619);
    			add_location(h5, file, 114, 18, 2542);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file, 122, 18, 2800);
    			attr_dev(button0, "class", "btn btn-danger");
    			add_location(button0, file, 123, 18, 2865);
    			attr_dev(button1, "class", "btn btn-secondary");
    			add_location(button1, file, 129, 18, 3066);
    			attr_dev(div1, "class", "card-body");
    			add_location(div1, file, 113, 16, 2500);
    			attr_dev(div2, "class", "col-md-8");
    			add_location(div2, file, 112, 14, 2461);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 100, 12, 2043);
    			attr_dev(div4, "class", "card mt-2");
    			add_location(div4, file, 99, 10, 2007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			if_block.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h5);
    			append_dev(h5, strong);
    			append_dev(strong, t1);
    			append_dev(h5, t2);
    			append_dev(h5, span);
    			append_dev(span, small);
    			append_dev(small, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p);
    			append_dev(p, t5);
    			append_dev(div1, t6);
    			append_dev(div1, button0);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(div4, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*deleteProduct*/ ctx[4](/*product*/ ctx[2].id))) /*deleteProduct*/ ctx[4](/*product*/ ctx[2].id).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*editProduct*/ ctx[5](/*product*/ ctx[2]))) /*editProduct*/ ctx[5](/*product*/ ctx[2]).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*products*/ 1 && t1_value !== (t1_value = /*product*/ ctx[2].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*products*/ 1 && t3_value !== (t3_value = /*product*/ ctx[2].category + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*products*/ 1 && t5_value !== (t5_value = /*product*/ ctx[2].description + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(99:8) {#each products as product}",
    		ctx
    	});

    	return block;
    }

    // (189:47) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Update Product");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(189:47) {:else}",
    		ctx
    	});

    	return block;
    }

    // (189:16) {#if !editStatus}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save Product");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(189:16) {#if !editStatus}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div9;
    	let div8;
    	let div0;
    	let t0;
    	let div7;
    	let div6;
    	let div5;
    	let form;
    	let div1;
    	let input0;
    	let t1;
    	let div2;
    	let textarea;
    	let t2;
    	let div3;
    	let input1;
    	let t3;
    	let div4;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*products*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (!/*editStatus*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div9 = element("div");
    			div8 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			form = element("form");
    			div1 = element("div");
    			input0 = element("input");
    			t1 = space();
    			div2 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div4 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Laptops";
    			option1 = element("option");
    			option1.textContent = "Peripherials";
    			option2 = element("option");
    			option2.textContent = "Severs";
    			t7 = space();
    			button = element("button");
    			if_block.c();
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file, 97, 6, 1938);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Product Name");
    			attr_dev(input0, "id", "prodcut-name");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file, 146, 16, 3561);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file, 145, 14, 3520);
    			attr_dev(textarea, "id", "product-description");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "placeholder", "Product Description");
    			attr_dev(textarea, "class", "form-control");
    			add_location(textarea, file, 156, 16, 3858);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file, 155, 14, 3817);
    			attr_dev(input1, "type", "url");
    			attr_dev(input1, "id", "product-image-url");
    			attr_dev(input1, "placeholder", "https://link.com");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file, 166, 16, 4176);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file, 165, 14, 4135);
    			option0.__value = "Laptops";
    			option0.value = option0.__value;
    			add_location(option0, file, 181, 18, 4649);
    			option1.__value = "peripherials";
    			option1.value = option1.__value;
    			add_location(option1, file, 182, 18, 4708);
    			option2.__value = "Severs";
    			option2.value = option2.__value;
    			add_location(option2, file, 183, 18, 4777);
    			attr_dev(select, "id", "category");
    			attr_dev(select, "class", "form-control");
    			if (/*product*/ ctx[2].category === void 0) add_render_callback(() => /*select_change_handler*/ ctx[9].call(select));
    			add_location(select, file, 176, 16, 4486);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file, 175, 14, 4445);
    			attr_dev(button, "class", "btn btn-secondary");
    			add_location(button, file, 187, 14, 4878);
    			add_location(form, file, 144, 12, 3456);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file, 143, 10, 3420);
    			attr_dev(div6, "class", "card");
    			add_location(div6, file, 142, 8, 3391);
    			attr_dev(div7, "class", "col-md-6");
    			add_location(div7, file, 141, 6, 3360);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file, 96, 4, 1914);
    			attr_dev(div9, "class", "container p-4");
    			add_location(div9, file, 95, 2, 1882);
    			add_location(main, file, 94, 0, 1873);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div8, t0);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, form);
    			append_dev(form, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*product*/ ctx[2].name);
    			append_dev(form, t1);
    			append_dev(form, div2);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*product*/ ctx[2].description);
    			append_dev(form, t2);
    			append_dev(form, div3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*product*/ ctx[2].imagenURL);
    			append_dev(form, t3);
    			append_dev(form, div4);
    			append_dev(div4, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*product*/ ctx[2].category, true);
    			append_dev(form, t7);
    			append_dev(form, button);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[9]),
    					listen_dev(form, "submit", prevent_default(/*onSubmitHandler*/ ctx[3]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*editProduct, products, deleteProduct*/ 49) {
    				each_value = /*products*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*product*/ 4 && input0.value !== /*product*/ ctx[2].name) {
    				set_input_value(input0, /*product*/ ctx[2].name);
    			}

    			if (dirty & /*product*/ 4) {
    				set_input_value(textarea, /*product*/ ctx[2].description);
    			}

    			if (dirty & /*product*/ 4 && input1.value !== /*product*/ ctx[2].imagenURL) {
    				set_input_value(input1, /*product*/ ctx[2].imagenURL);
    			}

    			if (dirty & /*product*/ 4) {
    				select_option(select, /*product*/ ctx[2].category);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let products = [
    		{
    			id: 1,
    			name: "HP Pavilion Notebook",
    			description: "Hp Laptop",
    			category: "Laptop"
    		},
    		{
    			id: 2,
    			name: "Mouse Razer",
    			description: "Gaming mouse",
    			category: "peripherials"
    		}
    	];

    	let editStatus = false;

    	let product = {
    		id: "",
    		name: "",
    		description: "",
    		category: "",
    		imagenURL: ""
    	};

    	const cleanProduct = () => {
    		$$invalidate(2, product = {
    			id: "",
    			name: "",
    			description: "",
    			category: "",
    			imagenURL: ""
    		});
    	};

    	const addProduct = () => {
    		const newProduct = {
    			id: v4(),
    			name: product.name,
    			description: product.description,
    			category: product.category,
    			imagenURL: product.imagenURL
    		};

    		$$invalidate(0, products = products.concat(newProduct));
    		cleanProduct();
    		console.log(products);
    	};

    	const updateProduct = () => {
    		let updatedProduct = {
    			name: product.name,
    			description: product.description,
    			id: product.id,
    			imagenURL: product.imagenURL,
    			category: product.category
    		};

    		const productIndex = products.findIndex(p => p.id === product.id);
    		$$invalidate(0, products[productIndex] = updatedProduct, products);
    		cleanProduct();
    		$$invalidate(1, editStatus = false);

    		new Noty({
    				theme: 'sunset',
    				type: 'success',
    				timeout: 3000,
    				text: 'Product Update Successfully'
    			}).show();
    	};

    	const onSubmitHandler = e => {
    		if (!editStatus) {
    			addProduct();
    		} else {
    			updateProduct();
    		}
    	};

    	const deleteProduct = id => {
    		$$invalidate(0, products = products.filter(product => product.id !== id));
    	};

    	const editProduct = productEdited => {
    		$$invalidate(2, product = productEdited);
    		$$invalidate(1, editStatus = true);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		product.name = this.value;
    		$$invalidate(2, product);
    	}

    	function textarea_input_handler() {
    		product.description = this.value;
    		$$invalidate(2, product);
    	}

    	function input1_input_handler() {
    		product.imagenURL = this.value;
    		$$invalidate(2, product);
    	}

    	function select_change_handler() {
    		product.category = select_value(this);
    		$$invalidate(2, product);
    	}

    	$$self.$capture_state = () => ({
    		v4,
    		Noty,
    		products,
    		editStatus,
    		product,
    		cleanProduct,
    		addProduct,
    		updateProduct,
    		onSubmitHandler,
    		deleteProduct,
    		editProduct
    	});

    	$$self.$inject_state = $$props => {
    		if ('products' in $$props) $$invalidate(0, products = $$props.products);
    		if ('editStatus' in $$props) $$invalidate(1, editStatus = $$props.editStatus);
    		if ('product' in $$props) $$invalidate(2, product = $$props.product);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		products,
    		editStatus,
    		product,
    		onSubmitHandler,
    		deleteProduct,
    		editProduct,
    		input0_input_handler,
    		textarea_input_handler,
    		input1_input_handler,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
