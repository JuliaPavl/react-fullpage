/**
* Customized version of iScroll.js 0.1.1
* It fixes bugs affecting its integration with fullpage.js
* @license
*/
/*! iScroll v5.2.0 ~ (c) 2008-2016 Matteo Spinelli ~ http://cubiq.org/license */
var scrollOverflow1 = function () {
  var rAF = window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame  ||
      window.mozRequestAnimationFrame     ||
      window.oRequestAnimationFrame       ||
      window.msRequestAnimationFrame      ||
      function (callback) { window.setTimeout(callback, 1000 / 60); };

  var utils = (function () {
      var me = {};

      var _elementStyle = document.createElement('div').style;
      var _vendor = (function () {
          var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
              transform,
              i = 0,
              l = vendors.length;

          for ( ; i < l; i++ ) {
              transform = vendors[i] + 'ransform';
              if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
          }

          return false;
      })();

      function _prefixStyle (style) {
          if ( _vendor === false ) return false;
          if ( _vendor === '' ) return style;
          return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
      }

      me.getTime = Date.now || function getTime () { return new Date().getTime(); };

      me.extend = function (target, obj) {
          for ( var i in obj ) {
              target[i] = obj[i];
          }
      };

      me.addEvent = function (el, type, fn, capture) {
          el.addEventListener(type, fn, !!capture);
      };

      me.removeEvent = function (el, type, fn, capture) {
          el.removeEventListener(type, fn, !!capture);
      };

      me.prefixPointerEvent = function (pointerEvent) {
          return window.MSPointerEvent ?
              'MSPointer' + pointerEvent.charAt(7).toUpperCase() + pointerEvent.substr(8):
              pointerEvent;
      };

      me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
          var distance = current - start,
              speed = Math.abs(distance) / time,
              destination,
              duration;

          deceleration = deceleration === undefined ? 0.0006 : deceleration;

          destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
          duration = speed / deceleration;

          if ( destination < lowerMargin ) {
              destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
              distance = Math.abs(destination - current);
              duration = distance / speed;
          } else if ( destination > 0 ) {
              destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
              distance = Math.abs(current) + destination;
              duration = distance / speed;
          }

          return {
              destination: Math.round(destination),
              duration: duration
          };
      };

      var _transform = _prefixStyle('transform');

      me.extend(me, {
          hasTransform: _transform !== false,
          hasPerspective: _prefixStyle('perspective') in _elementStyle,
          hasTouch: 'ontouchstart' in window,
          hasPointer: !!(window.PointerEvent || window.MSPointerEvent), // IE10 is prefixed
          hasTransition: _prefixStyle('transition') in _elementStyle
      });

      /*
      This should find all Android browsers lower than build 535.19 (both stock browser and webview)
      - galaxy S2 is ok
      - 2.3.6 : `AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`
      - 4.0.4 : `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
     - galaxy S3 is badAndroid (stock brower, webview)
       `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
     - galaxy S4 is badAndroid (stock brower, webview)
       `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
     - galaxy S5 is OK
       `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
     - galaxy S6 is OK
       `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
    */
      me.isBadAndroid = (function() {
          var appVersion = window.navigator.appVersion;
          // Android browser is not a chrome browser.
          if (/Android/.test(appVersion) && !(/Chrome\/\d/.test(appVersion))) {
              var safariVersion = appVersion.match(/Safari\/(\d+.\d)/);
              if(safariVersion && typeof safariVersion === "object" && safariVersion.length >= 2) {
                  return parseFloat(safariVersion[1]) < 535.19;
              } else {
                  return true;
              }
          } else {
              return false;
          }
      })();

      me.extend(me.style = {}, {
          transform: _transform,
          transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
          transitionDuration: _prefixStyle('transitionDuration'),
          transitionDelay: _prefixStyle('transitionDelay'),
          transformOrigin: _prefixStyle('transformOrigin')
      });

      me.hasClass = function (e, c) {
          var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
          return re.test(e.className);
      };

      me.addClass = function (e, c) {
          if ( me.hasClass(e, c) ) {
              return;
          }

          var newclass = e.className.split(' ');
          newclass.push(c);
          e.className = newclass.join(' ');
      };

      me.removeClass = function (e, c) {
          if ( !me.hasClass(e, c) ) {
              return;
          }

          var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
          e.className = e.className.replace(re, ' ');
      };

      me.offset = function (el) {
          var left = -el.offsetLeft,
              top = -el.offsetTop;

          // jshint -W084
          while (el = el.offsetParent) {
              left -= el.offsetLeft;
              top -= el.offsetTop;
          }
          // jshint +W084

          return {
              left: left,
              top: top
          };
      };

      me.preventDefaultException = function (el, exceptions) {
          for ( var i in exceptions ) {
              if ( exceptions[i].test(el[i]) ) {
                  return true;
              }
          }

          return false;
      };

      me.extend(me.eventType = {}, {
          touchstart: 1,
          touchmove: 1,
          touchend: 1,

          mousedown: 2,
          mousemove: 2,
          mouseup: 2,

          pointerdown: 3,
          pointermove: 3,
          pointerup: 3,

          MSPointerDown: 3,
          MSPointerMove: 3,
          MSPointerUp: 3
      });

      me.extend(me.ease = {}, {
          quadratic: {
              style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fn: function (k) {
                  return k * ( 2 - k );
              }
          },
          circular: {
              style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',   // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
              fn: function (k) {
                  return Math.sqrt( 1 - ( --k * k ) );
              }
          },
          back: {
              style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              fn: function (k) {
                  var b = 4;
                  return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
              }
          },
          bounce: {
              style: '',
              fn: function (k) {
                  if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
                      return 7.5625 * k * k;
                  } else if ( k < ( 2 / 2.75 ) ) {
                      return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                  } else if ( k < ( 2.5 / 2.75 ) ) {
                      return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                  } else {
                      return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                  }
              }
          },
          elastic: {
              style: '',
              fn: function (k) {
                  var f = 0.22,
                      e = 0.4;

                  if ( k === 0 ) { return 0; }
                  if ( k == 1 ) { return 1; }

                  return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
              }
          }
      });

      me.tap = function (e, eventName) {
          var ev = document.createEvent('Event');
          ev.initEvent(eventName, true, true);
          ev.pageX = e.pageX;
          ev.pageY = e.pageY;
          e.target.dispatchEvent(ev);
      };

      me.click = function (e) {
          var target = e.target,
              ev;

          if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
              // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/initMouseEvent
              // initMouseEvent is deprecated.
              ev = document.createEvent(window.MouseEvent ? 'MouseEvents' : 'Event');
              ev.initEvent('click', true, true);
              ev.view = e.view || window;
              ev.detail = 1;
              ev.screenX = target.screenX || 0;
              ev.screenY = target.screenY || 0;
              ev.clientX = target.clientX || 0;
              ev.clientY = target.clientY || 0;
              ev.ctrlKey = !!e.ctrlKey;
              ev.altKey = !!e.altKey;
              ev.shiftKey = !!e.shiftKey;
              ev.metaKey = !!e.metaKey;
              ev.button = 0;
              ev.relatedTarget = null;
              ev._constructed = true;
              target.dispatchEvent(ev);
          }
      };

      return me;
  })();
  function IScroll (el, options) {
      this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
      this.scroller = this.wrapper.children[0];
      this.scrollerStyle = this.scroller.style;       // cache style for better performance

      this.options = {

          resizeScrollbars: true,

          mouseWheelSpeed: 20,

          snapThreshold: 0.334,

  // INSERT POINT: OPTIONS
          disablePointer : !utils.hasPointer,
          disableTouch : utils.hasPointer || !utils.hasTouch,
          disableMouse : utils.hasPointer || utils.hasTouch,
          startX: 0,
          startY: 0,
          scrollY: true,
          directionLockThreshold: 5,
          momentum: true,

          bounce: true,
          bounceTime: 600,
          bounceEasing: '',

          preventDefault: true,
          preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|LABEL)$/ },

          HWCompositing: true,
          useTransition: true,
          useTransform: true,
          bindToWrapper: typeof window.onmousedown === "undefined"
      };

      for ( var i in options ) {
          this.options[i] = options[i];
      }

      // Normalize options
      this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

      this.options.useTransition = utils.hasTransition && this.options.useTransition;
      this.options.useTransform = utils.hasTransform && this.options.useTransform;

      this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
      this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

      // If you want eventPassthrough I have to lock one of the axes
      this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
      this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

      // With eventPassthrough we also need lockDirection mechanism
      this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
      this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

      this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

      this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

      if ( this.options.tap === true ) {
          this.options.tap = 'tap';
      }

      // https://github.com/cubiq/iscroll/issues/1029
      if (!this.options.useTransition && !this.options.useTransform) {
          if(!(/relative|absolute/i).test(this.scrollerStyle.position)) {
              this.scrollerStyle.position = "relative";
          }
      }

      if ( this.options.shrinkScrollbars == 'scale' ) {
          this.options.useTransition = false;
      }

      this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

  // INSERT POINT: NORMALIZATION

      // Some defaults
      this.x = 0;
      this.y = 0;
      this.directionX = 0;
      this.directionY = 0;
      this._events = {};

  // INSERT POINT: DEFAULTS

      this._init();
      this.refresh();

      this.scrollTo(this.options.startX, this.options.startY);
      this.enable();
  }

  IScroll.prototype = {
      version: '5.2.0',

      _init: function () {
          this._initEvents();

          if ( this.options.scrollbars || this.options.indicators ) {
              this._initIndicators();
          }

          if ( this.options.mouseWheel ) {
              this._initWheel();
          }

          if ( this.options.snap ) {
              this._initSnap();
          }

          if ( this.options.keyBindings ) {
              this._initKeys();
          }

  // INSERT POINT: _init

      },

      destroy: function () {
          this._initEvents(true);
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = null;
          this._execEvent('destroy');
      },

      _transitionEnd: function (e) {
          if ( e.target != this.scroller || !this.isInTransition ) {
              return;
          }

          this._transitionTime();
          if ( !this.resetPosition(this.options.bounceTime) ) {
              this.isInTransition = false;
              this._execEvent('scrollEnd');
          }
      },

      _start: function (e) {
          // React to left mouse button only
          if ( utils.eventType[e.type] != 1 ) {
            // for button property
            // http://unixpapa.com/js/mouse.html
            var button;
          if (!e.which) {
            /* IE case */
            button = (e.button < 2) ? 0 :
                     ((e.button == 4) ? 1 : 2);
          } else {
            /* All others */
            button = e.button;
          }
              if ( button !== 0 ) {
                  return;
              }
          }

          if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
              return;
          }

          if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
              e.preventDefault();
          }

          var point = e.touches ? e.touches[0] : e,
              pos;

          this.initiated  = utils.eventType[e.type];
          this.moved      = false;
          this.distX      = 0;
          this.distY      = 0;
          this.directionX = 0;
          this.directionY = 0;
          this.directionLocked = 0;

          this.startTime = utils.getTime();

          if ( this.options.useTransition && this.isInTransition ) {
              this._transitionTime();
              this.isInTransition = false;
              pos = this.getComputedPosition();
              this._translate(Math.round(pos.x), Math.round(pos.y));
              this._execEvent('scrollEnd');
          } else if ( !this.options.useTransition && this.isAnimating ) {
              this.isAnimating = false;
              this._execEvent('scrollEnd');
          }

          this.startX    = this.x;
          this.startY    = this.y;
          this.absStartX = this.x;
          this.absStartY = this.y;
          this.pointX    = point.pageX;
          this.pointY    = point.pageY;

          this._execEvent('beforeScrollStart');
      },

      _move: function (e) {
          if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
              return;
          }

          if ( this.options.preventDefault ) {    // increases performance on Android? TODO: check!
              e.preventDefault();
          }

          var point       = e.touches ? e.touches[0] : e,
              deltaX      = point.pageX - this.pointX,
              deltaY      = point.pageY - this.pointY,
              timestamp   = utils.getTime(),
              newX, newY,
              absDistX, absDistY;

          this.pointX     = point.pageX;
          this.pointY     = point.pageY;

          this.distX      += deltaX;
          this.distY      += deltaY;
          absDistX        = Math.abs(this.distX);
          absDistY        = Math.abs(this.distY);

          // We need to move at least 10 pixels for the scrolling to initiate
          if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
              return;
          }

          // If you are scrolling in one direction lock the other
          if ( !this.directionLocked && !this.options.freeScroll ) {
              if ( absDistX > absDistY + this.options.directionLockThreshold ) {
                  this.directionLocked = 'h';     // lock horizontally
              } else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
                  this.directionLocked = 'v';     // lock vertically
              } else {
                  this.directionLocked = 'n';     // no lock
              }
          }

          if ( this.directionLocked == 'h' ) {
              if ( this.options.eventPassthrough == 'vertical' ) {
                  e.preventDefault();
              } else if ( this.options.eventPassthrough == 'horizontal' ) {
                  this.initiated = false;
                  return;
              }

              deltaY = 0;
          } else if ( this.directionLocked == 'v' ) {
              if ( this.options.eventPassthrough == 'horizontal' ) {
                  e.preventDefault();
              } else if ( this.options.eventPassthrough == 'vertical' ) {
                  this.initiated = false;
                  return;
              }

              deltaX = 0;
          }

          deltaX = this.hasHorizontalScroll ? deltaX : 0;
          deltaY = this.hasVerticalScroll ? deltaY : 0;

          newX = this.x + deltaX;
          newY = this.y + deltaY;

          // Slow down if outside of the boundaries
          if ( newX > 0 || newX < this.maxScrollX ) {
              newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
          }
          if ( newY > 0 || newY < this.maxScrollY ) {
              newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
          }

          this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
          this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

          if ( !this.moved ) {
              this._execEvent('scrollStart');
          }

          this.moved = true;

          this._translate(newX, newY);

  /* REPLACE START: _move */

          if ( timestamp - this.startTime > 300 ) {
              this.startTime = timestamp;
              this.startX = this.x;
              this.startY = this.y;
          }

  /* REPLACE END: _move */

      },

      _end: function (e) {
          if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
              return;
          }

          if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
              e.preventDefault();
          }

          var point = e.changedTouches ? e.changedTouches[0] : e,
              momentumX,
              momentumY,
              duration = utils.getTime() - this.startTime,
              newX = Math.round(this.x),
              newY = Math.round(this.y),
              distanceX = Math.abs(newX - this.startX),
              distanceY = Math.abs(newY - this.startY),
              time = 0,
              easing = '';

          this.isInTransition = 0;
          this.initiated = 0;
          this.endTime = utils.getTime();

          // reset if we are outside of the boundaries
          if ( this.resetPosition(this.options.bounceTime) ) {
              return;
          }

          this.scrollTo(newX, newY);  // ensures that the last position is rounded

          // we scrolled less than 10 pixels
          if ( !this.moved ) {
              if ( this.options.tap ) {
                  utils.tap(e, this.options.tap);
              }

              if ( this.options.click ) {
                  utils.click(e);
              }

              this._execEvent('scrollCancel');
              return;
          }

          if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
              this._execEvent('flick');
              return;
          }

          // start momentum animation if needed
          if ( this.options.momentum && duration < 300 ) {
              momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
              momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
              newX = momentumX.destination;
              newY = momentumY.destination;
              time = Math.max(momentumX.duration, momentumY.duration);
              this.isInTransition = 1;
          }


          if ( this.options.snap ) {
              var snap = this._nearestSnap(newX, newY);
              this.currentPage = snap;
              time = this.options.snapSpeed || Math.max(
                      Math.max(
                          Math.min(Math.abs(newX - snap.x), 1000),
                          Math.min(Math.abs(newY - snap.y), 1000)
                      ), 300);
              newX = snap.x;
              newY = snap.y;

              this.directionX = 0;
              this.directionY = 0;
              easing = this.options.bounceEasing;
          }

  // INSERT POINT: _end

          if ( newX != this.x || newY != this.y ) {
              // change easing function when scroller goes out of the boundaries
              if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
                  easing = utils.ease.quadratic;
              }

              this.scrollTo(newX, newY, time, easing);
              return;
          }

          this._execEvent('scrollEnd');
      },

      _resize: function () {
          var that = this;

          clearTimeout(this.resizeTimeout);

          this.resizeTimeout = setTimeout(function () {
              that.refresh();
          }, this.options.resizePolling);
      },

      resetPosition: function (time) {
          var x = this.x,
              y = this.y;

          time = time || 0;

          if ( !this.hasHorizontalScroll || this.x > 0 ) {
              x = 0;
          } else if ( this.x < this.maxScrollX ) {
              x = this.maxScrollX;
          }

          if ( !this.hasVerticalScroll || this.y > 0 ) {
              y = 0;
          } else if ( this.y < this.maxScrollY ) {
              y = this.maxScrollY;
          }

          if ( x == this.x && y == this.y ) {
              return false;
          }

          this.scrollTo(x, y, time, this.options.bounceEasing);

          return true;
      },

      disable: function () {
          this.enabled = false;
      },

      enable: function () {
          this.enabled = true;
      },

      refresh: function () {
          var rf = this.wrapper.offsetHeight;     // Force reflow

          this.wrapperWidth   = this.wrapper.clientWidth;
          this.wrapperHeight  = this.wrapper.clientHeight;

  /* REPLACE START: refresh */

          this.scrollerWidth  = this.scroller.offsetWidth;
          this.scrollerHeight = this.scroller.offsetHeight;

          this.maxScrollX     = this.wrapperWidth - this.scrollerWidth;
          this.maxScrollY     = this.wrapperHeight - this.scrollerHeight;

  /* REPLACE END: refresh */

          this.hasHorizontalScroll    = this.options.scrollX && this.maxScrollX < 0;
          this.hasVerticalScroll      = this.options.scrollY && this.maxScrollY < 0;

          if ( !this.hasHorizontalScroll ) {
              this.maxScrollX = 0;
              this.scrollerWidth = this.wrapperWidth;
          }

          if ( !this.hasVerticalScroll ) {
              this.maxScrollY = 0;
              this.scrollerHeight = this.wrapperHeight;
          }

          this.endTime = 0;
          this.directionX = 0;
          this.directionY = 0;

          this.wrapperOffset = utils.offset(this.wrapper);

          this._execEvent('refresh');

          this.resetPosition();

  // INSERT POINT: _refresh

      },

      on: function (type, fn) {
          if ( !this._events[type] ) {
              this._events[type] = [];
          }

          this._events[type].push(fn);
      },

      off: function (type, fn) {
          if ( !this._events[type] ) {
              return;
          }

          var index = this._events[type].indexOf(fn);

          if ( index > -1 ) {
              this._events[type].splice(index, 1);
          }
      },

      _execEvent: function (type) {
          if ( !this._events[type] ) {
              return;
          }

          var i = 0,
              l = this._events[type].length;

          if ( !l ) {
              return;
          }

          for ( ; i < l; i++ ) {
              this._events[type][i].apply(this, [].slice.call(arguments, 1));
          }
      },

      scrollBy: function (x, y, time, easing) {
          x = this.x + x;
          y = this.y + y;
          time = time || 0;

          this.scrollTo(x, y, time, easing);
      },

      scrollTo: function (x, y, time, easing) {
          easing = easing || utils.ease.circular;

          this.isInTransition = this.options.useTransition && time > 0;
          var transitionType = this.options.useTransition && easing.style;
          if ( !time || transitionType ) {
                  if(transitionType) {
                      this._transitionTimingFunction(easing.style);
                      this._transitionTime(time);
                  }
              this._translate(x, y);
          } else {
              this._animate(x, y, time, easing.fn);
          }
      },

      scrollToElement: function (el, time, offsetX, offsetY, easing) {
          el = el.nodeType ? el : this.scroller.querySelector(el);

          if ( !el ) {
              return;
          }

          var pos = utils.offset(el);

          pos.left -= this.wrapperOffset.left;
          pos.top  -= this.wrapperOffset.top;

          // if offsetX/Y are true we center the element to the screen
          if ( offsetX === true ) {
              offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
          }
          if ( offsetY === true ) {
              offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
          }

          pos.left -= offsetX || 0;
          pos.top  -= offsetY || 0;

          pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
          pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

          time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

          this.scrollTo(pos.left, pos.top, time, easing);
      },

      _transitionTime: function (time) {
          if (!this.options.useTransition) {
              return;
          }
          time = time || 0;
          var durationProp = utils.style.transitionDuration;
          if(!durationProp) {
              return;
          }

          this.scrollerStyle[durationProp] = time + 'ms';

          if ( !time && utils.isBadAndroid ) {
              this.scrollerStyle[durationProp] = '0.0001ms';
              // remove 0.0001ms
              var self = this;
              rAF(function() {
                  if(self.scrollerStyle[durationProp] === '0.0001ms') {
                      self.scrollerStyle[durationProp] = '0s';
                  }
              });
          }


          if ( this.indicators ) {
              for ( var i = this.indicators.length; i--; ) {
                  this.indicators[i].transitionTime(time);
              }
          }


  // INSERT POINT: _transitionTime

      },

      _transitionTimingFunction: function (easing) {
          this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


          if ( this.indicators ) {
              for ( var i = this.indicators.length; i--; ) {
                  this.indicators[i].transitionTimingFunction(easing);
              }
          }


  // INSERT POINT: _transitionTimingFunction

      },

      _translate: function (x, y) {
          if ( this.options.useTransform ) {

  /* REPLACE START: _translate */

              this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

  /* REPLACE END: _translate */

          } else {
              x = Math.round(x);
              y = Math.round(y);
              this.scrollerStyle.left = x + 'px';
              this.scrollerStyle.top = y + 'px';
          }

          this.x = x;
          this.y = y;


      if ( this.indicators ) {
          for ( var i = this.indicators.length; i--; ) {
              this.indicators[i].updatePosition();
          }
      }


  // INSERT POINT: _translate

      },

      _initEvents: function (remove) {
          var eventType = remove ? utils.removeEvent : utils.addEvent,
              target = this.options.bindToWrapper ? this.wrapper : window;

          eventType(window, 'orientationchange', this);
          eventType(window, 'resize', this);

          if ( this.options.click ) {
              eventType(this.wrapper, 'click', this, true);
          }

          if ( !this.options.disableMouse ) {
              eventType(this.wrapper, 'mousedown', this);
              eventType(target, 'mousemove', this);
              eventType(target, 'mousecancel', this);
              eventType(target, 'mouseup', this);
          }

          if ( utils.hasPointer && !this.options.disablePointer ) {
              eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
              eventType(target, utils.prefixPointerEvent('pointermove'), this);
              eventType(target, utils.prefixPointerEvent('pointercancel'), this);
              eventType(target, utils.prefixPointerEvent('pointerup'), this);
          }

          if ( utils.hasTouch && !this.options.disableTouch ) {
              eventType(this.wrapper, 'touchstart', this);
              eventType(target, 'touchmove', this);
              eventType(target, 'touchcancel', this);
              eventType(target, 'touchend', this);
          }

          eventType(this.scroller, 'transitionend', this);
          eventType(this.scroller, 'webkitTransitionEnd', this);
          eventType(this.scroller, 'oTransitionEnd', this);
          eventType(this.scroller, 'MSTransitionEnd', this);
      },

      getComputedPosition: function () {
          var matrix = window.getComputedStyle(this.scroller, null),
              x, y;

          if ( this.options.useTransform ) {
              matrix = matrix[utils.style.transform].split(')')[0].split(', ');
              x = +(matrix[12] || matrix[4]);
              y = +(matrix[13] || matrix[5]);
          } else {
              x = +matrix.left.replace(/[^-\d.]/g, '');
              y = +matrix.top.replace(/[^-\d.]/g, '');
          }

          return { x: x, y: y };
      },
      _initIndicators: function () {
          var interactive = this.options.interactiveScrollbars,
              customStyle = typeof this.options.scrollbars != 'string',
              indicators = [],
              indicator;

          var that = this;

          this.indicators = [];

          if ( this.options.scrollbars ) {
              // Vertical scrollbar
              if ( this.options.scrollY ) {
                  indicator = {
                      el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
                      interactive: interactive,
                      defaultScrollbars: true,
                      customStyle: customStyle,
                      resize: this.options.resizeScrollbars,
                      shrink: this.options.shrinkScrollbars,
                      fade: this.options.fadeScrollbars,
                      listenX: false
                  };

                  this.wrapper.appendChild(indicator.el);
                  indicators.push(indicator);
              }

              // Horizontal scrollbar
              if ( this.options.scrollX ) {
                  indicator = {
                      el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
                      interactive: interactive,
                      defaultScrollbars: true,
                      customStyle: customStyle,
                      resize: this.options.resizeScrollbars,
                      shrink: this.options.shrinkScrollbars,
                      fade: this.options.fadeScrollbars,
                      listenY: false
                  };

                  this.wrapper.appendChild(indicator.el);
                  indicators.push(indicator);
              }
          }

          if ( this.options.indicators ) {
              // TODO: check concat compatibility
              indicators = indicators.concat(this.options.indicators);
          }

          for ( var i = indicators.length; i--; ) {
              this.indicators.push( new Indicator(this, indicators[i]) );
          }

          // TODO: check if we can use array.map (wide compatibility and performance issues)
          function _indicatorsMap (fn) {
              if (that.indicators) {
                  for ( var i = that.indicators.length; i--; ) {
                      fn.call(that.indicators[i]);
                  }
              }
          }

          if ( this.options.fadeScrollbars ) {
              this.on('scrollEnd', function () {
                  _indicatorsMap(function () {
                      this.fade();
                  });
              });

              this.on('scrollCancel', function () {
                  _indicatorsMap(function () {
                      this.fade();
                  });
              });

              this.on('scrollStart', function () {
                  _indicatorsMap(function () {
                      this.fade(1);
                  });
              });

              this.on('beforeScrollStart', function () {
                  _indicatorsMap(function () {
                      this.fade(1, true);
                  });
              });
          }


          this.on('refresh', function () {
              _indicatorsMap(function () {
                  this.refresh();
              });
          });

          this.on('destroy', function () {
              _indicatorsMap(function () {
                  this.destroy();
              });

              delete this.indicators;
          });
      },

      _initWheel: function () {
          utils.addEvent(this.wrapper, 'wheel', this);
          utils.addEvent(this.wrapper, 'mousewheel', this);
          utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

          this.on('destroy', function () {
              clearTimeout(this.wheelTimeout);
              this.wheelTimeout = null;
              utils.removeEvent(this.wrapper, 'wheel', this);
              utils.removeEvent(this.wrapper, 'mousewheel', this);
              utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
          });
      },

      _wheel: function (e) {
          if ( !this.enabled ) {
              return;
          }

          var wheelDeltaX, wheelDeltaY,
              newX, newY,
              that = this;

          if ( this.wheelTimeout === undefined ) {
              that._execEvent('scrollStart');
          }

          // Execute the scrollEnd event after 400ms the wheel stopped scrolling
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(function () {
              if(!that.options.snap) {
                  that._execEvent('scrollEnd');
              }
              that.wheelTimeout = undefined;
          }, 400);

          if ( 'deltaX' in e ) {
              if (e.deltaMode === 1) {
                  wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
                  wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
              } else {
                  wheelDeltaX = -e.deltaX;
                  wheelDeltaY = -e.deltaY;
              }
          } else if ( 'wheelDeltaX' in e ) {
              wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
              wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
          } else if ( 'wheelDelta' in e ) {
              wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
          } else if ( 'detail' in e ) {
              wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
          } else {
              return;
          }

          wheelDeltaX *= this.options.invertWheelDirection;
          wheelDeltaY *= this.options.invertWheelDirection;

          if ( !this.hasVerticalScroll ) {
              wheelDeltaX = wheelDeltaY;
              wheelDeltaY = 0;
          }

          if ( this.options.snap ) {
              newX = this.currentPage.pageX;
              newY = this.currentPage.pageY;

              if ( wheelDeltaX > 0 ) {
                  newX--;
              } else if ( wheelDeltaX < 0 ) {
                  newX++;
              }

              if ( wheelDeltaY > 0 ) {
                  newY--;
              } else if ( wheelDeltaY < 0 ) {
                  newY++;
              }

              this.goToPage(newX, newY);

              return;
          }

          newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
          newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

          this.directionX = wheelDeltaX > 0 ? -1 : wheelDeltaX < 0 ? 1 : 0;
          this.directionY = wheelDeltaY > 0 ? -1 : wheelDeltaY < 0 ? 1 : 0;

          if ( newX > 0 ) {
              newX = 0;
          } else if ( newX < this.maxScrollX ) {
              newX = this.maxScrollX;
          }

          if ( newY > 0 ) {
              newY = 0;
          } else if ( newY < this.maxScrollY ) {
              newY = this.maxScrollY;
          }

          this.scrollTo(newX, newY, 0);

  // INSERT POINT: _wheel
      },

      _initSnap: function () {
          this.currentPage = {};

          if ( typeof this.options.snap == 'string' ) {
              this.options.snap = this.scroller.querySelectorAll(this.options.snap);
          }

          this.on('refresh', function () {
              var i = 0, l,
                  m = 0, n,
                  cx, cy,
                  x = 0, y,
                  stepX = this.options.snapStepX || this.wrapperWidth,
                  stepY = this.options.snapStepY || this.wrapperHeight,
                  el;

              this.pages = [];

              if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
                  return;
              }

              if ( this.options.snap === true ) {
                  cx = Math.round( stepX / 2 );
                  cy = Math.round( stepY / 2 );

                  while ( x > -this.scrollerWidth ) {
                      this.pages[i] = [];
                      l = 0;
                      y = 0;

                      while ( y > -this.scrollerHeight ) {
                          this.pages[i][l] = {
                              x: Math.max(x, this.maxScrollX),
                              y: Math.max(y, this.maxScrollY),
                              width: stepX,
                              height: stepY,
                              cx: x - cx,
                              cy: y - cy
                          };

                          y -= stepY;
                          l++;
                      }

                      x -= stepX;
                      i++;
                  }
              } else {
                  el = this.options.snap;
                  l = el.length;
                  n = -1;

                  for ( ; i < l; i++ ) {
                      if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
                          m = 0;
                          n++;
                      }

                      if ( !this.pages[m] ) {
                          this.pages[m] = [];
                      }

                      x = Math.max(-el[i].offsetLeft, this.maxScrollX);
                      y = Math.max(-el[i].offsetTop, this.maxScrollY);
                      cx = x - Math.round(el[i].offsetWidth / 2);
                      cy = y - Math.round(el[i].offsetHeight / 2);

                      this.pages[m][n] = {
                          x: x,
                          y: y,
                          width: el[i].offsetWidth,
                          height: el[i].offsetHeight,
                          cx: cx,
                          cy: cy
                      };

                      if ( x > this.maxScrollX ) {
                          m++;
                      }
                  }
              }

              this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

              // Update snap threshold if needed
              if ( this.options.snapThreshold % 1 === 0 ) {
                  this.snapThresholdX = this.options.snapThreshold;
                  this.snapThresholdY = this.options.snapThreshold;
              } else {
                  this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
                  this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
              }
          });

          this.on('flick', function () {
              var time = this.options.snapSpeed || Math.max(
                      Math.max(
                          Math.min(Math.abs(this.x - this.startX), 1000),
                          Math.min(Math.abs(this.y - this.startY), 1000)
                      ), 300);

              this.goToPage(
                  this.currentPage.pageX + this.directionX,
                  this.currentPage.pageY + this.directionY,
                  time
              );
          });
      },

      _nearestSnap: function (x, y) {
          if ( !this.pages.length ) {
              return { x: 0, y: 0, pageX: 0, pageY: 0 };
          }

          var i = 0,
              l = this.pages.length,
              m = 0;

          // Check if we exceeded the snap threshold
          if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
              Math.abs(y - this.absStartY) < this.snapThresholdY ) {
              return this.currentPage;
          }

          if ( x > 0 ) {
              x = 0;
          } else if ( x < this.maxScrollX ) {
              x = this.maxScrollX;
          }

          if ( y > 0 ) {
              y = 0;
          } else if ( y < this.maxScrollY ) {
              y = this.maxScrollY;
          }

          for ( ; i < l; i++ ) {
              if ( x >= this.pages[i][0].cx ) {
                  x = this.pages[i][0].x;
                  break;
              }
          }

          l = this.pages[i].length;

          for ( ; m < l; m++ ) {
              if ( y >= this.pages[0][m].cy ) {
                  y = this.pages[0][m].y;
                  break;
              }
          }

          if ( i == this.currentPage.pageX ) {
              i += this.directionX;

              if ( i < 0 ) {
                  i = 0;
              } else if ( i >= this.pages.length ) {
                  i = this.pages.length - 1;
              }

              x = this.pages[i][0].x;
          }

          if ( m == this.currentPage.pageY ) {
              m += this.directionY;

              if ( m < 0 ) {
                  m = 0;
              } else if ( m >= this.pages[0].length ) {
                  m = this.pages[0].length - 1;
              }

              y = this.pages[0][m].y;
          }

          return {
              x: x,
              y: y,
              pageX: i,
              pageY: m
          };
      },

      goToPage: function (x, y, time, easing) {
          easing = easing || this.options.bounceEasing;

          if ( x >= this.pages.length ) {
              x = this.pages.length - 1;
          } else if ( x < 0 ) {
              x = 0;
          }

          if ( y >= this.pages[x].length ) {
              y = this.pages[x].length - 1;
          } else if ( y < 0 ) {
              y = 0;
          }

          var posX = this.pages[x][y].x,
              posY = this.pages[x][y].y;

          time = time === undefined ? this.options.snapSpeed || Math.max(
              Math.max(
                  Math.min(Math.abs(posX - this.x), 1000),
                  Math.min(Math.abs(posY - this.y), 1000)
              ), 300) : time;

          this.currentPage = {
              x: posX,
              y: posY,
              pageX: x,
              pageY: y
          };

          this.scrollTo(posX, posY, time, easing);
      },

      next: function (time, easing) {
          var x = this.currentPage.pageX,
              y = this.currentPage.pageY;

          x++;

          if ( x >= this.pages.length && this.hasVerticalScroll ) {
              x = 0;
              y++;
          }

          this.goToPage(x, y, time, easing);
      },

      prev: function (time, easing) {
          var x = this.currentPage.pageX,
              y = this.currentPage.pageY;

          x--;

          if ( x < 0 && this.hasVerticalScroll ) {
              x = 0;
              y--;
          }

          this.goToPage(x, y, time, easing);
      },

      _initKeys: function (e) {
          // default key bindings
          var keys = {
              pageUp: 33,
              pageDown: 34,
              end: 35,
              home: 36,
              left: 37,
              up: 38,
              right: 39,
              down: 40
          };
          var i;

          // if you give me characters I give you keycode
          if ( typeof this.options.keyBindings == 'object' ) {
              for ( i in this.options.keyBindings ) {
                  if ( typeof this.options.keyBindings[i] == 'string' ) {
                      this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
                  }
              }
          } else {
              this.options.keyBindings = {};
          }

          for ( i in keys ) {
              this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
          }

          utils.addEvent(window, 'keydown', this);

          this.on('destroy', function () {
              utils.removeEvent(window, 'keydown', this);
          });
      },

      _key: function (e) {
          if ( !this.enabled ) {
              return;
          }

          var snap = this.options.snap,   // we are using this alot, better to cache it
              newX = snap ? this.currentPage.pageX : this.x,
              newY = snap ? this.currentPage.pageY : this.y,
              now = utils.getTime(),
              prevTime = this.keyTime || 0,
              acceleration = 0.250,
              pos;

          if ( this.options.useTransition && this.isInTransition ) {
              pos = this.getComputedPosition();

              this._translate(Math.round(pos.x), Math.round(pos.y));
              this.isInTransition = false;
          }

          this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

          switch ( e.keyCode ) {
              case this.options.keyBindings.pageUp:
                  if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
                      newX += snap ? 1 : this.wrapperWidth;
                  } else {
                      newY += snap ? 1 : this.wrapperHeight;
                  }
                  break;
              case this.options.keyBindings.pageDown:
                  if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
                      newX -= snap ? 1 : this.wrapperWidth;
                  } else {
                      newY -= snap ? 1 : this.wrapperHeight;
                  }
                  break;
              case this.options.keyBindings.end:
                  newX = snap ? this.pages.length-1 : this.maxScrollX;
                  newY = snap ? this.pages[0].length-1 : this.maxScrollY;
                  break;
              case this.options.keyBindings.home:
                  newX = 0;
                  newY = 0;
                  break;
              case this.options.keyBindings.left:
                  newX += snap ? -1 : 5 + this.keyAcceleration>>0;
                  break;
              case this.options.keyBindings.up:
                  newY += snap ? 1 : 5 + this.keyAcceleration>>0;
                  break;
              case this.options.keyBindings.right:
                  newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
                  break;
              case this.options.keyBindings.down:
                  newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
                  break;
              default:
                  return;
          }

          if ( snap ) {
              this.goToPage(newX, newY);
              return;
          }

          if ( newX > 0 ) {
              newX = 0;
              this.keyAcceleration = 0;
          } else if ( newX < this.maxScrollX ) {
              newX = this.maxScrollX;
              this.keyAcceleration = 0;
          }

          if ( newY > 0 ) {
              newY = 0;
              this.keyAcceleration = 0;
          } else if ( newY < this.maxScrollY ) {
              newY = this.maxScrollY;
              this.keyAcceleration = 0;
          }

          this.scrollTo(newX, newY, 0);

          this.keyTime = now;
      },

      _animate: function (destX, destY, duration, easingFn) {
          var that = this,
              startX = this.x,
              startY = this.y,
              startTime = utils.getTime(),
              destTime = startTime + duration;

          function step () {
              var now = utils.getTime(),
                  newX, newY,
                  easing;

              if ( now >= destTime ) {
                  that.isAnimating = false;
                  that._translate(destX, destY);

                  if ( !that.resetPosition(that.options.bounceTime) ) {
                      that._execEvent('scrollEnd');
                  }

                  return;
              }

              now = ( now - startTime ) / duration;
              easing = easingFn(now);
              newX = ( destX - startX ) * easing + startX;
              newY = ( destY - startY ) * easing + startY;
              that._translate(newX, newY);

              if ( that.isAnimating ) {
                  rAF(step);
              }
          }

          this.isAnimating = true;
          step();
      },
      handleEvent: function (e) {
          switch ( e.type ) {
              case 'touchstart':
              case 'pointerdown':
              case 'MSPointerDown':
              case 'mousedown':
                  this._start(e);
                  break;
              case 'touchmove':
              case 'pointermove':
              case 'MSPointerMove':
              case 'mousemove':
                  this._move(e);
                  break;
              case 'touchend':
              case 'pointerup':
              case 'MSPointerUp':
              case 'mouseup':
              case 'touchcancel':
              case 'pointercancel':
              case 'MSPointerCancel':
              case 'mousecancel':
                  this._end(e);
                  break;
              case 'orientationchange':
              case 'resize':
                  this._resize();
                  break;
              case 'transitionend':
              case 'webkitTransitionEnd':
              case 'oTransitionEnd':
              case 'MSTransitionEnd':
                  this._transitionEnd(e);
                  break;
              case 'wheel':
              case 'DOMMouseScroll':
              case 'mousewheel':
                  this._wheel(e);
                  break;
              case 'keydown':
                  this._key(e);
                  break;
              case 'click':
                  if ( this.enabled && !e._constructed ) {
                      e.preventDefault();
                      e.stopPropagation();
                  }
                  break;
          }
      }
  };
  function createDefaultScrollbar (direction, interactive, type) {
      var scrollbar = document.createElement('div'),
          indicator = document.createElement('div');

      if ( type === true ) {
          scrollbar.style.cssText = 'position:absolute;z-index:9999';
          indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
      }

      indicator.className = 'iScrollIndicator';

      if ( direction == 'h' ) {
          if ( type === true ) {
              scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
              indicator.style.height = '100%';
          }
          scrollbar.className = 'iScrollHorizontalScrollbar';
      } else {
          if ( type === true ) {
              scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
              indicator.style.width = '100%';
          }
          scrollbar.className = 'iScrollVerticalScrollbar';
      }

      scrollbar.style.cssText += ';overflow:hidden';

      if ( !interactive ) {
          scrollbar.style.pointerEvents = 'none';
      }

      scrollbar.appendChild(indicator);

      return scrollbar;
  }

  function Indicator (scroller, options) {
      this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
      this.wrapperStyle = this.wrapper.style;
      this.indicator = this.wrapper.children[0];
      this.indicatorStyle = this.indicator.style;
      this.scroller = scroller;

      this.options = {
          listenX: true,
          listenY: true,
          interactive: false,
          resize: true,
          defaultScrollbars: false,
          shrink: false,
          fade: false,
          speedRatioX: 0,
          speedRatioY: 0
      };

      for ( var i in options ) {
          this.options[i] = options[i];
      }

      this.sizeRatioX = 1;
      this.sizeRatioY = 1;
      this.maxPosX = 0;
      this.maxPosY = 0;

      if ( this.options.interactive ) {
          if ( !this.options.disableTouch ) {
              utils.addEvent(this.indicator, 'touchstart', this);
              utils.addEvent(window, 'touchend', this);
          }
          if ( !this.options.disablePointer ) {
              utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
              utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
          }
          if ( !this.options.disableMouse ) {
              utils.addEvent(this.indicator, 'mousedown', this);
              utils.addEvent(window, 'mouseup', this);
          }
      }

      if ( this.options.fade ) {
          this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
          var durationProp = utils.style.transitionDuration;
          if(!durationProp) {
              return;
          }
          this.wrapperStyle[durationProp] = utils.isBadAndroid ? '0.0001ms' : '0ms';
          // remove 0.0001ms
          var self = this;
          if(utils.isBadAndroid) {
              rAF(function() {
                  if(self.wrapperStyle[durationProp] === '0.0001ms') {
                      self.wrapperStyle[durationProp] = '0s';
                  }
              });
          }
          this.wrapperStyle.opacity = '0';
      }
  }

  Indicator.prototype = {
      handleEvent: function (e) {
          switch ( e.type ) {
              case 'touchstart':
              case 'pointerdown':
              case 'MSPointerDown':
              case 'mousedown':
                  this._start(e);
                  break;
              case 'touchmove':
              case 'pointermove':
              case 'MSPointerMove':
              case 'mousemove':
                  this._move(e);
                  break;
              case 'touchend':
              case 'pointerup':
              case 'MSPointerUp':
              case 'mouseup':
              case 'touchcancel':
              case 'pointercancel':
              case 'MSPointerCancel':
              case 'mousecancel':
                  this._end(e);
                  break;
          }
      },

      destroy: function () {
          if ( this.options.fadeScrollbars ) {
              clearTimeout(this.fadeTimeout);
              this.fadeTimeout = null;
          }
          if ( this.options.interactive ) {
              utils.removeEvent(this.indicator, 'touchstart', this);
              utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
              utils.removeEvent(this.indicator, 'mousedown', this);

              utils.removeEvent(window, 'touchmove', this);
              utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
              utils.removeEvent(window, 'mousemove', this);

              utils.removeEvent(window, 'touchend', this);
              utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
              utils.removeEvent(window, 'mouseup', this);
          }

          if ( this.options.defaultScrollbars ) {
              this.wrapper.parentNode.removeChild(this.wrapper);
          }
      },

      _start: function (e) {
          var point = e.touches ? e.touches[0] : e;

          e.preventDefault();
          e.stopPropagation();

          this.transitionTime();

          this.initiated = true;
          this.moved = false;
          this.lastPointX = point.pageX;
          this.lastPointY = point.pageY;

          this.startTime  = utils.getTime();

          if ( !this.options.disableTouch ) {
              utils.addEvent(window, 'touchmove', this);
          }
          if ( !this.options.disablePointer ) {
              utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
          }
          if ( !this.options.disableMouse ) {
              utils.addEvent(window, 'mousemove', this);
          }

          this.scroller._execEvent('beforeScrollStart');
      },

      _move: function (e) {
          var point = e.touches ? e.touches[0] : e,
              deltaX, deltaY,
              newX, newY,
              timestamp = utils.getTime();

          if ( !this.moved ) {
              this.scroller._execEvent('scrollStart');
          }

          this.moved = true;

          deltaX = point.pageX - this.lastPointX;
          this.lastPointX = point.pageX;

          deltaY = point.pageY - this.lastPointY;
          this.lastPointY = point.pageY;

          newX = this.x + deltaX;
          newY = this.y + deltaY;

          this._pos(newX, newY);

  // INSERT POINT: indicator._move

          e.preventDefault();
          e.stopPropagation();
      },

      _end: function (e) {
          if ( !this.initiated ) {
              return;
          }

          this.initiated = false;

          e.preventDefault();
          e.stopPropagation();

          utils.removeEvent(window, 'touchmove', this);
          utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
          utils.removeEvent(window, 'mousemove', this);

          if ( this.scroller.options.snap ) {
              var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

              var time = this.options.snapSpeed || Math.max(
                      Math.max(
                          Math.min(Math.abs(this.scroller.x - snap.x), 1000),
                          Math.min(Math.abs(this.scroller.y - snap.y), 1000)
                      ), 300);

              if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
                  this.scroller.directionX = 0;
                  this.scroller.directionY = 0;
                  this.scroller.currentPage = snap;
                  this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
              }
          }

          if ( this.moved ) {
              this.scroller._execEvent('scrollEnd');
          }
      },

      transitionTime: function (time) {
          time = time || 0;
          var durationProp = utils.style.transitionDuration;
          if(!durationProp) {
              return;
          }

          this.indicatorStyle[durationProp] = time + 'ms';

          if ( !time && utils.isBadAndroid ) {
              this.indicatorStyle[durationProp] = '0.0001ms';
              // remove 0.0001ms
              var self = this;
              rAF(function() {
                  if(self.indicatorStyle[durationProp] === '0.0001ms') {
                      self.indicatorStyle[durationProp] = '0s';
                  }
              });
          }
      },

      transitionTimingFunction: function (easing) {
          this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
      },

      refresh: function () {
          this.transitionTime();

          if ( this.options.listenX && !this.options.listenY ) {
              this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
          } else if ( this.options.listenY && !this.options.listenX ) {
              this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
          } else {
              this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
          }

          if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
              utils.addClass(this.wrapper, 'iScrollBothScrollbars');
              utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

              if ( this.options.defaultScrollbars && this.options.customStyle ) {
                  if ( this.options.listenX ) {
                      this.wrapper.style.right = '8px';
                  } else {
                      this.wrapper.style.bottom = '8px';
                  }
              }
          } else {
              utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
              utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

              if ( this.options.defaultScrollbars && this.options.customStyle ) {
                  if ( this.options.listenX ) {
                      this.wrapper.style.right = '2px';
                  } else {
                      this.wrapper.style.bottom = '2px';
                  }
              }
          }

          var r = this.wrapper.offsetHeight;  // force refresh

          if ( this.options.listenX ) {
              this.wrapperWidth = this.wrapper.clientWidth;
              if ( this.options.resize ) {
                  this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
                  this.indicatorStyle.width = this.indicatorWidth + 'px';
              } else {
                  this.indicatorWidth = this.indicator.clientWidth;
              }

              this.maxPosX = this.wrapperWidth - this.indicatorWidth;

              if ( this.options.shrink == 'clip' ) {
                  this.minBoundaryX = -this.indicatorWidth + 8;
                  this.maxBoundaryX = this.wrapperWidth - 8;
              } else {
                  this.minBoundaryX = 0;
                  this.maxBoundaryX = this.maxPosX;
              }

              this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));
          }

          if ( this.options.listenY ) {
              this.wrapperHeight = this.wrapper.clientHeight;
              if ( this.options.resize ) {
                  this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
                  this.indicatorStyle.height = this.indicatorHeight + 'px';
              } else {
                  this.indicatorHeight = this.indicator.clientHeight;
              }

              this.maxPosY = this.wrapperHeight - this.indicatorHeight;

              if ( this.options.shrink == 'clip' ) {
                  this.minBoundaryY = -this.indicatorHeight + 8;
                  this.maxBoundaryY = this.wrapperHeight - 8;
              } else {
                  this.minBoundaryY = 0;
                  this.maxBoundaryY = this.maxPosY;
              }

              this.maxPosY = this.wrapperHeight - this.indicatorHeight;
              this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
          }

          this.updatePosition();
      },

      updatePosition: function () {
          var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
              y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

          if ( !this.options.ignoreBoundaries ) {
              if ( x < this.minBoundaryX ) {
                  if ( this.options.shrink == 'scale' ) {
                      this.width = Math.max(this.indicatorWidth + x, 8);
                      this.indicatorStyle.width = this.width + 'px';
                  }
                  x = this.minBoundaryX;
              } else if ( x > this.maxBoundaryX ) {
                  if ( this.options.shrink == 'scale' ) {
                      this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
                      this.indicatorStyle.width = this.width + 'px';
                      x = this.maxPosX + this.indicatorWidth - this.width;
                  } else {
                      x = this.maxBoundaryX;
                  }
              } else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
                  this.width = this.indicatorWidth;
                  this.indicatorStyle.width = this.width + 'px';
              }

              if ( y < this.minBoundaryY ) {
                  if ( this.options.shrink == 'scale' ) {
                      this.height = Math.max(this.indicatorHeight + y * 3, 8);
                      this.indicatorStyle.height = this.height + 'px';
                  }
                  y = this.minBoundaryY;
              } else if ( y > this.maxBoundaryY ) {
                  if ( this.options.shrink == 'scale' ) {
                      this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
                      this.indicatorStyle.height = this.height + 'px';
                      y = this.maxPosY + this.indicatorHeight - this.height;
                  } else {
                      y = this.maxBoundaryY;
                  }
              } else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
                  this.height = this.indicatorHeight;
                  this.indicatorStyle.height = this.height + 'px';
              }
          }

          this.x = x;
          this.y = y;

          if ( this.scroller.options.useTransform ) {
              this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
          } else {
              this.indicatorStyle.left = x + 'px';
              this.indicatorStyle.top = y + 'px';
          }
      },

      _pos: function (x, y) {
          if ( x < 0 ) {
              x = 0;
          } else if ( x > this.maxPosX ) {
              x = this.maxPosX;
          }

          if ( y < 0 ) {
              y = 0;
          } else if ( y > this.maxPosY ) {
              y = this.maxPosY;
          }

          x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
          y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

          this.scroller.scrollTo(x, y);
      },

      fade: function (val, hold) {
          if ( hold && !this.visible ) {
              return;
          }

          clearTimeout(this.fadeTimeout);
          this.fadeTimeout = null;

          var time = val ? 250 : 500,
              delay = val ? 0 : 300;

          val = val ? '1' : '0';

          this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

          this.fadeTimeout = setTimeout((function (val) {
              this.wrapperStyle.opacity = val;
              this.visible = +val;
          }).bind(this, val), delay);
      }
  };

  IScroll.utils = utils;

  if ( typeof module != 'undefined' && module.exports ) {
      module.exports = IScroll;
  } else if ( typeof define == 'function' && define.amd ) {
      define( function () { return IScroll; } );

      //making sure scrollOverflow works when using Require.js
      //in the browser
      if(typeof window !== 'undefined'){
          window.IScroll = IScroll;
      }
  } else {
      window.IScroll = IScroll;
  }

  };


  /*!
  * Scrolloverflow 2.0.2 module for fullPage.js >= 3
  * https://github.com/alvarotrigo/fullPage.js
  * @license MIT licensed
  *
  * Copyright (C) 2015 alvarotrigo.com - A project by Alvaro Trigo
  */
var scrollOverflow2 = function () {
      window.fp_scrolloverflow = (function() {

          // check if IScroll is available in global scope
          if (!window.IScroll) {
              // otherwise create local one from module.exports
              IScroll = module.exports;
          }

          // keeping central set of classnames and selectors
          var SCROLLABLE =            'fp-scrollable';
          var SCROLLABLE_SEL =        '.' + SCROLLABLE;

          var ACTIVE =                'active';
          var ACTIVE_SEL =            '.' + ACTIVE;

          var SECTION =               'fp-section';
          var SECTION_SEL =           '.' + SECTION;
          var SECTION_ACTIVE_SEL =    SECTION_SEL + ACTIVE_SEL;

          var SLIDE =                 'fp-slide';
          var SLIDE_SEL =             '.' + SLIDE;
          var SLIDE_ACTIVE_SEL =      SLIDE_SEL + ACTIVE_SEL;

          var SLIDES_WRAPPER =        'fp-slides';
          var SLIDES_WRAPPER_SEL =    '.' + SLIDES_WRAPPER;

          var TABLE_CELL =            'fp-tableCell';
          var TABLE_CELL_SEL =        '.' + TABLE_CELL;

          var RESPONSIVE =            'fp-responsive';
          var AUTO_HEIGHT_RESPONSIVE= 'fp-auto-height-responsive';

          /*
          * Turns iScroll `mousewheel` option off dynamically
          * https://github.com/cubiq/iscroll/issues/1036
          */
          IScroll.prototype.wheelOn = function () {
              this.wrapper.addEventListener('wheel', this);
              this.wrapper.addEventListener('mousewheel', this);
              this.wrapper.addEventListener('DOMMouseScroll', this);
          };

          /*
          * Turns iScroll `mousewheel` option on dynamically
          * https://github.com/cubiq/iscroll/issues/1036
          */
          IScroll.prototype.wheelOff = function () {
              this.wrapper.removeEventListener('wheel', this);
              this.wrapper.removeEventListener('mousewheel', this);
              this.wrapper.removeEventListener('DOMMouseScroll', this);
          };

          /**
          * Returns an integer representing the padding dimensions in px.
          */
          function getPaddings(element){
              var section = fp_utils.closest(element, SECTION_SEL);
              if(section != null){
                  return parseInt(getComputedStyle(section)['padding-bottom']) + parseInt(getComputedStyle(section)['padding-top']);
              }
              return 0;
          }

          function scrollBarHandler(){
              var self = this;
              self.options = null;

              self.init = function(options, iscrollOptions){
                  self.options = options;
                  self.iscrollOptions = iscrollOptions;

                  if(document.readyState === 'complete'){
                      createScrollBarForAll();
                      fullpage_api.shared.afterRenderActions();
                  }
                  //after DOM and images are loaded
                  window.addEventListener('load', function(){
                      createScrollBarForAll();
                      fullpage_api.shared.afterRenderActions();
                  });

                  return self;
              };

              /**
              * Creates the scrollbar for the sections and slides in the site
              */
              function createScrollBarForAll(){
                  if(fp_utils.hasClass(document.body, RESPONSIVE)){
                      removeResponsiveScrollOverflows();
                  }
                  else{
                      forEachSectionAndSlide(createScrollBar);
                  }
              }

              /**
              * Checks if the element needs scrollbar and if the user wants to apply it.
              * If so it creates it.
              *
              * @param {Object} element   jQuery object of the section or slide
              */
              function createScrollBar(element){
                  //User doesn't want scrollbar here? Sayonara baby!
                  if(fp_utils.hasClass(element, 'fp-noscroll')) return;

                  //necessary to make `scrollHeight` work under Opera 12
                  fp_utils.css(element, {'overflow': 'hidden'});

                  var scrollOverflowHandler = self.options.scrollOverflowHandler;
                  var wrap = scrollOverflowHandler.wrapContent();
                  var section = fp_utils.closest(element, SECTION_SEL); //in case element is a slide
                  var scrollable = scrollOverflowHandler.scrollable(element);
                  var contentHeight;
                  var paddings = getPaddings(section);

                  //if there was scroll, the contentHeight will be the one in the scrollable section
                  if(scrollable != null){
                      contentHeight = scrollOverflowHandler.scrollHeight(element);
                  }
                  else{
                      contentHeight = element.scrollHeight - paddings;
                      if(self.options.verticalCentered){
                          contentHeight = $(TABLE_CELL_SEL, element)[0].scrollHeight - paddings;
                      }
                  }

                  var scrollHeight = fp_utils.getWindowHeight() - paddings;

                  //needs scroll?
                  if ( contentHeight > scrollHeight) {
                      //did we already have an scrollbar ? Updating it
                      if(scrollable != null){
                          scrollOverflowHandler.update(element, scrollHeight);
                      }
                       //creating the scrolling
                      else{
                          if(self.options.verticalCentered){
                              fp_utils.wrapInner($(TABLE_CELL_SEL, element)[0], wrap.scroller);
                              fp_utils.wrapInner($(TABLE_CELL_SEL, element)[0], wrap.scrollable);
                          }else{
                              fp_utils.wrapInner(element, wrap.scroller);
                              fp_utils.wrapInner(element, wrap.scrollable);
                          }
                          scrollOverflowHandler.create(element, scrollHeight, self.iscrollOptions);
                      }
                  }

                  //removing the scrolling when it is not necessary anymore
                  else{
                      scrollOverflowHandler.remove(element);
                  }

                  //undo
                  fp_utils.css(element, {'overflow': ''});
              }

              /**
              * Applies a callback function to each section in the site
              * or the slides within them
              */
              function forEachSectionAndSlide(callback){
                  $(SECTION_SEL).forEach(function(section){
                      var slides = $(SLIDE_SEL, section);

                      if(slides.length){
                          slides.forEach(function(slide){
                              callback(slide);
                          });
                      }else{
                          callback(section);
                      }
                  });
              }

              /**
              * Removes scrollOverflow for sections using the class `fp-auto-height-responsive`
              */
              function removeResponsiveScrollOverflows(){
                  var scrollOverflowHandler = self.options.scrollOverflowHandler;
                  forEachSectionAndSlide(function(element){
                      if(fp_utils.hasClass( fp_utils.closest(element, SECTION_SEL), AUTO_HEIGHT_RESPONSIVE)){
                          scrollOverflowHandler.remove(element);
                      }
                  });
              }

              //public functions
              self.createScrollBarForAll = createScrollBarForAll;
          }

          /**
           * An object to handle overflow scrolling.
           * This uses jquery.slimScroll to accomplish overflow scrolling.
           * It is possible to pass in an alternate scrollOverflowHandler
           * to the fullpage.js option that implements the same functions
           * as this handler.
           *
           * @type {Object}
           */
          var $ = null;
          var g_fullpageOptions = null;
          var iscrollHandler = {
              refreshId: null,
              iScrollInstances: [],

              // Default options for iScroll.js used when using scrollOverflow
              iscrollOptions: {
                  scrollbars: true,
                  mouseWheel: true,
                  hideScrollbars: false,
                  fadeScrollbars: false,
                  disableMouse: true,
                  interactiveScrollbars: true
              },

              init: function(options){
                  $ = fp_utils.$;
                  g_fullpageOptions = options;

                  var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));

                  //fixing bug in iScroll with links: https://github.com/cubiq/iscroll/issues/783
                  iscrollHandler.iscrollOptions.click = isTouch; // see #2035

                  //extending iScroll options with the user custom ones
                  iscrollHandler.iscrollOptions = fp_utils.deepExtend(iscrollHandler.iscrollOptions, options.scrollOverflowOptions);

                  return new scrollBarHandler().init(options, iscrollHandler.iscrollOptions);
              },

              // Enables or disables the mouse wheel for the active section or all slides in it
              toggleWheel: function(value){
                  var scrollable = $(SCROLLABLE_SEL, $(SECTION_ACTIVE_SEL)[0]);
                  scrollable.forEach(function(item){
                      var iScrollInstance = item.fp_iscrollInstance;
                      if(iScrollInstance != null){
                          if(value){
                              iScrollInstance.wheelOn();
                          }
                          else{
                              iScrollInstance.wheelOff();
                          }
                      }
                  });
              },

              /**
              * Turns off iScroll for the destination section.
              * When scrolling very fast on some trackpads (and Apple laptops) the inertial scrolling would
              * scroll the destination section/slide before the sections animations ends.
              */
              onLeave: function(){
                  iscrollHandler.toggleWheel(false);
              },

              // Turns off iScroll for the leaving section
              beforeLeave: function(){
                  iscrollHandler.onLeave()
              },

              // Turns on iScroll on section load
              afterLoad: function(){
                  iscrollHandler.toggleWheel(true);
              },

              /**
               * Called when overflow scrolling is needed for a section.
               *
               * @param  {Object} element      jQuery object containing current section
               * @param  {Number} scrollHeight Current window height in pixels
               */
              create: function(element, scrollHeight, iscrollOptions) {
                  var scrollable = $(SCROLLABLE_SEL, element);

                  scrollable.forEach(function(item) {
                      fp_utils.css(item, {'height': scrollHeight + 'px'});

                      var iScrollInstance = item.fp_iscrollInstance;
                      if (iScrollInstance != null) {
                          iscrollHandler.iScrollInstances.forEach(function(instance){
                              instance.destroy();
                          });
                      }

                      iScrollInstance = new IScroll(item, iscrollOptions);
                      iscrollHandler.iScrollInstances.push(iScrollInstance);

                      if(!fp_utils.hasClass(fp_utils.closest(element, SECTION_SEL), ACTIVE)){
                          //off by default until the section gets active
                          iScrollInstance.wheelOff();
                      }

                      item.fp_iscrollInstance = iScrollInstance;
                  });
              },

              /**
               * Return a boolean depending on whether the scrollable element is a
               * the end or at the start of the scrolling depending on the given type.
               *
               * @param  {String}  type       Either 'top' or 'bottom'
               * @param  {Object}  scrollable jQuery object for the scrollable element
               * @return {Boolean}
               */
              isScrolled: function(type, scrollable) {
                  var scroller = scrollable.fp_iscrollInstance;

                  //no scroller?
                  if (!scroller) {
                      return true;
                  }

                  if (type === 'top'){
                      return scroller.y >= 0 && !fp_utils.getScrollTop(scrollable);
                  } else if (type === 'bottom') {
                      return (0 - scroller.y) + fp_utils.getScrollTop(scrollable) + 1 + scrollable.offsetHeight >= scrollable.scrollHeight;
                  }
              },

              /**
               * Returns the scrollable element for the given section.
               * If there are landscape slides, will only return a scrollable element
               * if it is in the active slide.
               *
               * @param  {Object}  activeSection jQuery object containing current section
               * @return {Boolean}
               */
              scrollable: function(activeSection){
                  // if there are landscape slides, we check if the scrolling bar is in the current one or not
                  if ($(SLIDES_WRAPPER_SEL, activeSection).length) {
                      return $(SCROLLABLE_SEL, $(SLIDE_ACTIVE_SEL, activeSection)[0] )[0];
                  }
                  return $(SCROLLABLE_SEL, activeSection)[0];
              },

              /**
               * Returns the scroll height of the wrapped content.
               * If this is larger than the window height minus section padding,
               * overflow scrolling is needed.
               *
               * @param  {Object} element jQuery object containing current section
               * @return {Number}
               */
              scrollHeight: function(element) {
                  return $('.fp-scroller', $(SCROLLABLE_SEL, element)[0] )[0].scrollHeight;
              },

              /**
               * Called when overflow scrolling is no longer needed for a section.
               *
               * @param  {Object} element      jQuery object containing current section
               */
              remove: function(element) {
                  if(element == null) return;

                  var scrollable = $(SCROLLABLE_SEL, element)[0];
                  if (scrollable != null) {
                      var iScrollInstance = scrollable.fp_iscrollInstance;
                      if(iScrollInstance != null){
                          iScrollInstance.destroy();
                      }

                      scrollable.fp_iscrollInstance = null;

                      //unwrapping...
                      fp_utils.unwrap($('.fp-scroller', element)[0]);
                      fp_utils.unwrap($(SCROLLABLE_SEL, element)[0]);
                  }
              },

              /**
               * Called when overflow scrolling has already been setup but the
               * window height has potentially changed.
               *
               * @param  {Object} element      jQuery object containing current section
               * @param  {Number} scrollHeight Current window height in pixels
               */
              update: function(element, scrollHeight) {
                  //using a timeout in order to execute the refresh function only once when `update` is called multiple times in a
                  //short period of time.
                  //it also comes on handy because iScroll requires the use of timeout when using `refresh`.
                  clearTimeout(iscrollHandler.refreshId);
                  iscrollHandler.refreshId = setTimeout(function(){
                      iscrollHandler.iScrollInstances.forEach(function(instance){
                          instance.refresh();

                          //ugly hack that we are forced to use due to the timeout delay
                          //otherwise done on the fullpage.js reBuild function
                          fullpage_api.silentMoveTo(fp_utils.index($(SECTION_ACTIVE_SEL)[0]) + 1);
                      });
                  }, 150);

                  //updating the wrappers height
                  fp_utils.css($(SCROLLABLE_SEL, element)[0], {'height': scrollHeight + 'px'});

                  var parentHeight = g_fullpageOptions.verticalCentered ? scrollHeight + getPaddings(element) : scrollHeight;
                  fp_utils.css($(SCROLLABLE_SEL, element)[0].parentNode, {'height': parentHeight + 'px'});
              },

              /**
               * Called to get any additional elements needed to wrap the section
               * content in order to facilitate overflow scrolling.
               *
               * @return {String|Object} Can be a string containing HTML,
               *                         a DOM element, or jQuery object.
               */
              wrapContent: function() {
                  var scrollable = document.createElement('div');
                  scrollable.className = SCROLLABLE;

                  var scroller = document.createElement('div');
                  scroller.className = 'fp-scroller';

                  return {
                      scrollable: scrollable,
                      scroller: scroller
                  };
              }
          };

          return {
              iscrollHandler: iscrollHandler
          };
      })();
  };






/*!
 * @fullpage/react-fullpage 0.1.2
 * https://github.com/alvarotrigo/react-fullpage
 * @license https://github.com/alvarotrigo/react-fullpage#license
 *
 * Copyright (C) 2018 alvarotrigo.com - A project by Alvaro Trigo & Michael Walker
 */
(function webpackUniversalModuleDefinition(factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define("ReactFullpage", ["react"], factory);
	else if(typeof exports === 'object')
		exports["ReactFullpage"] = factory(require("react"));
	else
		window["ReactFullpage"] = factory(window["react"]);
})(function(__WEBPACK_EXTERNAL_MODULE__0__) {
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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__0__;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * fullPage 3.0.4 - Extensions 0.1.7
 * https://github.com/alvarotrigo/fullPage.js
 * @license http://alvarotrigo.com/fullPage/extensions/#license
 *
 * Copyright (C) 2015 alvarotrigo.com - A project by Alvaro Trigo
 */
(function( root, window, document, factory, undefined) {
    scrollOverflow1();
    scrollOverflow2();
    if( true ) {
        // AMD. Register as an anonymous module.
        !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
            root.fullpage = factory(window, document);
            return root.fullpage;
        }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, window, document, function(window, document){
    'use strict';

    // keeping central set of classnames and selectors
    var WRAPPER =               'fullpage-wrapper';
    var WRAPPER_SEL =           '.' + WRAPPER;

    // slimscroll
    var SCROLLABLE =            'fp-scrollable';
    var SCROLLABLE_SEL =        '.' + SCROLLABLE;

    // util
    var RESPONSIVE =            'fp-responsive';
    var NO_TRANSITION =         'fp-notransition';
    var DESTROYED =             'fp-destroyed';
    var ENABLED =               'fp-enabled';
    var VIEWING_PREFIX =        'fp-viewing';
    var ACTIVE =                'active';
    var ACTIVE_SEL =            '.' + ACTIVE;
    var COMPLETELY =            'fp-completely';
    var COMPLETELY_SEL =        '.' + COMPLETELY;

    // section
    var SECTION_DEFAULT_SEL =   '.section';
    var SECTION =               'fp-section';
    var SECTION_SEL =           '.' + SECTION;
    var SECTION_ACTIVE_SEL =    SECTION_SEL + ACTIVE_SEL;
    var TABLE_CELL =            'fp-tableCell';
    var TABLE_CELL_SEL =        '.' + TABLE_CELL;
    var AUTO_HEIGHT =           'fp-auto-height';
    var AUTO_HEIGHT_SEL =       '.' + AUTO_HEIGHT;
    var NORMAL_SCROLL =         'fp-normal-scroll';
    var NORMAL_SCROLL_SEL =     '.' + NORMAL_SCROLL;

    // section nav
    var SECTION_NAV =           'fp-nav';
    var SECTION_NAV_SEL =       '#' + SECTION_NAV;
    var SECTION_NAV_TOOLTIP =   'fp-tooltip';
    var SECTION_NAV_TOOLTIP_SEL='.'+SECTION_NAV_TOOLTIP;
    var SHOW_ACTIVE_TOOLTIP =   'fp-show-active';

    // slide
    var SLIDE_DEFAULT_SEL =     '.slide';
    var SLIDE =                 'fp-slide';
    var SLIDE_SEL =             '.' + SLIDE;
    var SLIDE_ACTIVE_SEL =      SLIDE_SEL + ACTIVE_SEL;
    var SLIDES_WRAPPER =        'fp-slides';
    var SLIDES_WRAPPER_SEL =    '.' + SLIDES_WRAPPER;
    var SLIDES_CONTAINER =      'fp-slidesContainer';
    var SLIDES_CONTAINER_SEL =  '.' + SLIDES_CONTAINER;
    var TABLE =                 'fp-table';
    var INITIAL =               'fp-initial';

    // slide nav
    var SLIDES_NAV =            'fp-slidesNav';
    var SLIDES_NAV_SEL =        '.' + SLIDES_NAV;
    var SLIDES_NAV_LINK_SEL =   SLIDES_NAV_SEL + ' a';
    var SLIDES_ARROW =          'fp-controlArrow';
    var SLIDES_ARROW_SEL =      '.' + SLIDES_ARROW;
    var SLIDES_PREV =           'fp-prev';
    var SLIDES_PREV_SEL =       '.' + SLIDES_PREV;
    var SLIDES_ARROW_PREV =     SLIDES_ARROW + ' ' + SLIDES_PREV;
    var SLIDES_ARROW_PREV_SEL = SLIDES_ARROW_SEL + SLIDES_PREV_SEL;
    var SLIDES_NEXT =           'fp-next';
    var SLIDES_NEXT_SEL =       '.' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT =     SLIDES_ARROW + ' ' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT_SEL = SLIDES_ARROW_SEL + SLIDES_NEXT_SEL;

    function initialise(containerSelector, options) {
        var isLicenseValid = options && new RegExp('([\\d\\w]{8}-){3}[\\d\\w]{8}|OPEN-SOURCE-GPLV3-LICENSE').test(options.licenseKey) || document.domain.indexOf('alvarotrigo.com') > -1;

        //only once my friend!
        if(hasClass($('html'), ENABLED)){ displayWarnings(); return; }

        // common jQuery objects
        var $htmlBody = $('html, body');
        var $body = $('body')[0];

        var FP = {};

        // Creating some defaults, extending them with any options that were provided
        options = deepExtend({
            //navigation
            menu: false,
            anchors:[],
            lockAnchors: false,
            navigation: false,
            navigationPosition: 'right',
            navigationTooltips: [],
            showActiveTooltip: false,
            slidesNavigation: false,
            slidesNavPosition: 'bottom',
            scrollBar: false,
            hybrid: false,

            //scrolling
            css3: true,
            scrollingSpeed: 700,
            autoScrolling: true,
            fitToSection: true,
            fitToSectionDelay: 1000,
            easing: 'easeInOutCubic',
            easingcss3: 'ease',
            loopBottom: false,
            loopTop: false,
            loopHorizontal: true,
            continuousVertical: false,
            continuousHorizontal: false,
            scrollHorizontally: false,
            interlockedSlides: false,
            dragAndMove: false,
            offsetSections: false,
            resetSliders: false,
            fadingEffect: false,
            normalScrollElements: null,
            scrollOverflow: false,
            scrollOverflowReset: false,
            scrollOverflowHandler: window.fp_scrolloverflow ? window.fp_scrolloverflow.iscrollHandler : null,
            scrollOverflowOptions: null,
            touchSensitivity: 5,
            normalScrollElementTouchThreshold: 5,
            bigSectionsDestination: null,

            //Accessibility
            keyboardScrolling: true,
            animateAnchor: true,
            recordHistory: true,

            //design
            controlArrows: true,
            controlArrowColor: '#fff',
            verticalCentered: true,
            sectionsColor : [],
            paddingTop: 0,
            paddingBottom: 0,
            fixedElements: null,
            responsive: 0, //backwards compabitility with responsiveWiddth
            responsiveWidth: 0,
            responsiveHeight: 0,
            responsiveSlides: false,
            parallax: false,
            parallaxOptions: {
                type: 'reveal',
                percentage: 62,
                property: 'translate'
            },

            //Custom selectors
            sectionSelector: SECTION_DEFAULT_SEL,
            slideSelector: SLIDE_DEFAULT_SEL,

            //events
            v2compatible: false,
            afterLoad: null,
            onLeave: null,
            afterRender: null,
            afterResize: null,
            afterReBuild: null,
            afterSlideLoad: null,
            onSlideLeave: null,
            afterResponsive: null,

            lazyLoading: true
        }, options);

        //flag to avoid very fast sliding for landscape sliders
        var slideMoving = false;

        var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/);
        var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
        var container = typeof containerSelector === 'string' ? $(containerSelector)[0] : containerSelector;
        var windowsHeight = getWindowHeight();
        var isResizing = false;
        var isWindowFocused = true;
        var lastScrolledDestiny;
        var lastScrolledSlide;
        var canScroll = true;
        var scrollings = [];
        var controlPressed;
        var startingSection;
        var isScrollAllowed = {};
        isScrollAllowed.m = {  'up':true, 'down':true, 'left':true, 'right':true };
        isScrollAllowed.k = deepExtend({}, isScrollAllowed.m);
        var MSPointer = getMSPointer();
        var events = {
            touchmove: 'ontouchmove' in window ? 'touchmove' :  MSPointer.move,
            touchstart: 'ontouchstart' in window ? 'touchstart' :  MSPointer.down
        };
        var scrollBarHandler;
        var isUnlicensesBannerAdded = false;

        // taken from https://github.com/udacity/ud891/blob/gh-pages/lesson2-focus/07-modals-and-keyboard-traps/solution/modal.js
        var focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

        //timeouts
        var resizeId;
        var afterSectionLoadsId;
        var afterSlideLoadsId;
        var scrollId;
        var scrollId2;
        var keydownId;
        var silentScrollId;
        var originals = deepExtend({}, options); //deep copy
        var activeAnimation;
        var activationKey = {};

        displayWarnings();

        //easeInOutCubic animation included in the plugin
        window.fp_easings = deepExtend(window.fp_easings, {
            easeInOutCubic: function (t, b, c, d) {
                if ((t/=d/2) < 1) return c/2*t*t*t + b;return c/2*((t-=2)*t*t + 2) + b;
            }
        });

        /**
        * Sets the autoScroll option.
        * It changes the scroll bar visibility and the history of the site as a result.
        */
        function setAutoScrolling(value, type){
            //removing the transformation
            if(!value){
                silentScroll(0);
            }

            setVariableState('autoScrolling', value, type);

            var element = $(SECTION_ACTIVE_SEL)[0];

            if(options.autoScrolling && !options.scrollBar){
                css($htmlBody, {
                    'overflow': 'hidden',
                    'height': '100%'
                });

                setRecordHistory(originals.recordHistory, 'internal');

                //for IE touch devices
                css(container, {
                    '-ms-touch-action': 'none',
                    'touch-action': 'none'
                });

                if(element != null){
                    //moving the container up
                    silentScroll(element.offsetTop);
                }
            }else{
                css($htmlBody, {
                    'overflow' : 'visible',
                    'height' : 'initial'
                });

                setRecordHistory(false, 'internal');

                //for IE touch devices
                css(container, {
                    '-ms-touch-action': '',
                    'touch-action': ''
                });

                //extensions only!
                removeAnimation(container);

                //scrolling the page to the section with no animation
                if (element != null) {
                    var scrollSettings = getScrollSettings(element.offsetTop);
                    scrollSettings.element.scrollTo(0, scrollSettings.options);
                }
            }

            trigger(container, 'setAutoScrolling', value);
        }

        /**
        * Defines wheter to record the history for each hash change in the URL.
        */
        function setRecordHistory(value, type){
            setVariableState('recordHistory', value, type);
        }

        /**
        * Defines the scrolling speed
        */
        function setScrollingSpeed(value, type){
            if(type !== 'internal' && options.fadingEffect && FP.fadingEffect ){
                FP.fadingEffect.update(value);
            }
            setVariableState('scrollingSpeed', value, type);
        }

        /**
        * Sets fitToSection
        */
        function setFitToSection(value, type){
            setVariableState('fitToSection', value, type);
        }

        /**
        * Sets lockAnchors
        */
        function setLockAnchors(value){
            options.lockAnchors = value;
        }

        /**
        * Adds or remove the possibility of scrolling through sections by using the mouse wheel or the trackpad.
        */
        function setMouseWheelScrolling(value){
            if(value){
                addMouseWheelHandler();
                addMiddleWheelHandler();
            }else{
                removeMouseWheelHandler();
                removeMiddleWheelHandler();
            }
        }

        /**
        * Adds or remove the possibility of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
        * Optionally a second parameter can be used to specify the direction for which the action will be applied.
        *
        * @param directions string containing the direction or directions separated by comma.
        */
        function setAllowScrolling(value, directions){
            if(typeof directions !== 'undefined'){
                directions = directions.replace(/ /g,'').split(',');

                directions.forEach(function (direction){
                    setIsScrollAllowed(value, direction, 'm');
                });
            }
            else{
                setIsScrollAllowed(value, 'all', 'm');
            }
            trigger(container, 'setAllowScrolling', {value: value, directions: directions});
        }

        /**
        * Adds or remove the mouse wheel hijacking
        */
        function setMouseHijack(value){
            if(value){
                setMouseWheelScrolling(true);

                //not sure what is this doing here alvaro!!
                //I'll comment it as it was causing a bug on dragAndMove when swiping for the 1st time
                //The page background was visible. We need preventBouncing for drag and move too!!
                //and drag And move already disables the default touch events on init turnOffTouch() function!
                //if(!usingExtension('dragAndMove') || options.dragAndMove === 'mouseonly'){
                    addTouchHandler();
                //}
            }else{
                setMouseWheelScrolling(false);
                removeTouchHandler();
            }
        }

        /**
        * Adds or remove the possibility of scrolling through sections by using the keyboard arrow keys
        */
        function setKeyboardScrolling(value, directions){
            if(typeof directions !== 'undefined'){
                directions = directions.replace(/ /g,'').split(',');

                directions.forEach(function(direction){
                    setIsScrollAllowed(value, direction, 'k');
                });
            }else{
                setIsScrollAllowed(value, 'all', 'k');
                options.keyboardScrolling = value;
            }
        }

        /**
        * Moves the page up one section.
        */
        function moveSectionUp(){
            var prev = prevUntil($(SECTION_ACTIVE_SEL)[0], SECTION_SEL);

            //looping to the bottom if there's no more sections above
            if (!prev && (options.loopTop || options.continuousVertical)) {
                prev = last($(SECTION_SEL));
            }

            if (prev != null) {
                scrollPage(prev, null, true);
            }
        }

        /**
        * Moves the page down one section.
        */
        function moveSectionDown(){
            var next = nextUntil($(SECTION_ACTIVE_SEL)[0], SECTION_SEL);

            //looping to the top if there's no more sections below
            if(!next &&
                (options.loopBottom || options.continuousVertical)){
                next = $(SECTION_SEL)[0];
            }

            if(next != null){
                scrollPage(next, null, false);
            }
        }

        /**
        * Moves the page to the given section and slide with no animation.
        * Anchors or index positions can be used as params.
        */
        function silentMoveTo(sectionAnchor, slideAnchor){
            setScrollingSpeed (0, 'internal');
            moveTo(sectionAnchor, slideAnchor);
            setScrollingSpeed (originals.scrollingSpeed, 'internal');
        }

        /**
        * Moves the page to the given section and slide.
        * Anchors or index positions can be used as params.
        */
        function moveTo(sectionAnchor, slideAnchor){
            var destiny = getSectionByAnchor(sectionAnchor);

            if (typeof slideAnchor !== 'undefined'){
                scrollPageAndSlide(sectionAnchor, slideAnchor);
            }else if(destiny != null){
                scrollPage(destiny);
            }
        }

        /**
        * Slides right the slider of the active section.
        * Optional `section` param.
        */
        function moveSlideRight(section){
            moveSlide('right', section);
        }

        /**
        * Slides left the slider of the active section.
        * Optional `section` param.
        */
        function moveSlideLeft(section){
            moveSlide('left', section);
        }

        /**
         * When resizing is finished, we adjust the slides sizes and positions
         */
        function reBuild(resizing){
            if(hasClass(container, DESTROYED)){ return; }  //nothing to do if the plugin was destroyed

            isResizing = true;

            windowsHeight = getWindowHeight();  //updating global var

            var sections = $(SECTION_SEL);
            for (var i = 0; i < sections.length; ++i) {
                var section = sections[i];
                var slidesWrap = $(SLIDES_WRAPPER_SEL, section)[0];
                var slides = $(SLIDE_SEL, section);

                //adjusting the height of the table-cell for IE and Firefox
                if(options.verticalCentered){
                    css($(TABLE_CELL_SEL, section), {'height': getTableHeight(section) + 'px'});
                }

                css(section, {'height': getWindowHeightOffset(section) + 'px'});

                //adjusting the position fo the FULL WIDTH slides...
                if (slides.length > 1) {
                    landscapeScroll(slidesWrap, $(SLIDE_ACTIVE_SEL, slidesWrap)[0]);
                }
            }

            if(options.scrollOverflow){
                scrollBarHandler.createScrollBarForAll();
            }

            var activeSection = $(SECTION_ACTIVE_SEL)[0];
            var sectionIndex = index(activeSection, SECTION_SEL);

            //isn't it the first section?
            if(sectionIndex && !usingExtension('fadingEffect')){
                //adjusting the position for the current section
                silentMoveTo(sectionIndex + 1);
            }

            isResizing = false;
            if(isFunction( options.afterResize ) && resizing){
                options.afterResize.call(container, window.innerWidth, window.innerHeight);
            }
            if(isFunction( options.afterReBuild ) && !resizing){
                options.afterReBuild.call(container);
            }
            trigger(container, 'afterRebuild');
        }

        /**
        * Turns fullPage.js to normal scrolling mode when the viewport `width` or `height`
        * are smaller than the set limit values.
        */
        function setResponsive(active){
            var isResponsive = hasClass($body, RESPONSIVE);

            if(active){
                if(!isResponsive){
                    setAutoScrolling(false, 'internal');
                    setFitToSection(false, 'internal');
                    hide($(SECTION_NAV_SEL));
                    addClass($body, RESPONSIVE);
                    if(isFunction( options.afterResponsive )){
                        options.afterResponsive.call( container, active);
                    }

                    if(options.responsiveSlides && FP.responsiveSlides){
                        FP.responsiveSlides.toSections();
                    }

                    trigger(container, 'afterResponsive', active);

                    //when on page load, we will remove scrolloverflow if necessary
                    if(options.scrollOverflow){
                        scrollBarHandler.createScrollBarForAll();
                    }
                }
            }
            else if(isResponsive){
                setAutoScrolling(originals.autoScrolling, 'internal');
                setFitToSection(originals.autoScrolling, 'internal');
                show($(SECTION_NAV_SEL));
                removeClass($body, RESPONSIVE);
                if(isFunction( options.afterResponsive )){
                    options.afterResponsive.call( container, active);
                }

                if(options.responsiveSlides && FP.responsiveSlides){
                    FP.responsiveSlides.toSlides();
                }

                trigger(container, 'afterResponsive', active);
            }
        }

        function getFullpageData(){
            return {
                options: options,
                internals: {
                    container: container,
                    canScroll: canScroll,
                    isScrollAllowed: isScrollAllowed,
                    getDestinationPosition: getDestinationPosition,
                    isTouch: isTouch,
                    c: checkActivationKey,
                    getXmovement: getXmovement,
                    removeAnimation: disableAnimation,
                    getTransforms: getTransforms,
                    lazyLoad: lazyLoad,
                    addAnimation: addAnimation,
                    performHorizontalMove: performHorizontalMove,
                    landscapeScroll: landscapeScroll,
                    silentLandscapeScroll: silentLandscapeScroll,
                    keepSlidesPosition: keepSlidesPosition,
                    silentScroll: silentScroll,
                    styleSlides: styleSlides,
                    scrollHandler: scrollHandler,
                    getEventsPage: getEventsPage,
                    getMSPointer:getMSPointer,
                    isReallyTouch: isReallyTouch,
                    usingExtension: usingExtension,
                    toggleControlArrows: toggleControlArrows,
                    touchStartHandler: touchStartHandler,
                    touchMoveHandler: touchMoveHandler
                }
            };
        }

        if(container){
            //public functions
            FP.version = '3.0.2';
            FP.setAutoScrolling = setAutoScrolling;
            FP.setRecordHistory = setRecordHistory;
            FP.setScrollingSpeed = setScrollingSpeed;
            FP.setFitToSection = setFitToSection;
            FP.setLockAnchors = setLockAnchors;
            FP.setMouseWheelScrolling = setMouseWheelScrolling;
            FP.setAllowScrolling = setAllowScrolling;
            FP.setKeyboardScrolling = setKeyboardScrolling;
            FP.moveSectionUp = moveSectionUp;
            FP.moveSectionDown = moveSectionDown;
            FP.silentMoveTo = silentMoveTo;
            FP.moveTo = moveTo;
            FP.moveSlideRight = moveSlideRight;
            FP.moveSlideLeft = moveSlideLeft;
            FP.fitToSection = fitToSection;
            FP.reBuild = reBuild;
            FP.setResponsive = setResponsive;
            FP.getFullpageData = getFullpageData;
            FP.destroy = destroy;
            FP.getActiveSection = getActiveSection;
            FP.getActiveSlide = getActiveSlide;
            FP.landscapeScroll = landscapeScroll;

            FP.test = {
                top: '0px',
                translate3d: 'translate3d(0px, 0px, 0px)',
                translate3dH: (function(){
                    var a = [];
                    for(var i = 0; i < $(options.sectionSelector, container).length; i++){
                        a.push('translate3d(0px, 0px, 0px)');
                    }
                    return a;
                })(),
                left: (function(){
                    var a = [];
                    for(var i = 0; i < $(options.sectionSelector, container).length; i++){
                        a.push(0);
                    }
                    return a;
                })(),
                options: options,
                setAutoScrolling: setAutoScrolling
            };

            //functions we want to share across files but which are not
            //mean to be used on their own by developers
            FP.shared ={
                afterRenderActions: afterRenderActions
            };

            window.fullpage_api = FP;

            //Loading extensions
            loadExtension('continuousHorizontal');
            loadExtension('scrollHorizontally');
            loadExtension('resetSliders');
            loadExtension('interlockedSlides');
            loadExtension('responsiveSlides');
            loadExtension('fadingEffect');
            loadExtension('dragAndMove');
            loadExtension('offsetSections');
            loadExtension('scrollOverflowReset');
            loadExtension('parallax');

            if(usingExtension('dragAndMove')){
                FP.dragAndMove.init();
            }

            init();

            bindEvents();

            if(usingExtension('dragAndMove')){
                FP.dragAndMove.turnOffTouch();
            }
        }

        function init(){
            //if css3 is not supported, it will use jQuery animations
            if(options.css3){
                options.css3 = support3d();
            }

            options.scrollBar = options.scrollBar || options.hybrid;

            setOptionsFromDOM();
            prepareDom();
            setAllowScrolling(true);
            setMouseHijack(true);
            setAutoScrolling(options.autoScrolling, 'internal');
            responsive();

            //setting the class for the body element
            setBodyClass();

            if(document.readyState === 'complete'){
                scrollToAnchor();
            }
            window.addEventListener('load', scrollToAnchor);
        }

        function bindEvents(){

            //when scrolling...
            window.addEventListener('scroll', scrollHandler);

            //detecting any change on the URL to scroll to the given anchor link
            //(a way to detect back history button as we play with the hashes on the URL)
            window.addEventListener('hashchange', hashChangeHandler);

            //when opening a new tab (ctrl + t), `control` won't be pressed when coming back.
            window.addEventListener('blur', blurHandler);

            //when resizing the site, we adjust the heights of the sections, slimScroll...
            window.addEventListener('resize', resizeHandler);

            //Sliding with arrow keys, both, vertical and horizontal
            document.addEventListener('keydown', keydownHandler);

            //to prevent scrolling while zooming
            document.addEventListener('keyup', keyUpHandler);

            //Scrolls to the section when clicking the navigation bullet
            //simulating the jQuery .on('click') event using delegation
            ['click', 'touchstart'].forEach(function(eventName){
                document.addEventListener(eventName, delegatedEvents);
            });

            /**
            * Applying normalScroll elements.
            * Ignoring the scrolls over the specified selectors.
            */
            if(options.normalScrollElements){
                ['mouseenter', 'touchstart'].forEach(function(eventName){
                    forMouseLeaveOrTOuch(eventName, false);
                });

                ['mouseleave', 'touchend'].forEach(function(eventName){
                   forMouseLeaveOrTOuch(eventName, true);
                });
            }
        }

        function delegatedEvents(e){
            var target = e.target;

            if(target && closest(target, SECTION_NAV_SEL + ' a')){
                sectionBulletHandler.call(target, e);
            }
            else if(matches(target, SECTION_NAV_TOOLTIP_SEL)){
                tooltipTextHandler.call(target);
            }
            else if(matches(target, SLIDES_ARROW_SEL)){
                slideArrowHandler.call(target, e);
            }
            else if(matches(target, SLIDES_NAV_LINK_SEL) || closest(target, SLIDES_NAV_LINK_SEL) != null){
                slideBulletHandler.call(target, e);
            }
        }

        function forMouseLeaveOrTOuch(eventName, allowScrolling){
            //a way to pass arguments to the onMouseEnterOrLeave function
            document['fp_' + eventName] = allowScrolling;
            document.addEventListener(eventName, onMouseEnterOrLeave, true); //capturing phase
        }

        function onMouseEnterOrLeave(e) {
            if(e.target == document){
                return;
            }
            var normalSelectors = options.normalScrollElements.split(',');
            normalSelectors.forEach(function(normalSelector){
                if(matches(e.target, normalSelector)){
                    setMouseHijack(document['fp_' + e.type]); //e.type = eventName
                }
            });
        }

        /**
        * Sets a public internal function based on the extension name.
        * @param externalName {String} Extension name with the form fp_[NAME]Extension referring to an external function.
        */
        function loadExtension(internalName){
            var externalName = 'fp_' + internalName + 'Extension';
            activationKey[internalName] = options[internalName + 'Key'];

            FP[internalName] = typeof window[externalName] !=='undefined' ? new window[externalName]() : null;
            FP[internalName] && FP[internalName].c(internalName);
        }

        /**
        * Setting options from DOM elements if they are not provided.
        */
        function setOptionsFromDOM(){

            //no anchors option? Checking for them in the DOM attributes
            if(!options.anchors.length){
                var attrName = '[data-anchor]';
                var anchors = $(options.sectionSelector.split(',').join(attrName + ',') + attrName, container);
                if(anchors.length){
                    anchors.forEach(function(item){
                        options.anchors.push(item.getAttribute('data-anchor').toString());
                    });
                }
            }

            //no tooltips option? Checking for them in the DOM attributes
            if(!options.navigationTooltips.length){
                var attrName = '[data-tooltip]';
                var tooltips = $(options.sectionSelector.split(',').join(attrName + ',') + attrName, container);
                if(tooltips.length){
                    tooltips.forEach(function(item){
                        options.navigationTooltips.push(item.getAttribute('data-tooltip').toString());
                    });
                }
            }
        }

        /**
        * Works over the DOM structure to set it up for the current fullpage options.
        */
        function prepareDom(){
            css(container, {
                'height': '100%',
                'position': 'relative'
            });

            //adding a class to recognize the container internally in the code
            addClass(container, WRAPPER);
            addClass($('html'), ENABLED);

            //due to https://github.com/alvarotrigo/fullPage.js/issues/1502
            windowsHeight = getWindowHeight();

            removeClass(container, DESTROYED); //in case it was destroyed before initializing it again

            addInternalSelectors();
            extensionCall('parallax', 'init');

            var sections = $(SECTION_SEL);

            //styling the sections / slides / menu
            for(var i = 0; i<sections.length; i++){
                var sectionIndex = i;
                var section = sections[i];
                var slides = $(SLIDE_SEL, section);
                var numSlides = slides.length;

                //caching the original styles to add them back on destroy('all')
                section.setAttribute('data-fp-styles', section.getAttribute('style'));

                styleSection(section, sectionIndex);
                styleMenu(section, sectionIndex);

                // if there's any slide
                if (numSlides > 0) {
                    styleSlides(section, slides, numSlides);
                }else{
                    if(options.verticalCentered){
                        addTableClass(section);
                    }
                }
            }

            //fixed elements need to be moved out of the plugin container due to problems with CSS3.
            if(options.fixedElements && options.css3){
                $(options.fixedElements).forEach(function(item){
                    $body.appendChild(item);
                });
            }

            //vertical centered of the navigation + active bullet
            if(options.navigation){
                addVerticalNavigation();
            }

            enableYoutubeAPI();

            if(options.fadingEffect && FP.fadingEffect){
                FP.fadingEffect.apply();
            }

            if(options.scrollOverflow){
                scrollBarHandler = options.scrollOverflowHandler.init(options);
            }else{
                afterRenderActions();
            }
        }

        /**
        * Styles the horizontal slides for a section.
        */
        function styleSlides(section, slides, numSlides){
            var sliderWidth = numSlides * 100;
            var slideWidth = 100 / numSlides;

            var slidesWrapper = document.createElement('div');
            slidesWrapper.className = SLIDES_WRAPPER; //fp-slides
            wrapAll(slides, slidesWrapper);

            var slidesContainer = document.createElement('div');
            slidesContainer.className = SLIDES_CONTAINER; //fp-slidesContainer
            wrapAll(slides, slidesContainer);

            css($(SLIDES_CONTAINER_SEL, section), {'width': sliderWidth + '%'});

            if(numSlides > 1){
                if(options.controlArrows){
                    createSlideArrows(section);
                }

                if(options.slidesNavigation){
                    addSlidesNavigation(section, numSlides);
                }
            }

            slides.forEach(function(slide) {
                css(slide, {'width': slideWidth + '%'});

                if(options.verticalCentered){
                    addTableClass(slide);
                }
            });

            var startingSlide = $(SLIDE_ACTIVE_SEL, section)[0];

            //if the slide won't be an starting point, the default will be the first one
            //the active section isn't the first one? Is not the first slide of the first section? Then we load that section/slide by default.
            if( startingSlide != null && (index($(SECTION_ACTIVE_SEL), SECTION_SEL) !== 0 || (index($(SECTION_ACTIVE_SEL), SECTION_SEL) === 0 && index(startingSlide) !== 0))){
                silentLandscapeScroll(startingSlide, 'internal');
                addClass(startingSlide, INITIAL);
            }else{
                addClass(slides[0], ACTIVE);
            }
        }

        function getWindowHeightOffset(element){
            return (options.offsetSections && FP.offsetSections) ?  Math.round(FP.offsetSections.getWindowHeight(element)) : getWindowHeight();
        }

        /**
        * Styling vertical sections
        */
        function styleSection(section, index){
            //if no active section is defined, the 1st one will be the default one
            if(!index && $(SECTION_ACTIVE_SEL)[0] == null) {
                addClass(section, ACTIVE);
            }
            startingSection = $(SECTION_ACTIVE_SEL)[0];

            css(section, {'height': getWindowHeightOffset(section) + 'px'});

            if(options.paddingTop){
                css(section, {'padding-top': options.paddingTop});
            }

            if(options.paddingBottom){
                css(section, {'padding-bottom': options.paddingBottom});
            }

            if (typeof options.sectionsColor[index] !==  'undefined') {
                css(section, {'background-color': options.sectionsColor[index]});
            }

            if (typeof options.anchors[index] !== 'undefined') {
                section.setAttribute('data-anchor', options.anchors[index]);
            }
        }

        /**
        * Sets the data-anchor attributes to the menu elements and activates the current one.
        */
        function styleMenu(section, index){
            if (typeof options.anchors[index] !== 'undefined') {
                //activating the menu / nav element on load
                if(hasClass(section, ACTIVE)){
                    activateMenuAndNav(options.anchors[index], index);
                }
            }

            //moving the menu outside the main container if it is inside (avoid problems with fixed positions when using CSS3 tranforms)
            if(options.menu && options.css3 && closest($(options.menu)[0], WRAPPER_SEL) != null){
                $body.appendChild($(options.menu)[0]);
            }
        }

        /**
        * Adds internal classes to be able to provide customizable selectors
        * keeping the link with the style sheet.
        */
        function addInternalSelectors(){
            addClass($(options.sectionSelector, container), SECTION);
            addClass($(options.slideSelector, container), SLIDE);
        }

        /**
        * Creates the control arrows for the given section
        */
        function createSlideArrows(section){
            var arrows = [createElementFromHTML('<div class="' + SLIDES_ARROW_PREV + '"></div>'), createElementFromHTML('<div class="' + SLIDES_ARROW_NEXT + '"></div>')];
            after($(SLIDES_WRAPPER_SEL, section)[0], arrows);

            if(options.controlArrowColor !== '#fff'){
                css($(SLIDES_ARROW_NEXT_SEL, section), {'border-color': 'transparent transparent transparent '+options.controlArrowColor});
                css($(SLIDES_ARROW_PREV_SEL, section), {'border-color': 'transparent '+ options.controlArrowColor + ' transparent transparent'});
            }

            if(!options.loopHorizontal){
                hide($(SLIDES_ARROW_PREV_SEL, section));
            }
        }

        /**
        * Creates a vertical navigation bar.
        */
        function addVerticalNavigation(){
            var navigation = document.createElement('div');
            navigation.setAttribute('id', SECTION_NAV);

            var divUl = document.createElement('ul');
            navigation.appendChild(divUl);

            appendTo(navigation, $body);
            var nav = $(SECTION_NAV_SEL)[0];

            addClass(nav, 'fp-' + options.navigationPosition);

            if(options.showActiveTooltip){
                addClass(nav, SHOW_ACTIVE_TOOLTIP);
            }

            var li = '';

            for (var i = 0; i < $(SECTION_SEL).length; i++) {
                var link = '';
                if (options.anchors.length) {
                    link = options.anchors[i];
                }

                li += '<li><a href="#' + link + '"><span class="fp-sr-only">' + getBulletLinkName(i, 'Section') + '</span><span></span></a>';

                // Only add tooltip if needed (defined by user)
                var tooltip = options.navigationTooltips[i];

                if (typeof tooltip !== 'undefined' && tooltip !== '') {
                    li += '<div class="' + SECTION_NAV_TOOLTIP + ' fp-' + options.navigationPosition + '">' + tooltip + '</div>';
                }

                li += '</li>';
            }
            $('ul', nav)[0].innerHTML = li;

            //centering it vertically
            css($(SECTION_NAV_SEL), {'margin-top': '-' + ($(SECTION_NAV_SEL)[0].offsetHeight/2) + 'px'});

            //activating the current active section

            var bullet = $('li', $(SECTION_NAV_SEL)[0])[index($(SECTION_ACTIVE_SEL)[0], SECTION_SEL)];
            addClass($('a', bullet), ACTIVE);
        }

        /**
        * Gets the name for screen readers for a section/slide navigation bullet.
        */
        function getBulletLinkName(i, defaultName){
            return options.navigationTooltips[i]
                || options.anchors[i]
                || defaultName + ' ' + (i+1)
        }

        /*
        * Enables the Youtube videos API so we can control their flow if necessary.
        */
        function enableYoutubeAPI(){
            $('iframe[src*="youtube.com/embed/"]', container).forEach(function(item){
                addURLParam(item, 'enablejsapi=1');
            });
        }

        /**
        * Adds a new parameter and its value to the `src` of a given element
        */
        function addURLParam(element, newParam){
            var originalSrc = element.getAttribute('src');
            element.setAttribute('src', originalSrc + getUrlParamSign(originalSrc) + newParam);
        }

        /*
        * Returns the prefix sign to use for a new parameter in an existen URL.
        *
        * @return {String}  ? | &
        */
        function getUrlParamSign(url){
            return ( !/\?/.test( url ) ) ? '?' : '&';
        }

        /**
        * Actions and callbacks to fire afterRender
        */
        function afterRenderActions(){
            var section = $(SECTION_ACTIVE_SEL)[0];

            addClass(section, COMPLETELY);

            lazyLoad(section);
            playMedia(section);

            if(options.scrollOverflow){
                options.scrollOverflowHandler.afterLoad();
            }

            if(isDestinyTheStartingSection() && isFunction(options.afterLoad) ){
                fireCallback('afterLoad', {
                    activeSection: null,
                    element: section,
                    direction: null,

                    //for backwards compatibility callback (to be removed in a future!)
                    anchorLink: section.getAttribute('data-anchor'),
                    sectionIndex: index(section, SECTION_SEL)
                });
            }

            if(isFunction(options.afterRender)){
                fireCallback('afterRender');
            }
            trigger(container, 'afterRender');
        }

        /**
        * Determines if the URL anchor destiny is the starting section (the one using 'active' class before initialization)
        */
        function isDestinyTheStartingSection(){
            var destinationSection = getSectionByAnchor(getAnchorsURL().section);
            return !destinationSection || typeof destinationSection !=='undefined' && index(destinationSection) === index(startingSection);
        }

        var isScrolling = false;
        //var lastScroll = 0; not being used now

        //when scrolling...
        function scrollHandler(){
            trigger(container, 'onScroll');
            var currentSection;

            if( (!options.autoScrolling || options.scrollBar || usingExtension('dragAndMove'))  && !isDragging()){
                var currentScroll = usingExtension('dragAndMove') ? Math.abs(FP.dragAndMove.getCurrentScroll()) : getScrollTop();
                //var scrollDirection = getScrollDirection(currentScroll);
                var visibleSectionIndex = 0;
                var screen_mid = currentScroll + (getWindowHeight() / 2.0);
                var documentHeight = usingExtension('dragAndMove') ? FP.dragAndMove.getDocumentHeight() : $body.offsetHeight - getWindowHeight();
                var isAtBottom =  documentHeight === currentScroll;
                var sections =  $(SECTION_SEL);

                //when using `auto-height` for a small last section it won't be centered in the viewport
                if(isAtBottom){
                    visibleSectionIndex = sections.length - 1;
                }
                //is at top? when using `auto-height` for a small first section it won't be centered in the viewport
                else if(!currentScroll){
                    visibleSectionIndex = 0;
                }

                //taking the section which is showing more content in the viewport
                else{
                    for (var i = 0; i < sections.length; ++i) {
                        var section = sections[i];

                        // Pick the the last section which passes the middle line of the screen.
                        if (section.offsetTop <= screen_mid)
                        {
                            visibleSectionIndex = i;
                        }
                    }
                }

                /*
                if(isCompletelyInViewPort(scrollDirection)){
                    if(!hasClass($(SECTION_ACTIVE_SEL)[0], COMPLETELY)){
                        addClass($(SECTION_ACTIVE_SEL)[0], COMPLETELY);
                        removeClass(siblings($(SECTION_ACTIVE_SEL)[0]), COMPLETELY);
                    }
                }
                */

                //geting the last one, the current one on the screen
                currentSection = sections[visibleSectionIndex];

                //setting the visible section as active when manually scrolling
                //executing only once the first time we reach the section
                if(!hasClass(currentSection, ACTIVE)){
                    isScrolling = true;
                    var leavingSection = $(SECTION_ACTIVE_SEL)[0];
                    var leavingSectionIndex = index(leavingSection, SECTION_SEL) + 1;
                    var yMovement = getYmovement(currentSection);
                    var anchorLink  = currentSection.getAttribute('data-anchor');
                    var sectionIndex = index(currentSection, SECTION_SEL) + 1;
                    var activeSlide = $(SLIDE_ACTIVE_SEL, currentSection)[0];
                    var slideIndex;
                    var slideAnchorLink;
                    var callbacksParams = {
                        activeSection: leavingSection,
                        sectionIndex: sectionIndex -1,
                        anchorLink: anchorLink,
                        element: currentSection,
                        leavingSection: leavingSectionIndex,
                        direction: yMovement
                    };

                    if(activeSlide){
                        slideAnchorLink = activeSlide.getAttribute('data-anchor');
                        slideIndex = index(activeSlide);
                    }

                    if(canScroll){
                        addClass(currentSection, ACTIVE);
                        removeClass(siblings(currentSection), ACTIVE);

                        extensionCall('parallax', 'afterLoad');

                        if(isFunction( options.onLeave )){
                            fireCallback('onLeave', callbacksParams);
                        }
                        if(isFunction( options.afterLoad )){
                            fireCallback('afterLoad', callbacksParams);
                        }

                        if(options.resetSliders && FP.resetSliders){
                            FP.resetSliders.apply({localIsResizing: isResizing, leavingSection: leavingSectionIndex});
                        }

                        stopMedia(leavingSection);
                        lazyLoad(currentSection);
                        playMedia(currentSection);

                        activateMenuAndNav(anchorLink, sectionIndex - 1);

                        if(options.anchors.length){
                            //needed to enter in hashChange event when using the menu with anchor links
                            lastScrolledDestiny = anchorLink;
                        }
                        setState(slideIndex, slideAnchorLink, anchorLink, sectionIndex);
                    }

                    //small timeout in order to avoid entering in hashChange event when scrolling is not finished yet
                    clearTimeout(scrollId);
                    scrollId = setTimeout(function(){
                        isScrolling = false;
                    }, 100);
                }

                if(options.fitToSection){
                    //for the auto adjust of the viewport to fit a whole section
                    clearTimeout(scrollId2);

                    scrollId2 = setTimeout(function(){
                        //checking it again in case it changed during the delay
                        if(options.fitToSection &&

                            //is the destination element bigger than the viewport?
                            $(SECTION_ACTIVE_SEL)[0].offsetHeight <= windowsHeight
                        ){
                            fitToSection();
                        }
                    }, options.fitToSectionDelay);
                }
            }
        }

        /**
        * Fits the site to the nearest active section
        */
        function fitToSection(){
            //checking fitToSection again in case it was set to false before the timeout delay
            if(canScroll){
                //allows to scroll to an active section and
                //if the section is already active, we prevent firing callbacks
                isResizing = true;

                scrollPage($(SECTION_ACTIVE_SEL)[0]);
                isResizing = false;
            }
        }

        /**
        * Determines whether the active section has seen in its whole or not.

        function isCompletelyInViewPort(movement){
            var top = $(SECTION_ACTIVE_SEL)[0].offsetTop;
            var bottom = top + getWindowHeight();

            if(movement == 'up'){
                return bottom >= (getScrollTop() + getWindowHeight());
            }
            return top <= getScrollTop();
        }
        */

        /**
        * Gets the directon of the the scrolling fired by the scroll event.

        function getScrollDirection(currentScroll){
            var direction = currentScroll > lastScroll ? 'down' : 'up';

            lastScroll = currentScroll;

            //needed for auto-height sections to determine if we want to scroll to the top or bottom of the destination
            previousDestTop = currentScroll;

            return direction;
        }
        */

        /**
        * Determines the way of scrolling up or down:
        * by 'automatically' scrolling a section or by using the default and normal scrolling.
        */
        function scrolling(type){
            if (!isScrollAllowed.m[type]){
                return;
            }
            var scrollSection = (type === 'down') ? moveSectionDown : moveSectionUp;

            if(FP.scrollHorizontally){
                scrollSection = FP.scrollHorizontally.getScrollSection(type, scrollSection);
            }

            if(options.scrollOverflow){
                var scrollable = options.scrollOverflowHandler.scrollable($(SECTION_ACTIVE_SEL)[0]);
                var check = (type === 'down') ? 'bottom' : 'top';

                if(scrollable != null ){
                    //is the scrollbar at the start/end of the scroll?
                    if(options.scrollOverflowHandler.isScrolled(check, scrollable)){
                        scrollSection();
                    }else{
                        return true;
                    }

                }else{
                    // moved up/down
                    scrollSection();
                }
            }else{
                // moved up/down
                scrollSection();
            }
        }

        /*
        * Preventing bouncing in iOS #2285
        */
        function preventBouncing(e){
            if(options.autoScrolling && isReallyTouch(e)){
                //preventing the easing on iOS devices
                preventDefault(e);
            }
        }

        var touchStartY = 0;
        var touchStartX = 0;
        var touchEndY = 0;
        var touchEndX = 0;

        /* Detecting touch events

        * As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
        * This way, the touchstart and the touch moves shows an small difference between them which is the
        * used one to determine the direction.
        */
        function touchMoveHandler(e){
            var activeSection = closest(e.target, SECTION_SEL);

            // additional: if one of the normalScrollElements isn't within options.normalScrollElementTouchThreshold hops up the DOM chain
            if (isReallyTouch(e) ) {

                if(options.autoScrolling){
                    //preventing the easing on iOS devices
                    preventDefault(e);
                }

                var touchEvents = getEventsPage(e);

                touchEndY = touchEvents.y;
                touchEndX = touchEvents.x;

                //if movement in the X axys is greater than in the Y and the currect section has slides...
                if ($(SLIDES_WRAPPER_SEL, activeSection).length && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))) {

                    //is the movement greater than the minimum resistance to scroll?
                    if (!slideMoving && Math.abs(touchStartX - touchEndX) > (window.innerWidth / 100 * options.touchSensitivity)) {
                        if (touchStartX > touchEndX) {
                            if(isScrollAllowed.m.right){
                                moveSlideRight(activeSection); //next
                            }
                        } else {
                            if(isScrollAllowed.m.left){
                                moveSlideLeft(activeSection); //prev
                            }
                        }
                    }
                }

                //vertical scrolling (only when autoScrolling is enabled)
                else if(options.autoScrolling && canScroll){

                    //is the movement greater than the minimum resistance to scroll?
                    if (Math.abs(touchStartY - touchEndY) > (window.innerHeight / 100 * options.touchSensitivity)) {
                        if (touchStartY > touchEndY) {
                            scrolling('down');
                        } else if (touchEndY > touchStartY) {
                            scrolling('up');
                        }
                    }
                }
            }
        }

        /**
        * As IE >= 10 fires both touch and mouse events when using a mouse in a touchscreen
        * this way we make sure that is really a touch event what IE is detecting.
        */
        function isReallyTouch(e){
            //if is not IE   ||  IE is detecting `touch` or `pen`
            return typeof e.pointerType === 'undefined' || e.pointerType != 'mouse';
        }

        /**
        * Handler for the touch start event.
        */
        function touchStartHandler(e){

            //stopping the auto scroll to adjust to a section
            if(options.fitToSection){
                activeAnimation = false;
            }

            if(isReallyTouch(e)){
                var touchEvents = getEventsPage(e);
                touchStartY = touchEvents.y;
                touchStartX = touchEvents.x;
            }
        }

        /**
        * Gets the average of the last `number` elements of the given array.
        */
        function getAverage(elements, number){
            var sum = 0;

            //taking `number` elements from the end to make the average, if there are not enought, 1
            var lastElements = elements.slice(Math.max(elements.length - number, 1));

            for(var i = 0; i < lastElements.length; i++){
                sum = sum + lastElements[i];
            }

            return Math.ceil(sum/number);
        }

        /**
         * Detecting mousewheel scrolling
         *
         * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
         * http://www.sitepoint.com/html5-javascript-mouse-wheel/
         */
        var prevTime = new Date().getTime();

        function MouseWheelHandler(e) {
            var curTime = new Date().getTime();
            var isNormalScroll = hasClass($(COMPLETELY_SEL)[0], NORMAL_SCROLL);

            //is scroll allowed?
            if (!isScrollAllowed.m.down && !isScrollAllowed.m.up) {
                preventDefault(e);
                return false;
            }

            //autoscrolling and not zooming?
            if(options.autoScrolling && !controlPressed && !isNormalScroll){
                // cross-browser wheel delta
                e = e || window.event;
                var value = e.wheelDelta || -e.deltaY || -e.detail;
                var delta = Math.max(-1, Math.min(1, value));

                var horizontalDetection = typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined';
                var isScrollingVertically = (Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta)) || (Math.abs(e.deltaX ) < Math.abs(e.deltaY) || !horizontalDetection);

                //Limiting the array to 150 (lets not waste memory!)
                if(scrollings.length > 149){
                    scrollings.shift();
                }

                //keeping record of the previous scrollings
                scrollings.push(Math.abs(value));

                //preventing to scroll the site on mouse wheel when scrollbar is present
                if(options.scrollBar){
                    preventDefault(e);
                }

                //time difference between the last scroll and the current one
                var timeDiff = curTime-prevTime;
                prevTime = curTime;

                //haven't they scrolled in a while?
                //(enough to be consider a different scrolling action to scroll another section)
                if(timeDiff > 200){
                    //emptying the array, we dont care about old scrollings for our averages
                    scrollings = [];
                }

                if(canScroll && !isAnimatingDragging()){
                    var averageEnd = getAverage(scrollings, 10);
                    var averageMiddle = getAverage(scrollings, 70);
                    var isAccelerating = averageEnd >= averageMiddle;

                    //to avoid double swipes...
                    if(isAccelerating && isScrollingVertically){
                        //scrolling down?
                        if (delta < 0) {
                            scrolling('down');

                        //scrolling up?
                        }else {
                            scrolling('up');
                        }
                    }
                }

                return false;
            }

            if(options.fitToSection){
                //stopping the auto scroll to adjust to a section
                activeAnimation = false;
            }
        }

        /**
        * Slides a slider to the given direction.
        * Optional `section` param.
        */
        function moveSlide(direction, section){
            var activeSection = section == null ? $(SECTION_ACTIVE_SEL)[0] : section;
            var slides = $(SLIDES_WRAPPER_SEL, activeSection)[0];

            // more than one slide needed and nothing should be sliding
            if (slides == null || isAnimatingDragging() || slideMoving || $(SLIDE_SEL, slides).length < 2) {
                return;
            }

            var currentSlide = $(SLIDE_ACTIVE_SEL, slides)[0];
            var destiny = null;

            if(direction === 'left'){
                destiny = prevUntil(currentSlide, SLIDE_SEL);
            }else{
                destiny = nextUntil(currentSlide, SLIDE_SEL);
            }

            //isn't there a next slide in the secuence?
            if(destiny == null){
                //respect loopHorizontal settin
                if (!options.loopHorizontal) return;

                var slideSiblings = siblings(currentSlide);
                if(direction === 'left'){
                    destiny = slideSiblings[slideSiblings.length - 1]; //last
                }else{
                    destiny = slideSiblings[0]; //first
                }
            }

            slideMoving = true && !FP.test.isTesting;
            landscapeScroll(slides, destiny, direction);
        }

        /**
        * Maintains the active slides in the viewport
        * (Because the `scroll` animation might get lost with some actions, such as when using continuousVertical)
        */
        function keepSlidesPosition(){
            var activeSlides = $(SLIDE_ACTIVE_SEL);
            for( var i =0; i<activeSlides.length; i++){
                silentLandscapeScroll(activeSlides[i], 'internal');
            }
        }

        var previousDestTop = 0;
        /**
        * Returns the destination Y position based on the scrolling direction and
        * the height of the section.
        */
        function getDestinationPosition(element){
            var elementHeight = element.offsetHeight;
            var elementTop = element.offsetTop;

            //top of the desination will be at the top of the viewport
            var position = elementTop;
            var isScrollingDown = usingExtension('dragAndMove') && FP.dragAndMove.isGrabbing ? FP.dragAndMove.isScrollingDown() : elementTop > previousDestTop;
            var sectionBottom = position - windowsHeight + elementHeight;
            var bigSectionsDestination = options.bigSectionsDestination;

            //is the destination element bigger than the viewport?
            if(elementHeight > windowsHeight){
                //scrolling up?
                if(!isScrollingDown && !bigSectionsDestination || bigSectionsDestination === 'bottom' ){
                    position = sectionBottom;
                }
            }

            //sections equal or smaller than the viewport height && scrolling down? ||  is resizing and its in the last section
            else if(isScrollingDown || (isResizing && next(element) == null) ){
                //The bottom of the destination will be at the bottom of the viewport
                position = sectionBottom;
            }

            if(options.offsetSections && FP.offsetSections){
                position = FP.offsetSections.getSectionPosition(isScrollingDown, position, element);
            }

            /*
            Keeping record of the last scrolled position to determine the scrolling direction.
            No conventional methods can be used as the scroll bar might not be present
            AND the section might not be active if it is auto-height and didnt reach the middle
            of the viewport.
            */
            previousDestTop = position;
            return position;
        }

        /**
        * Scrolls the site to the given element and scrolls to the slide if a callback is given.
        */
        function scrollPage(element, callback, isMovementUp){
            if(element == null){ return; } //there's no element to scroll, leaving the function

            var dtop = getDestinationPosition(element);
            var slideAnchorLink;
            var slideIndex;

            //local variables
            var v = {
                element: element,
                callback: callback,
                isMovementUp: isMovementUp,
                dtop: dtop,
                yMovement: getYmovement(element),
                anchorLink: element.getAttribute('data-anchor'),
                sectionIndex: index(element, SECTION_SEL),
                activeSlide: $(SLIDE_ACTIVE_SEL, element)[0],
                activeSection: $(SECTION_ACTIVE_SEL)[0],
                leavingSection: index($(SECTION_ACTIVE_SEL), SECTION_SEL) + 1,

                //caching the value of isResizing at the momment the function is called
                //because it will be checked later inside a setTimeout and the value might change
                localIsResizing: isResizing
            };

            //quiting when destination scroll is the same as the current one
            if((v.activeSection == element && !isResizing) || (options.scrollBar && getScrollTop() === v.dtop && !hasClass(element, AUTO_HEIGHT) )){ return; }

            if(v.activeSlide != null){
                slideAnchorLink = v.activeSlide.getAttribute('data-anchor');
                slideIndex = index(v.activeSlide);
            }

            //callback (onLeave) if the site is not just resizing and readjusting the slides
            if(isFunction(options.onLeave) && !v.localIsResizing){
                var direction = v.yMovement;

                //required for continousVertical
                if(typeof isMovementUp !== 'undefined'){
                    direction = isMovementUp ? 'up' : 'down';
                }

                //for the callback
                v.direction = direction;

                if(fireCallback('onLeave', v) === false){
                    return;
                }
            }

            extensionCall('parallax', 'apply', v);

            // If continuousVertical && we need to wrap around
            if (options.autoScrolling && options.continuousVertical && typeof (v.isMovementUp) !== "undefined" &&
                ((!v.isMovementUp && v.yMovement == 'up') || // Intending to scroll down but about to go up or
                (v.isMovementUp && v.yMovement == 'down'))) { // intending to scroll up but about to go down

                v = createInfiniteSections(v);
            }

            if(usingExtension('scrollOverflowReset')){
                FP.scrollOverflowReset.setPrevious(v.activeSection);
            }

            //pausing media of the leaving section (if we are not just resizing, as destinatino will be the same one)
            if(!v.localIsResizing){
                stopMedia(v.activeSection);
            }

            if(options.scrollOverflow){
                options.scrollOverflowHandler.beforeLeave();
            }

            addClass(element, ACTIVE);
            removeClass(siblings(element), ACTIVE);
            lazyLoad(element);

            if(options.scrollOverflow){
                options.scrollOverflowHandler.onLeave();
            }

            //preventing from activating the MouseWheelHandler event
            //more than once if the page is scrolling
            canScroll = false || FP.test.isTesting;

            setState(slideIndex, slideAnchorLink, v.anchorLink, v.sectionIndex);

            performMovement(v);

            //flag to avoid callingn `scrollPage()` twice in case of using anchor links
            lastScrolledDestiny = v.anchorLink;

            activateMenuAndNav(v.anchorLink, getBulletIndex(v));
        }

        /**
        /* When using continousVertical we won't get the right sectionIndex onLeave
        * because sections positions are temporally in other position in the DOM
        * This fixes https://github.com/alvarotrigo/fullPage.js/issues/2917
        */
        function getBulletIndex(v){
            //when using continousVertical the value of v.sectionIndex won't be the real one
            //therefore we have to adjust it here to activate properly the navigation bullets
            //when not using anchors
            if(v.wrapAroundElements != null){
                return v.isMovementUp ? $(SECTION_SEL).length -1 : 0;
            }

            //we can not change the value of v.sectionIndex at this point as it is used
            //by extensions such as parallax
            return v.sectionIndex;
        }

        /**
        * Dispatch events & callbacks making sure it does it on the right format, depending on
        * whether v2compatible is being used or not.
        */
        function fireCallback(eventName, v){
            var eventData = getEventData(eventName, v);

            if(!options.v2compatible){
                trigger(container, eventName, eventData);

                if(options[eventName].apply(eventData[Object.keys(eventData)[0]], toArray(eventData)) === false){
                    return false;
                }
            }
            else{
                if(options[eventName].apply(eventData[0], eventData.slice(1)) === false){
                    return false;
                }
            }

            return true;
        }

        /**
        * Makes sure to only create a Panel object if the element exist
        */
        function nullOrSection(el){
            return el ? new Section(el) : null;
        }

        function nullOrSlide(el){
            return el ? new Slide(el) : null;
        }

        /**
        * Gets the event's data for the given event on the right format. Depending on whether
        * v2compatible is being used or not.
        */
        function getEventData(eventName, v){
            var paramsPerEvent;

            if(!options.v2compatible){

                //using functions to run only the necessary bits within the object
                paramsPerEvent = {
                    afterRender: function(){
                        return {
                            section: nullOrSection($(SECTION_ACTIVE_SEL)[0]),
                            slide: nullOrSlide($(SLIDE_ACTIVE_SEL, $(SECTION_ACTIVE_SEL)[0])[0])
                        };
                    },
                    onLeave: function(){
                        return {
                            origin: nullOrSection(v.activeSection),
                            destination: nullOrSection(v.element),
                            direction: v.direction
                        };
                    },

                    afterLoad: function(){
                        return paramsPerEvent.onLeave();
                    },

                    afterSlideLoad: function(){
                        return {
                            section: nullOrSection(v.section),
                            origin: nullOrSlide(v.prevSlide),
                            destination: nullOrSlide(v.destiny),
                            direction: v.direction
                        };
                    },

                    onSlideLeave: function(){
                        return paramsPerEvent.afterSlideLoad();
                    }
                };
            }
            else{
                paramsPerEvent = {
                    afterRender: function(){ return [container]; },
                    onLeave: function(){ return [v.activeSection, v.leavingSection, (v.sectionIndex + 1), v.direction]; },
                    afterLoad: function(){ return [v.element, v.anchorLink, (v.sectionIndex + 1)]; },
                    afterSlideLoad: function(){ return [v.destiny, v.anchorLink, (v.sectionIndex + 1), v.slideAnchor, v.slideIndex]; },
                    onSlideLeave: function(){ return [v.prevSlide, v.anchorLink, (v.sectionIndex + 1), v.prevSlideIndex, v.direction, v.slideIndex]; },
                };
            }

            return paramsPerEvent[eventName]();
        }

        /**
        * Performs the vertical movement (by CSS3 or by jQuery)
        */
        function performMovement(v){
            // using CSS3 translate functionality
            if (options.css3 && options.autoScrolling && !options.scrollBar) {

                // The first section can have a negative value in iOS 10. Not quite sure why: -0.0142822265625
                // that's why we round it to 0.
                var translate3d = 'translate3d(0px, -' + Math.round(v.dtop) + 'px, 0px)';
                transformContainer(translate3d, true);

                //even when the scrollingSpeed is 0 there's a little delay, which might cause the
                //scrollingSpeed to change in case of using silentMoveTo();
                if(options.scrollingSpeed){
                    clearTimeout(afterSectionLoadsId);
                    afterSectionLoadsId = setTimeout(function () {
                        afterSectionLoads(v);
                    }, options.scrollingSpeed);
                }else{
                    afterSectionLoads(v);
                }
            }

            // using JS to animate
            else{
                var scrollSettings = getScrollSettings(v.dtop);
                FP.test.top = -v.dtop + 'px';

                scrollTo(scrollSettings.element, scrollSettings.options, options.scrollingSpeed, function(){
                    if(options.scrollBar){

                        /* Hack!
                        The timeout prevents setting the most dominant section in the viewport as "active" when the user
                        scrolled to a smaller section by using the mousewheel (auto scrolling) rather than draging the scroll bar.

                        When using scrollBar:true It seems like the scroll events still getting propagated even after the scrolling animation has finished.
                        */
                        setTimeout(function(){
                            afterSectionLoads(v);
                        },30);
                    }else{
                        afterSectionLoads(v);
                    }
                });
            }
        }

        /**
        * Gets the scrolling settings depending on the plugin autoScrolling option
        */
        function getScrollSettings(top){
            var scroll = {};

            //top property animation
            if(options.autoScrolling && !options.scrollBar){
                scroll.options = -top;
                scroll.element = $(WRAPPER_SEL)[0];
            }

            //window real scrolling
            else{
                scroll.options = top;
                scroll.element = window;
            }

            return scroll;
        }

        /**
        * Adds sections before or after the current one to create the infinite effect.
        */
        function createInfiniteSections(v){
            // Scrolling down
            if (!v.isMovementUp) {
                // Move all previous sections to after the active section
                after($(SECTION_ACTIVE_SEL)[0], prevAll(v.activeSection, SECTION_SEL).reverse());
            }
            else { // Scrolling up
                // Move all next sections to before the active section
                before($(SECTION_ACTIVE_SEL)[0], nextAll(v.activeSection, SECTION_SEL));
            }

            // Maintain the displayed position (now that we changed the element order)
            silentScroll($(SECTION_ACTIVE_SEL)[0].offsetTop);

            // Maintain the active slides visible in the viewport
            keepSlidesPosition();

            // save for later the elements that still need to be reordered
            v.wrapAroundElements = v.activeSection;

            // Recalculate animation variables
            v.dtop = v.element.offsetTop;
            v.yMovement = getYmovement(v.element);

            //sections will temporally have another position in the DOM
            //updating this values in case we need them, such as in parallax extension
            v.leavingSection = index(v.activeSection, SECTION_SEL) + 1;
            v.sectionIndex = index(v.element, SECTION_SEL);

            trigger($(WRAPPER_SEL)[0], 'onContinuousVertical', v);

            return v;
        }

        /**
        * Fix section order after continuousVertical changes have been animated
        */
        function continuousVerticalFixSectionOrder (v) {
            // If continuousVertical is in effect (and autoScrolling would also be in effect then),
            // finish moving the elements around so the direct navigation will function more simply
            if (v.wrapAroundElements == null) {
                return;
            }

            if (v.isMovementUp) {
                before($(SECTION_SEL)[0], v.wrapAroundElements);
            }
            else {
                after($(SECTION_SEL)[$(SECTION_SEL).length-1], v.wrapAroundElements);
            }

            silentScroll($(SECTION_ACTIVE_SEL)[0].offsetTop);

            // Maintain the active slides visible in the viewport
            keepSlidesPosition();

            //recalculating the sections data after the changes
            v.sectionIndex = index(v.element, SECTION_SEL);
            v.leavingSection = index(v.activeSection, SECTION_SEL) + 1;
        }


        /**
        * Actions to do once the section is loaded.
        */
        function afterSectionLoads (v){
            continuousVerticalFixSectionOrder(v);

            //callback (afterLoad) if the site is not just resizing and readjusting the slides
            if(isFunction(options.afterLoad) && !v.localIsResizing){
                fireCallback('afterLoad', v);
            }
            if(options.scrollOverflow){
                options.scrollOverflowHandler.afterLoad();
            }

            extensionCall('parallax', 'afterLoad');

            if(usingExtension('scrollOverflowReset')){
                FP.scrollOverflowReset.reset();
            }

            if(usingExtension('resetSliders')){
                FP.resetSliders.apply(v);
            }

            if(!v.localIsResizing){
                playMedia(v.element);
            }

            addClass(v.element, COMPLETELY);
            removeClass(siblings(v.element), COMPLETELY);

            canScroll = true;

            if(isFunction(v.callback)){
                v.callback();
            }
        }

        /**
        * Sets the value for the given attribute from the `data-` attribute with the same suffix
        * ie: data-srcset ==> srcset  |  data-src ==> src
        */
        function setSrc(element, attribute){
            element.setAttribute(attribute, element.getAttribute('data-' + attribute));
            element.removeAttribute('data-' + attribute);
        }

        /**
        * Lazy loads image, video and audio elements.
        */
        function lazyLoad(destiny){
            if (!options.lazyLoading){
                return;
            }

            var panel = getSlideOrSection(destiny);

            $('img[data-src], img[data-srcset], source[data-src], source[data-srcset], video[data-src], audio[data-src], iframe[data-src]', panel).forEach(function(element){
                ['src', 'srcset'].forEach(function(type){
                    var attribute = element.getAttribute('data-' + type);
                    if(attribute != null && attribute){
                        setSrc(element, type);
                    }
                });

                if(matches(element, 'source')){
                    var elementToPlay =  closest(element, 'video, audio');
                    if(elementToPlay){
                        elementToPlay.load();
                    }
                }
            });
        }

        /**
        * Plays video and audio elements.
        */
        function playMedia(destiny){
            var panel = getSlideOrSection(destiny);

            //playing HTML5 media elements
            $('video, audio', panel).forEach(function(element){
                if( element.hasAttribute('data-autoplay') && typeof element.play === 'function' ) {
                    element.play();
                }
            });

            //youtube videos
            $('iframe[src*="youtube.com/embed/"]', panel).forEach(function(element){
                if ( element.hasAttribute('data-autoplay') ){
                    playYoutube(element);
                }

                //in case the URL was not loaded yet. On page load we need time for the new URL (with the API string) to load.
                element.onload = function() {
                    if ( element.hasAttribute('data-autoplay') ){
                        playYoutube(element);
                    }
                };
            });
        }

        /**
        * Plays a youtube video
        */
        function playYoutube(element){
            element.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }

        /**
        * Stops video and audio elements.
        */
        function stopMedia(destiny){
            var panel = getSlideOrSection(destiny);

            //stopping HTML5 media elements
            $('video, audio', panel).forEach(function(element){
                if( !element.hasAttribute('data-keepplaying') && typeof element.pause === 'function' ) {
                    element.pause();
                }
            });

            //youtube videos
            $('iframe[src*="youtube.com/embed/"]', panel).forEach(function(element){
                if( /youtube\.com\/embed\//.test(element.getAttribute('src')) && !element.hasAttribute('data-keepplaying')){
                    element.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}','*');
                }
            });
        }

        /**
        * Gets the active slide (or section) for the given section
        */
        function getSlideOrSection(destiny){
            var slide = $(SLIDE_ACTIVE_SEL, destiny);
            if( slide.length ) {
                destiny = slide[0];
            }

            return destiny;
        }

        // Create Base64 Object
        function decode(value){
            var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            function decode(e) {
                var t = "";
                var n, r, i;
                var s, o, u, a;
                var f = 0;
                e = e.replace(/[^A-Za-z0-9+/=]/g, "");
                while (f < e.length) {
                    s = _keyStr.indexOf(e.charAt(f++));
                    o = _keyStr.indexOf(e.charAt(f++));
                    u = _keyStr.indexOf(e.charAt(f++));
                    a = _keyStr.indexOf(e.charAt(f++));
                    n = s << 2 | o >> 4;
                    r = (o & 15) << 4 | u >> 2;
                    i = (u & 3) << 6 | a;
                    t = t + String.fromCharCode(n);
                    if (u != 64) {
                        t = t + String.fromCharCode(r);
                    }
                    if (a != 64) {
                        t = t + String.fromCharCode(i);
                    }
                }
                t = _utf8_decode(t);
                return t;
            }

            function _utf8_decode(e) {
                var t = "";
                var n = 0;
                var r = 0;
                var c1 = 0;
                var c2 = 0;
                var c3;
                while (n < e.length) {
                    r = e.charCodeAt(n);
                    if (r < 128) {
                        t += String.fromCharCode(r);
                        n++;
                    } else if (r > 191 && r < 224) {
                        c2 = e.charCodeAt(n + 1);
                        t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                        n += 2;
                    } else {
                        c2 = e.charCodeAt(n + 1);
                        c3 = e.charCodeAt(n + 2);
                        t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                        n += 3;
                    }
                }
                return t;
            }

            function nada(a){
                return a;
            }

            function removeAddedChars(text){
                return text.slice(3).slice(0,-3);
            }

            function removeCrap(value){
                var extensionType = value.split('_');

                if(extensionType.length > 1){
                    var withoutDomain = extensionType[1];
                    var domainWithAddedChars = value.replace(removeAddedChars(extensionType[1]), '').split('_')[0];
                    var domainWithoutAddedChars = domainWithAddedChars;
                    return domainWithoutAddedChars + '_' + decode(withoutDomain.slice(3).slice(0,-3));
                }

                return removeAddedChars(value);
            }

            return nada(removeCrap(decode(value)));
        }

        //Gets the domain name from a URL without www
        //http://stackoverflow.com/a/13367604/1081396
        function getDomain(){
            if(document.domain.length){
                var parts = document.domain.replace(/^(www\.)/,"").split('.');

                //is there a subdomain?
                while(parts.length > 2){
                    var subdomain = parts.shift();
                }
                var domain = parts.join('.');

                return domain.replace(/(^\.*)|(\.*$)/g, "");
            }
            return '';
        }

        function isValidActivationKey(extensionName){
            var domainName = getDomain();
            var _0x86bb = ['MTM0bG9jYWxob3N0MjM0','MTM0MC4xMjM0', 'MTM0anNoZWxsLm5ldDIzNA==', 'UDdDQU5ZNlNN'];
            var localhost = decode(_0x86bb[0]);
            var localIp = decode(_0x86bb[1]);
            var jsfiddle = decode(_0x86bb[2]);
            var unlimited = decode(_0x86bb[3]);
            var isNotTest = [localhost, localIp, jsfiddle].indexOf(domainName) < 0 && domainName.length !== 0;
            var isKeyDefined = (typeof activationKey[extensionName] !== 'undefined' && activationKey[extensionName].length);

            if( !isKeyDefined && isNotTest){ return false; }

            var decoded = isKeyDefined ? decode(activationKey[extensionName]) : '';

            // [0] = domain   [1] = extensionName
            decoded = decoded.split('_');

            var extensionMatches = decoded.length > 1 && decoded[1].indexOf(extensionName, decoded[1].length -  extensionName.length) > -1;
            var domainDoesntMatch = decoded[0].indexOf(domainName, decoded[0].length - domainName.length) < 0;

            return !(domainDoesntMatch && isNotTest && unlimited!=decoded[0]) && extensionMatches || !isNotTest;
        }

        var bannerContent;
        var objectElement;
        var destroyedId;

        function onBannerChange(mutations){
            mutations.forEach(function(mutation) {
                if(mutation.removedNodes[0] && mutation.removedNodes[0].isEqualNode(objectElement)){
                    //in case they try to destory it... this will get fired with removed form the DOM
                    clearTimeout(destroyedId);
                    destroyedId = setTimeout(destroyed, 900);
                }
            });
        }

        function destroyed(){
            isUnlicensesBannerAdded = false;
        }

        function checkActivationKey(extensionName){
            objectElement = document.createElement('div');
            bannerContent = decode('MTIzPGRpdj48YSBocmVmPSJodHRwOi8vYWx2YXJvdHJpZ28uY29tL2Z1bGxQYWdlL2V4dGVuc2lvbnMvIiBzdHlsZT0iY29sb3I6ICNmZmYgIWltcG9ydGFudDsgdGV4dC1kZWNvcmF0aW9uOm5vbmUgIWltcG9ydGFudDsiPlVubGljZW5zZWQgZnVsbFBhZ2UuanMgRXh0ZW5zaW9uPC9hPjwvZGl2PjEyMw==');
            objectElement.innerHTML = bannerContent;
            objectElement = objectElement.firstChild;

            if ("MutationObserver" in window) {
                var observer = new MutationObserver(onBannerChange);
                observer.observe(document.body, {
                    childList:true,
                    subtree:false
                });
            }

            //do nothing if not active or present
            if(!usingExtension(extensionName) || !FP[extensionName]){
                return;
            }

            if(!isValidActivationKey(extensionName)){
                addWarning();
                //https://jsfiddle.net/youxkay0/
                //<div style="z-index:9999999;position:fixed; top: 20px; left:20px; background:red; padding: 7px 15px; font-size: 14px; font-family: arial; color: #fff; display: inline-block;"><a href="http://alvarotrigo.com/fullPage/extensions/" style="color: #fff; text-decoration:none;">xxx</a></div>
                setInterval(addWarning, 2*1000);
            }
        }

        function addWarning(){
            if(!objectElement){return;}

            if(!isUnlicensesBannerAdded){
                if(Math.random() < 0.5){
                    prependTo($body, objectElement);
                }else{
                    appendTo(objectElement, $body);
                }

                isUnlicensesBannerAdded = true;
            }

            objectElement.setAttribute('style', decode('MTIzei1pbmRleDo5OTk5OTk5O3Bvc2l0aW9uOmZpeGVkO3RvcDoyMHB4O2JvdHRvbTphdXRvO2xlZnQ6MjBweDtyaWdodDphdXRvO2JhY2tncm91bmQ6cmVkO3BhZGRpbmc6N3B4IDE1cHg7Zm9udC1zaXplOjE0cHg7Zm9udC1mYW1pbHk6YXJpYWw7Y29sb3I6I2ZmZjtkaXNwbGF5OmlubGluZS1ibG9jazt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoMCwwLDApO29wYWNpdHk6MTtoZWlnaHQ6YXV0bzt3aWR0aDphdXRvO3pvb206MTttYXJnaW46YXV0bztib3JkZXI6bm9uZTt2aXNpYmlsaXR5OnZpc2libGU7Y2xpcC1wYXRoOm5vbmU7MTIz').replace(/;/g, decode('MTIzICFpbXBvcnRhbnQ7MzQ1')));

        }

        /**
        * Scrolls to the anchor in the URL when loading the site
        */
        function scrollToAnchor(){
            var anchors =  getAnchorsURL();
            var sectionAnchor = anchors.section;
            var slideAnchor = anchors.slide;

            if(sectionAnchor){  //if theres any #
                if(options.animateAnchor){
                    scrollPageAndSlide(sectionAnchor, slideAnchor);
                }else{
                    silentMoveTo(sectionAnchor, slideAnchor);
                }
            }
        }

        /**
        * Detecting any change on the URL to scroll to the given anchor link
        * (a way to detect back history button as we play with the hashes on the URL)
        */
        function hashChangeHandler(){
            if(!isScrolling && !options.lockAnchors){
                var anchors = getAnchorsURL();
                var sectionAnchor = anchors.section;
                var slideAnchor = anchors.slide;

                //when moving to a slide in the first section for the first time (first time to add an anchor to the URL)
                var isFirstSlideMove =  (typeof lastScrolledDestiny === 'undefined');
                var isFirstScrollMove = (typeof lastScrolledDestiny === 'undefined' && typeof slideAnchor === 'undefined' && !slideMoving);

                if(sectionAnchor && sectionAnchor.length){
                    /*in order to call scrollpage() only once for each destination at a time
                    It is called twice for each scroll otherwise, as in case of using anchorlinks `hashChange`
                    event is fired on every scroll too.*/
                    if ((sectionAnchor && sectionAnchor !== lastScrolledDestiny) && !isFirstSlideMove
                        || isFirstScrollMove
                        || (!slideMoving && lastScrolledSlide != slideAnchor )){

                        scrollPageAndSlide(sectionAnchor, slideAnchor);
                    }
                }
            }
        }

        //gets the URL anchors (section and slide)
        function getAnchorsURL(){
            var section;
            var slide;
            var hash = window.location.hash;

            if(hash.length){
                //getting the anchor link in the URL and deleting the `#`
                var anchorsParts =  hash.replace('#', '').split('/');

                //using / for visual reasons and not as a section/slide separator #2803
                var isFunkyAnchor = hash.indexOf('#/') > -1;

                section = isFunkyAnchor ? '/' + anchorsParts[1] : decodeURIComponent(anchorsParts[0]);

                var slideAnchor = isFunkyAnchor ? anchorsParts[2] : anchorsParts[1];
                if(slideAnchor && slideAnchor.length){
                    slide = decodeURIComponent(slideAnchor);
                }
            }

            return {
                section: section,
                slide: slide
            };
        }

        //Sliding with arrow keys, both, vertical and horizontal
        function keydownHandler(e) {
            clearTimeout(keydownId);

            var activeElement = document.activeElement;
            var keyCode = e.keyCode;

            //tab?
            if(keyCode === 9){
                onTab(e);
            }

            else if(!matches(activeElement, 'textarea') && !matches(activeElement, 'input') && !matches(activeElement, 'select') &&
                activeElement.getAttribute('contentEditable') !== "true" && activeElement.getAttribute('contentEditable') !== '' &&
                options.keyboardScrolling && options.autoScrolling){

                //preventing the scroll with arrow keys & spacebar & Page Up & Down keys
                var keyControls = [40, 38, 32, 33, 34];
                if(keyControls.indexOf(keyCode) > -1){
                    preventDefault(e);
                }

                controlPressed = e.ctrlKey;

                keydownId = setTimeout(function(){
                    onkeydown(e);
                },150);
            }
        }

        function tooltipTextHandler(){
            /*jshint validthis:true */
            trigger(prev(this), 'click');
        }

        //to prevent scrolling while zooming
        function keyUpHandler(e){
            if(isWindowFocused){ //the keyup gets fired on new tab ctrl + t in Firefox
                controlPressed = e.ctrlKey;
            }
        }

        //binding the mousemove when the mouse's middle button is released
        function mouseDownHandler(e){
            //middle button
            if (e.which == 2){
                oldPageY = e.pageY;
                container.addEventListener('mousemove', mouseMoveHandler);
            }
        }

        //unbinding the mousemove when the mouse's middle button is released
        function mouseUpHandler(e){
            //middle button
            if (e.which == 2){
                container.removeEventListener('mousemove', mouseMoveHandler);
            }
        }

        /**
        * Makes sure the tab key will only focus elements within the current section/slide
        * preventing this way from breaking the page.
        * Based on "Modals and keyboard traps"
        * from https://developers.google.com/web/fundamentals/accessibility/focus/using-tabindex
        */
        function onTab(e){
            var isShiftPressed = e.shiftKey;
            var activeElement = document.activeElement;
            var focusableElements = getFocusables(getSlideOrSection($(SECTION_ACTIVE_SEL)[0]));

            function preventAndFocusFirst(e){
                preventDefault(e);
                return focusableElements[0] ? focusableElements[0].focus() : null;
            }

            //outside any section or slide? Let's not hijack the tab!
            if(isFocusOutside(e)){
                return;
            }

            //is there an element with focus?
            if(activeElement){
                if(closest(activeElement, SECTION_ACTIVE_SEL + ',' + SECTION_ACTIVE_SEL + ' ' + SLIDE_ACTIVE_SEL) == null){
                    activeElement = preventAndFocusFirst(e);
                }
            }

            //no element if focused? Let's focus the first one of the section/slide
            else{
                preventAndFocusFirst(e);
            }

            //when reached the first or last focusable element of the section/slide
            //we prevent the tab action to keep it in the last focusable element
            if(!isShiftPressed && activeElement == focusableElements[focusableElements.length - 1] ||
                isShiftPressed && activeElement == focusableElements[0]
            ){
                preventDefault(e);
            }
        }

        /**
        * Gets all the focusable elements inside the passed element.
        */
        function getFocusables(el){
            return [].slice.call($(focusableElementsString, el)).filter(function(item) {
                    return item.getAttribute('tabindex') !== '-1'
                    //are also not hidden elements (or with hidden parents)
                    && item.offsetParent !== null;
            });
        }

        /**
        * Determines whether the focus is outside fullpage.js sections/slides or not.
        */
        function isFocusOutside(e){
            var allFocusables = getFocusables(document);
            var currentFocusIndex = allFocusables.indexOf(document.activeElement);
            var focusDestinationIndex = e.shiftKey ? currentFocusIndex - 1 : currentFocusIndex + 1;
            var focusDestination = allFocusables[focusDestinationIndex];
            var destinationItemSlide = nullOrSlide(closest(focusDestination, SLIDE_SEL));
            var destinationItemSection = nullOrSection(closest(focusDestination, SECTION_SEL));

            return !destinationItemSlide && !destinationItemSection;
        }

        //Scrolling horizontally when clicking on the slider controls.
        function slideArrowHandler(){
            /*jshint validthis:true */
            var section = closest(this, SECTION_SEL);

            /*jshint validthis:true */
            if (hasClass(this, SLIDES_PREV)) {
                if(isScrollAllowed.m.left){
                    moveSlideLeft(section);
                }
            } else {
                if(isScrollAllowed.m.right){
                    moveSlideRight(section);
                }
            }
        }

        //when opening a new tab (ctrl + t), `control` won't be pressed when coming back.
        function blurHandler(){
            isWindowFocused = false;
            controlPressed = false;
        }

        //Scrolls to the section when clicking the navigation bullet
        function sectionBulletHandler(e){
            preventDefault(e);

            /*jshint validthis:true */
            var indexBullet = index(closest(this, SECTION_NAV_SEL + ' li'));
            scrollPage($(SECTION_SEL)[indexBullet]);
        }

        //Scrolls the slider to the given slide destination for the given section
        function slideBulletHandler(e){
            preventDefault(e);

            /*jshint validthis:true */
            var slides = $(SLIDES_WRAPPER_SEL, closest(this, SECTION_SEL))[0];
            var destiny = $(SLIDE_SEL, slides)[index(closest(this, 'li'))];

            landscapeScroll(slides, destiny);
        }

        /**
        * Keydown event
        */
        function onkeydown(e){
            var shiftPressed = e.shiftKey;

            //do nothing if we can not scroll or we are not using horizotnal key arrows.
            if(!canScroll && [37,39].indexOf(e.keyCode) < 0){
                return;
            }

            switch (e.keyCode) {
                //up
                case 38:
                case 33:
                    if(isScrollAllowed.k.up){
                        moveSectionUp();
                    }
                    break;

                //down
                case 32: //spacebar
                    if(shiftPressed && isScrollAllowed.k.up){
                        moveSectionUp();
                        break;
                    }
                /* falls through */
                case 40:
                case 34:
                    if(isScrollAllowed.k.down){
                        moveSectionDown();
                    }
                    break;

                //Home
                case 36:
                    if(isScrollAllowed.k.up){
                        moveTo(1);
                    }
                    break;

                //End
                case 35:
                     if(isScrollAllowed.k.down){
                        moveTo( $(SECTION_SEL).length );
                    }
                    break;

                //left
                case 37:
                    if(isScrollAllowed.k.left){
                        moveSlideLeft();
                    }
                    break;

                //right
                case 39:
                    if(isScrollAllowed.k.right){
                        moveSlideRight();
                    }
                    break;

                default:
                    return; // exit this handler for other keys
            }
        }

        /**
        * Detecting the direction of the mouse movement.
        * Used only for the middle button of the mouse.
        */
        var oldPageY = 0;
        function mouseMoveHandler(e){
            if(canScroll){
                // moving up
                if (e.pageY < oldPageY && isScrollAllowed.m.up){
                    moveSectionUp();
                }

                // moving down
                else if(e.pageY > oldPageY && isScrollAllowed.m.down){
                    moveSectionDown();
                }
            }
            oldPageY = e.pageY;
        }

        /**
        * Scrolls horizontal sliders.
        */
        function landscapeScroll(slides, destiny, direction){
            var section = closest(slides, SECTION_SEL);
            var v = {
                slides: slides,
                destiny: destiny,
                direction: direction,
                destinyPos: {left: destiny.offsetLeft},
                slideIndex: index(destiny),
                section: section,
                sectionIndex: index(section, SECTION_SEL),
                anchorLink: section.getAttribute('data-anchor'),
                slidesNav: $(SLIDES_NAV_SEL, section)[0],
                slideAnchor: getAnchor(destiny),
                prevSlide: $(SLIDE_ACTIVE_SEL, section)[0],
                prevSlideIndex: index($(SLIDE_ACTIVE_SEL, section)[0]),

                //caching the value of isResizing at the momment the function is called
                //because it will be checked later inside a setTimeout and the value might change
                localIsResizing: isResizing
            };
            v.xMovement = getXmovement(v.prevSlideIndex, v.slideIndex);

            //important!! Only do it when not resizing
            if(!v.localIsResizing){
                //preventing from scrolling to the next/prev section when using scrollHorizontally
                canScroll = false;
            }

            //quiting when destination slide is the same as the current one
            //if((v.prevSlide.is(v.destiny) && !v.localIsResizing)){ return; }

            extensionCall('parallax', 'applyHorizontal', v);

            if(options.onSlideLeave){

                //if the site is not just resizing and readjusting the slides
                if(!v.localIsResizing && v.xMovement!=='none'){
                    if(isFunction( options.onSlideLeave )){
                        if( fireCallback('onSlideLeave', v) === false){
                            slideMoving = false;
                            return;
                        }
                    }
                }
            }

            addClass(destiny, ACTIVE);
            removeClass(siblings(destiny), ACTIVE);

            if(!v.localIsResizing){
                stopMedia(v.prevSlide);
                lazyLoad(destiny);
            }

            toggleControlArrows(v);

            //only changing the URL if the slides are in the current section (not for resize re-adjusting)
            if(hasClass(section, ACTIVE) && !v.localIsResizing){
                setState(v.slideIndex, v.slideAnchor, v.anchorLink, v.sectionIndex);
            }

            if(FP.continuousHorizontal){
                FP.continuousHorizontal.apply(v);
            }

            if(!isDragging()){
                performHorizontalMove(slides, v, true);
            }
            //we need to fire the callbacks and set canScroll again when using dragAndMove
            else{
                afterSlideLoads(v);
            }

            //duplicated call to FP.interlockedSlides.apply(v) here!! But necessary! At least this one!
            //We have to call it here in order to call it at exactly the same time as we slide connected slides
            //otherwise we will see the sliding animation in connected sections when scrolling down fast after sliding horizontally
            //- Fixed bug with interlockedSlides and continuousHorizontal fullpageExtensions #130
            if(options.interlockedSlides && FP.interlockedSlides){
                //not using continuousHorizontal or using it but not about to apply it
                if(!usingExtension('continuousHorizontal') ||
                    typeof (direction) === "undefined" || direction === v.xMovement){
                    FP.interlockedSlides.apply(v);
                }
            }
        }

        function toggleControlArrows(v){
            if(!options.loopHorizontal && options.controlArrows){
                //hidding it for the fist slide, showing for the rest
                toggle($(SLIDES_ARROW_PREV_SEL, v.section), v.slideIndex!==0);

                //hidding it for the last slide, showing for the rest
                toggle($(SLIDES_ARROW_NEXT_SEL, v.section), next(v.destiny) != null);
            }
        }


        function afterSlideLoads(v){
            if(FP.continuousHorizontal){
                FP.continuousHorizontal.afterSlideLoads(v);
            }
            activeSlidesNavigation(v.slidesNav, v.slideIndex);

            //if the site is not just resizing and readjusting the slides
            if(!v.localIsResizing){
                extensionCall('parallax', 'afterSlideLoads');

                if(isFunction( options.afterSlideLoad )){
                    fireCallback('afterSlideLoad', v);
                }
                //needs to be inside the condition to prevent problems with continuousVertical and scrollHorizontally
                //and to prevent double scroll right after a windows resize
                canScroll = true;

                playMedia(v.destiny);
            }

            //letting them slide again
            slideMoving = false;

            if(usingExtension('interlockedSlides')){
                FP.interlockedSlides.apply(v);
            }
        }

        /**
        * Performs the horizontal movement. (CSS3 or jQuery)
        *
        * @param fireCallback {Bool} - determines whether or not to fire the callback
        */
        function performHorizontalMove(slides, v, fireCallback){
            var destinyPos = v.destinyPos;

            if(options.css3){
                var translate3d = 'translate3d(-' + Math.round(destinyPos.left) + 'px, 0px, 0px)';

                FP.test.translate3dH[v.sectionIndex] = translate3d;
                css(addAnimation($(SLIDES_CONTAINER_SEL, slides)), getTransforms(translate3d));

                afterSlideLoadsId = setTimeout(function(){
                    if(fireCallback){
                        afterSlideLoads(v);
                    }
                }, options.scrollingSpeed);
            }else{
                FP.test.left[v.sectionIndex] = Math.round(destinyPos.left);

                scrollTo(slides, Math.round(destinyPos.left), options.scrollingSpeed, function(){
                    if(fireCallback){
                        afterSlideLoads(v);
                    }
                });
            }
        }

        /**
        * Sets the state for the horizontal bullet navigations.
        */
        function activeSlidesNavigation(slidesNav, slideIndex){
            if(options.slidesNavigation && slidesNav != null){
                removeClass($(ACTIVE_SEL, slidesNav), ACTIVE);
                addClass( $('a', $('li', slidesNav)[slideIndex] ), ACTIVE);
            }
        }

        var previousHeight = windowsHeight;

        //when resizing the site, we adjust the heights of the sections, slimScroll...
        function resizeHandler(){
            trigger(container, 'onResize');

            //checking if it needs to get responsive
            responsive();

            // rebuild immediately on touch devices
            if (isTouchDevice) {
                var activeElement = document.activeElement;

                //if the keyboard is NOT visible
                if (!matches(activeElement, 'textarea') && !matches(activeElement, 'input') && !matches(activeElement, 'select')) {
                    var currentHeight = getWindowHeight();

                    //making sure the change in the viewport size is enough to force a rebuild. (20 % of the window to avoid problems when hidding scroll bars)
                    if( Math.abs(currentHeight - previousHeight) > (20 * Math.max(previousHeight, currentHeight) / 100) ){
                        reBuild(true);
                        previousHeight = currentHeight;
                    }
                }
            }else{
                //in order to call the functions only when the resize is finished
                //http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
                clearTimeout(resizeId);

                resizeId = setTimeout(function(){
                    reBuild(true);
                }, 350);
            }
        }

        /**
        * Checks if the site needs to get responsive and disables autoScrolling if so.
        * A class `fp-responsive` is added to the plugin's container in case the user wants to use it for his own responsive CSS.
        */
        function responsive(){
            var widthLimit = options.responsive || options.responsiveWidth; //backwards compatiblity
            var heightLimit = options.responsiveHeight;

            //only calculating what we need. Remember its called on the resize event.
            var isBreakingPointWidth = widthLimit && window.innerWidth < widthLimit;
            var isBreakingPointHeight = heightLimit && window.innerHeight < heightLimit;

            if(widthLimit && heightLimit){
                setResponsive(isBreakingPointWidth || isBreakingPointHeight);
            }
            else if(widthLimit){
                setResponsive(isBreakingPointWidth);
            }
            else if(heightLimit){
                setResponsive(isBreakingPointHeight);
            }
        }

        /**
        * Adds transition animations for the given element
        */
        function addAnimation(element){
            var transition = 'all ' + options.scrollingSpeed + 'ms ' + options.easingcss3;

            removeClass(element, NO_TRANSITION);
            return css(element, {
                '-webkit-transition': transition,
                'transition': transition
            });
        }

        /**
        * Remove transition animations for the given element
        */
        function disableAnimation(element){
            return addClass(element, NO_TRANSITION);
        }

        /**
        * Activating the vertical navigation bullets according to the given slide name.
        */
        function activateNavDots(name, sectionIndex){
            if(options.navigation && $(SECTION_NAV_SEL)[0] != null){
                    removeClass($(ACTIVE_SEL, $(SECTION_NAV_SEL)[0]), ACTIVE);
                if(name){
                    addClass( $('a[href="#' + name + '"]', $(SECTION_NAV_SEL)[0]), ACTIVE);
                }else{
                    addClass($('a', $('li', $(SECTION_NAV_SEL)[0])[sectionIndex]), ACTIVE);
                }
            }
        }

        /**
        * Activating the website main menu elements according to the given slide name.
        */
        function activateMenuElement(name){
            var menu = $(options.menu)[0];
            if(options.menu &&  menu != null){
                removeClass($(ACTIVE_SEL, menu), ACTIVE);
                addClass($('[data-menuanchor="'+name+'"]', menu), ACTIVE);
            }
        }

        /**
        * Sets to active the current menu and vertical nav items.
        */
        function activateMenuAndNav(anchor, index){
            activateMenuElement(anchor);
            activateNavDots(anchor, index);
        }

        /**
        * Retuns `up` or `down` depending on the scrolling movement to reach its destination
        * from the current section.
        */
        function getYmovement(destiny){
            var fromIndex = index($(SECTION_ACTIVE_SEL)[0], SECTION_SEL);
            var toIndex = index(destiny, SECTION_SEL);
            if( fromIndex == toIndex){
                return 'none';
            }
            if(fromIndex > toIndex){
                return 'up';
            }
            return 'down';
        }

        /**
        * Retuns `right` or `left` depending on the scrolling movement to reach its destination
        * from the current slide.
        */
        function getXmovement(fromIndex, toIndex){
            if( fromIndex == toIndex){
                return 'none';
            }
            if(fromIndex > toIndex){
                return 'left';
            }
            return 'right';
        }

        function addTableClass(element){
            //In case we are styling for the 2nd time as in with reponsiveSlides
            if(!hasClass(element, TABLE)){
                var wrapper = document.createElement('div');
                wrapper.className = TABLE_CELL;
                wrapper.style.height = getTableHeight(element) + 'px';

                addClass(element, TABLE);
                wrapInner(element, wrapper);
            }
        }

        function getTableHeight(element){
            var sectionHeight = getWindowHeightOffset(element);

            if(options.paddingTop || options.paddingBottom){
                var section = element;
                if(!hasClass(section, SECTION)){
                    section = closest(element, SECTION_SEL);
                }

                var paddings = parseInt(getComputedStyle(section)['padding-top']) + parseInt(getComputedStyle(section)['padding-bottom']);
                sectionHeight = (sectionHeight - paddings);
            }

            return sectionHeight;
        }

        /**
        * Adds a css3 transform property to the container class with or without animation depending on the animated param.
        */
        function transformContainer(translate3d, animated){
            if(animated){
                addAnimation(container);
            }else{
                disableAnimation(container);
            }

            clearTimeout(silentScrollId);
            css(container, getTransforms(translate3d));
            FP.test.translate3d = translate3d;

            //syncronously removing the class after the animation has been applied.
            silentScrollId = setTimeout(function(){
                removeClass(container, NO_TRANSITION);
            },10);
        }

        /**
        * Gets a section by its anchor / index
        */
        function getSectionByAnchor(sectionAnchor){
            var section = $(SECTION_SEL + '[data-anchor="'+sectionAnchor+'"]', container)[0];
            if(!section){
                var sectionIndex = typeof sectionAnchor !== 'undefined' ? sectionAnchor -1 : 0;
                section = $(SECTION_SEL)[sectionIndex];
            }

            return section;
        }

        /**
        * Gets a slide inside a given section by its anchor / index
        */
        function getSlideByAnchor(slideAnchor, section){
            var slide = $(SLIDE_SEL + '[data-anchor="'+slideAnchor+'"]', section)[0];
            if(slide == null){
                slideAnchor = typeof slideAnchor !== 'undefined' ? slideAnchor : 0;
                slide = $(SLIDE_SEL, section)[slideAnchor];
            }

            return slide;
        }

        /**
        * Scrolls to the given section and slide anchors
        */
        function scrollPageAndSlide(sectionAnchor, slideAnchor){
            var section = getSectionByAnchor(sectionAnchor);

            //do nothing if there's no section with the given anchor name
            if(section == null) return;

            var slide = getSlideByAnchor(slideAnchor, section);

            //we need to scroll to the section and then to the slide
            if (getAnchor(section) !== lastScrolledDestiny && !hasClass(section, ACTIVE)){
                scrollPage(section, function(){
                    scrollSlider(slide);
                });
            }
            //if we were already in the section
            else{
                scrollSlider(slide);
            }
        }

        /**
        * Scrolls the slider to the given slide destination for the given section
        */
        function scrollSlider(slide){
            if(slide != null){
                landscapeScroll(closest(slide, SLIDES_WRAPPER_SEL), slide);
            }
        }

        /**
        * Creates a landscape navigation bar with dots for horizontal sliders.
        */
        function addSlidesNavigation(section, numSlides){
            appendTo(createElementFromHTML('<div class="' + SLIDES_NAV + '"><ul></ul></div>'), section);
            var nav = $(SLIDES_NAV_SEL, section)[0];

            //top or bottom
            addClass(nav, 'fp-' + options.slidesNavPosition);

            for(var i=0; i< numSlides; i++){
                appendTo(createElementFromHTML('<li><a href="#"><span class="fp-sr-only">'+ getBulletLinkName(i, 'Slide') +'</span><span></span></a></li>'), $('ul', nav)[0] );
            }

            //centering it
            css(nav, {'margin-left': '-' + (nav.innerWidth/2) + 'px'});

            addClass($('a', $('li', nav)[0] ), ACTIVE);
        }


        /**
        * Sets the state of the website depending on the active section/slide.
        * It changes the URL hash when needed and updates the body class.
        */
        function setState(slideIndex, slideAnchor, anchorLink, sectionIndex){
            var sectionHash = '';

            if(options.anchors.length && !options.lockAnchors){

                //isn't it the first slide?
                if(slideIndex){
                    if(anchorLink != null){
                        sectionHash = anchorLink;
                    }

                    //slide without anchor link? We take the index instead.
                    if(slideAnchor == null){
                        slideAnchor = slideIndex;
                    }

                    lastScrolledSlide = slideAnchor;
                    setUrlHash(sectionHash + '/' + slideAnchor);

                //first slide won't have slide anchor, just the section one
                }else if(slideIndex != null){
                    lastScrolledSlide = slideAnchor;
                    setUrlHash(anchorLink);
                }

                //section without slides
                else{
                    setUrlHash(anchorLink);
                }
            }

            setBodyClass();
        }

        /**
        * Sets the URL hash.
        */
        function setUrlHash(url){
            if(options.recordHistory){
                location.hash = url;
            }else{
                //Mobile Chrome doesn't work the normal way, so... lets use HTML5 for phones :)
                if(isTouchDevice || isTouch){
                    window.history.replaceState(undefined, undefined, '#' + url);
                }else{
                    var baseUrl = window.location.href.split('#')[0];
                    window.location.replace( baseUrl + '#' + url );
                }
            }
        }

        /**
        * Gets the anchor for the given slide / section. Its index will be used if there's none.
        */
        function getAnchor(element){
            if(!element){
                return null;
            }
            var anchor = element.getAttribute('data-anchor');
            var elementIndex = index(element);

            //Slide without anchor link? We take the index instead.
            if(anchor == null){
                anchor = elementIndex;
            }

            return anchor;
        }

        /**
        * Sets a class for the body of the page depending on the active section / slide
        */
        function setBodyClass(){
            var section = $(SECTION_ACTIVE_SEL)[0];
            var slide = $(SLIDE_ACTIVE_SEL, section)[0];

            var sectionAnchor = getAnchor(section);
            var slideAnchor = getAnchor(slide);

            var text = String(sectionAnchor);

            if(slide){
                text = text + '-' + slideAnchor;
            }

            //changing slash for dash to make it a valid CSS style
            text = text.replace('/', '-').replace('#','');

            //removing previous anchor classes
            var classRe = new RegExp('\\b\\s?' + VIEWING_PREFIX + '-[^\\s]+\\b', "g");
            $body.className = $body.className.replace(classRe, '');

            //adding the current anchor
            addClass($body, VIEWING_PREFIX + '-' + text);
        }

        /**
        * Checks for translate3d support
        * @return boolean
        * http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
        */
        function support3d() {
            var el = document.createElement('p'),
                has3d,
                transforms = {
                    'webkitTransform':'-webkit-transform',
                    'OTransform':'-o-transform',
                    'msTransform':'-ms-transform',
                    'MozTransform':'-moz-transform',
                    'transform':'transform'
                };

            //preventing the style p:empty{display: none;} from returning the wrong result
            el.style.display = 'block'

            // Add it to the body to get the computed style.
            document.body.insertBefore(el, null);

            for (var t in transforms) {
                if (el.style[t] !== undefined) {
                    el.style[t] = 'translate3d(1px,1px,1px)';
                    has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                }
            }

            document.body.removeChild(el);

            return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
        }

        /**
        * Removes the auto scrolling action fired by the mouse wheel and trackpad.
        * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
        */
        function removeMouseWheelHandler(){
            if (document.addEventListener) {
                document.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
                document.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
                document.removeEventListener('MozMousePixelScroll', MouseWheelHandler, false); //old Firefox
            } else {
                document.detachEvent('onmousewheel', MouseWheelHandler); //IE 6/7/8
            }
        }

        /**
        * Adds the auto scrolling action for the mouse wheel and trackpad.
        * After this function is called, the mousewheel and trackpad movements will scroll through sections
        * https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        */
        function addMouseWheelHandler(){
            var prefix = '';
            var _addEventListener;

            if (window.addEventListener){
                _addEventListener = "addEventListener";
            }else{
                _addEventListener = "attachEvent";
                prefix = 'on';
            }

             // detect available wheel event
            var support = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"
                      document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
                      'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox


            if(support == 'DOMMouseScroll'){
                document[ _addEventListener ](prefix + 'MozMousePixelScroll', MouseWheelHandler, false);
            }

            //handle MozMousePixelScroll in older Firefox
            else{
                document[ _addEventListener ](prefix + support, MouseWheelHandler, false);
            }
        }

        /**
        * Binding the mousemove when the mouse's middle button is pressed
        */
        function addMiddleWheelHandler(){
            container.addEventListener('mousedown', mouseDownHandler);
            container.addEventListener('mouseup', mouseUpHandler);
        }

        /**
        * Unbinding the mousemove when the mouse's middle button is released
        */
        function removeMiddleWheelHandler(){
            container.removeEventListener('mousedown', mouseDownHandler);
            container.removeEventListener('mouseup', mouseUpHandler);
        }

        /**
        * Adds the possibility to auto scroll through sections on touch devices.
        */
        function addTouchHandler(){
            if(isTouchDevice || isTouch){
                if(options.autoScrolling){
                    $body.removeEventListener(events.touchmove, preventBouncing, {passive: false});
                    $body.addEventListener(events.touchmove, preventBouncing, {passive: false});
                }

                if($(WRAPPER_SEL).length > 0){
                    $(WRAPPER_SEL)[0].removeEventListener(events.touchstart, touchStartHandler);
                    $(WRAPPER_SEL)[0].removeEventListener(events.touchmove, touchMoveHandler, {passive: false});

                    $(WRAPPER_SEL)[0].addEventListener(events.touchstart, touchStartHandler);
                    $(WRAPPER_SEL)[0].addEventListener(events.touchmove, touchMoveHandler, {passive: false});
                }
            }
        }

        /**
        * Removes the auto scrolling for touch devices.
        */
        function removeTouchHandler(){
            if(isTouchDevice || isTouch){
                // normalScrollElements requires it off #2691
                if(options.autoScrolling){
                    $body.removeEventListener(events.touchmove, touchMoveHandler, {passive: false});
                    $body.removeEventListener(events.touchmove, preventBouncing, {passive: false});
                }

                if($(WRAPPER_SEL).length > 0){
                    $(WRAPPER_SEL)[0].removeEventListener(events.touchstart, touchStartHandler);
                    $(WRAPPER_SEL)[0].removeEventListener(events.touchmove, touchMoveHandler, {passive: false});
                }
            }
        }

        /*
        * Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
        * http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
        */
        function getMSPointer(){
            var pointer;

            //IE >= 11 & rest of browsers
            if(window.PointerEvent){
                pointer = { down: 'pointerdown', move: 'pointermove'};
            }

            //IE < 11
            else{
                pointer = { down: 'MSPointerDown', move: 'MSPointerMove'};
            }

            return pointer;
        }

        /**
        * Gets the pageX and pageY properties depending on the browser.
        * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
        */
        function getEventsPage(e){
            var events = [];

            events.y = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
            events.x = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);

            //in touch devices with scrollBar:true, e.pageY is detected, but we have to deal with touch events. #1008
            if(isTouch && isReallyTouch(e) && options.scrollBar && typeof e.touches !== 'undefined'){
                events.y = e.touches[0].pageY;
                events.x = e.touches[0].pageX;
            }

            return events;
        }

        /**
        * Slides silently (with no animation) the active slider to the given slide.
        * @param noCallback {bool} true or defined -> no callbacks
        */
        function silentLandscapeScroll(activeSlide, noCallbacks){
            setScrollingSpeed (0, 'internal');

            if(typeof noCallbacks !== 'undefined'){
                //preventing firing callbacks afterSlideLoad etc.
                isResizing = true;
            }

            landscapeScroll(closest(activeSlide, SLIDES_WRAPPER_SEL), activeSlide);

            if(typeof noCallbacks !== 'undefined'){
                isResizing = false;
            }

            setScrollingSpeed(originals.scrollingSpeed, 'internal');
        }

        /**
        * Scrolls silently (with no animation) the page to the given Y position.
        */
        function silentScroll(top){
            // The first section can have a negative value in iOS 10. Not quite sure why: -0.0142822265625
            // that's why we round it to 0.
            var roundedTop = Math.round(top);

            if (options.css3 && options.autoScrolling && !options.scrollBar){
                var translate3d = 'translate3d(0px, -' + roundedTop + 'px, 0px)';
                transformContainer(translate3d, false);
            }
            else if(options.autoScrolling && !options.scrollBar){
                css(container, {'top': -roundedTop + 'px'});
                FP.test.top = -roundedTop + 'px';
            }
            else{
                var scrollSettings = getScrollSettings(roundedTop);
                setScrolling(scrollSettings.element, scrollSettings.options);
            }
        }

        /**
        * Returns the cross-browser transform string.
        */
        function getTransforms(translate3d){
            return {
                '-webkit-transform': translate3d,
                '-moz-transform': translate3d,
                '-ms-transform':translate3d,
                'transform': translate3d
            };
        }

        /**
        * Allowing or disallowing the mouse/swipe scroll in a given direction. (not for keyboard)
        * @type  m (mouse) or k (keyboard)
        */
        function setIsScrollAllowed(value, direction, type){
            //up, down, left, right
            if(direction !== 'all'){
                isScrollAllowed[type][direction] = value;
            }

            //all directions?
            else{
                Object.keys(isScrollAllowed[type]).forEach(function(key){
                    isScrollAllowed[type][key] = value;
                });
            }
        }

        /*
        * Destroys fullpage.js plugin events and optinally its html markup and styles
        */
        function destroy(all){
            trigger(container, 'destroy', all);

            setAutoScrolling(false, 'internal');
            setAllowScrolling(true);
            setMouseHijack(false);
            setKeyboardScrolling(false);
            addClass(container, DESTROYED);

            clearTimeout(afterSlideLoadsId);
            clearTimeout(afterSectionLoadsId);
            clearTimeout(resizeId);
            clearTimeout(scrollId);
            clearTimeout(scrollId2);

            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('hashchange', hashChangeHandler);
            window.removeEventListener('resize', resizeHandler);

            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keyup', keyUpHandler);

            ['click', 'touchstart'].forEach(function(eventName){
                document.removeEventListener(eventName, delegatedEvents);
            });

            ['mouseenter', 'touchstart', 'mouseleave', 'touchend'].forEach(function(eventName){
                document.removeEventListener(eventName, onMouseEnterOrLeave, true); //true is required!
            });

            if(usingExtension('dragAndMove')){
                FP.dragAndMove.destroy();
            }

            clearTimeout(afterSlideLoadsId);
            clearTimeout(afterSectionLoadsId);

            //lets make a mess!
            if(all){
                destroyStructure();
            }
        }

        /*
        * Removes inline styles added by fullpage.js
        */
        function destroyStructure(){
            //reseting the `top` or `translate` properties to 0
            silentScroll(0);

            //loading all the lazy load content
            $('img[data-src], source[data-src], audio[data-src], iframe[data-src]', container).forEach(function(item){
                setSrc(item, 'src');
            });

            $('img[data-srcset]').forEach(function(item){
                setSrc(item, 'srcset');
            });

            remove($(SECTION_NAV_SEL + ', ' + SLIDES_NAV_SEL +  ', ' + SLIDES_ARROW_SEL));

            //removing inline styles
            css($(SECTION_SEL), {
                'height': '',
                'background-color' : '',
                'padding': ''
            });

            css($(SLIDE_SEL), {
                'width': ''
            });

            css(container, {
                'height': '',
                'position': '',
                '-ms-touch-action': '',
                'touch-action': ''
            });

            css($htmlBody, {
                'overflow': '',
                'height': ''
            });

            // remove .fp-enabled class
            removeClass($('html'), ENABLED);

            // remove .fp-responsive class
            removeClass($body, RESPONSIVE);

            // remove all of the .fp-viewing- classes
             $body.className.split(/\s+/).forEach(function (className) {
                if (className.indexOf(VIEWING_PREFIX) === 0) {
                    removeClass($body, className);
                }
            });

            //removing added classes
            $(SECTION_SEL + ', ' + SLIDE_SEL).forEach(function(item){
                if(options.scrollOverflowHandler){
                    options.scrollOverflowHandler.remove(item);
                }
                removeClass(item, TABLE + ' ' + ACTIVE + ' ' + COMPLETELY);
                var previousStyles = item.getAttribute('data-fp-styles');
                if(previousStyles){
                    item.setAttribute('style', item.getAttribute('data-fp-styles'));
                }
            });

            //removing the applied transition from the fullpage wrapper
            removeAnimation(container);

            //Unwrapping content
            [TABLE_CELL_SEL, SLIDES_CONTAINER_SEL,SLIDES_WRAPPER_SEL].forEach(function(selector){
                $(selector, container).forEach(function(item){
                    //unwrap not being use in case there's no child element inside and its just text
                    unwrap(item);
                });
            });

            //scrolling the page to the top with no animation
            //scrolling the page to the top with no animation
            window.scrollTo(0, 0);

            //removing selectors
            var usedSelectors = [SECTION, SLIDE, SLIDES_CONTAINER];
            usedSelectors.forEach(function(item){
                removeClass($('.' + item), item);
            });
        }

        function removeAnimation(element){
            return css(element, {
                '-webkit-transition': 'none',
                'transition': 'none'
            });
        }

        function usingExtension(name){
            //is an array?
            if(options[name] !== null && Object.prototype.toString.call( options[name] ) === '[object Array]'){
                return options[name].length && FP[name];
            }
            return options[name] && FP[name];
        }

        function extensionCall(extensionName, method, params){
            if(usingExtension(extensionName)){
                return FP[extensionName][method](params);
            }
        }

        /**
        * DragAndMove Extension
        */
        function isAnimatingDragging(){
            return ( usingExtension('dragAndMove') && FP.dragAndMove.isAnimating);
        }

        function isDragging(){
            return (usingExtension('dragAndMove') && FP.dragAndMove.isGrabbing);
        }

        /*
        * Sets the state for a variable with multiple states (original, and temporal)
        * Some variables such as `autoScrolling` or `recordHistory` might change automatically its state when using `responsive` or `autoScrolling:false`.
        * This function is used to keep track of both states, the original and the temporal one.
        * If type is not 'internal', then we assume the user is globally changing the variable.
        */
        function setVariableState(variable, value, type){
            options[variable] = value;
            if(type !== 'internal'){
                originals[variable] = value;
            }
        }

        /**
        * Displays warnings
        */
        function displayWarnings(){
            if(!isLicenseValid){
                showError('error', 'Fullpage.js version 3 has changed its license to GPLv3 and it requires a `licenseKey` option. Read about it here:');
                showError('error', 'https://github.com/alvarotrigo/fullPage.js#options.');
            }

            if(hasClass($('html'), ENABLED)){
                showError('error', 'Fullpage.js can only be initialized once and you are doing it multiple times!');
                return;
            }

            // Disable mutually exclusive settings
            if (options.continuousVertical &&
                (options.loopTop || options.loopBottom)) {
                options.continuousVertical = false;
                showError('warn', 'Option `loopTop/loopBottom` is mutually exclusive with `continuousVertical`; `continuousVertical` disabled');
            }

            if(options.scrollOverflow &&
               (options.scrollBar || !options.autoScrolling)){
                showError('warn', 'Options scrollBar:true and autoScrolling:false are mutually exclusive with scrollOverflow:true. Sections with scrollOverflow might not work well in Firefox');
            }

            if(options.continuousVertical && (options.scrollBar || !options.autoScrolling)){
                options.continuousVertical = false;
                showError('warn', 'Scroll bars (`scrollBar:true` or `autoScrolling:false`) are mutually exclusive with `continuousVertical`; `continuousVertical` disabled');
            }

            if(options.scrollOverflow && options.scrollOverflowHandler == null){
                options.scrollOverflow = false;
                showError('error', 'The option `scrollOverflow:true` requires the file `scrolloverflow.min.js`. Please include it before fullPage.js.');
            }

            //anchors can not have the same value as any element ID or NAME
            options.anchors.forEach(function(name){

                //case insensitive selectors (http://stackoverflow.com/a/19465187/1081396)
                var nameAttr = [].slice.call($('[name]')).filter(function(item) {
                    return item.getAttribute('name') && item.getAttribute('name').toLowerCase() == name.toLowerCase();
                });

                var idAttr = [].slice.call($('[id]')).filter(function(item) {
                    return item.getAttribute('id') && item.getAttribute('id').toLowerCase() == name.toLowerCase();
                });

                if(idAttr.length || nameAttr.length ){
                    showError('error', 'data-anchor tags can not have the same value as any `id` element on the site (or `name` element for IE).');
                    if(idAttr.length){
                        showError('error', '"' + name + '" is is being used by another element `id` property');
                    }
                    if(nameAttr.length){
                        showError('error', '"' + name + '" is is being used by another element `name` property');
                    }
                }
            });
        }

        /**
        * Getting the position of the element to scroll when using jQuery animations
        */
        function getScrolledPosition(element){
            var position;

            //is not the window element and is a slide?
            if(element.self != window && hasClass(element, SLIDES_WRAPPER)){
                position = element.scrollLeft;
            }
            else if(!options.autoScrolling  || options.scrollBar){
                position = getScrollTop();
            }
            else{
                position = element.offsetTop;
            }

            //gets the top property of the wrapper
            return position;
        }

        /**
        * Simulates the animated scrollTop of jQuery. Used when css3:false or scrollBar:true or autoScrolling:false
        * http://stackoverflow.com/a/16136789/1081396
        */
        function scrollTo(element, to, duration, callback) {
            var start = getScrolledPosition(element);
            var change = to - start;
            var currentTime = 0;
            var increment = 20;
            activeAnimation = true;

            var animateScroll = function(){
                if(activeAnimation){ //in order to stope it from other function whenever we want
                    var val = to;

                    currentTime += increment;

                    if(duration){
                        val = window.fp_easings[options.easing](currentTime, start, change, duration);
                    }

                    setScrolling(element, val);

                    if(currentTime < duration) {
                        setTimeout(animateScroll, increment);
                    }else if(typeof callback !== 'undefined'){
                        callback();
                    }
                }else if (currentTime < duration){
                    callback();
                }
            };

            animateScroll();
        }

        /**
        * Scrolls the page / slider the given number of pixels.
        * It will do it one or another way dependiong on the library's config.
        */
        function setScrolling(element, val){
            if(!options.autoScrolling || options.scrollBar || (element.self != window && hasClass(element, SLIDES_WRAPPER))){

                //scrolling horizontally through the slides?
                if(element.self != window  && hasClass(element, SLIDES_WRAPPER)){
                    element.scrollLeft = val;
                }
                //vertical scroll
                else{
                    element.scrollTo(0, val);
                }
            }else{
                 element.style.top = val + 'px';
            }
        }

        /**
        * Gets the active slide.
        */
        function getActiveSlide(){
            var activeSlide = $(SLIDE_ACTIVE_SEL, $(SECTION_ACTIVE_SEL)[0])[0];
            return nullOrSlide(activeSlide);
        }

        /**
        * Gets the active section.
        */
        function getActiveSection(){
            return new Section($(SECTION_ACTIVE_SEL)[0]);
        }

        /**
        * Item. Slide or Section objects share the same properties.
        */
        function Item(el, selector){
            this.anchor = el.getAttribute('data-anchor');
            this.item = el;
            this.index = index(el, selector);
            this.isLast = this.index === $(selector).length -1;
            this.isFirst = !this.index;
        }

        /**
        * Section object
        */
        function Section(el){
            Item.call(this, el, SECTION_SEL);
        }

        /**
        * Slide object
        */
        function Slide(el){
            Item.call(this, el, SLIDE_SEL);
        }

        return FP;
    }//end of $.fn.fullpage

    //utils
    /**
    * Shows a message in the console of the given type.
    */
    function showError(type, text){
        window.console && window.console[type] && window.console[type]('fullPage: ' + text);
    }

    /**
    * Equivalent or jQuery function $().
    */
    function $(selector, context){
        context = arguments.length > 1 ? context : document;
        return context ? context.querySelectorAll(selector) : null;
    }

    /**
    * Extends a given Object properties and its childs.
    */
    function deepExtend(out) {
        out = out || {};
        for (var i = 1, len = arguments.length; i < len; ++i){
            var obj = arguments[i];

            if(!obj){
              continue;
            }

            for(var key in obj){
              if (!obj.hasOwnProperty(key)){
                continue;
              }

              // based on https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
              if (Object.prototype.toString.call(obj[key]) === '[object Object]'){
                out[key] = deepExtend(out[key], obj[key]);
                continue;
              }

              out[key] = obj[key];
            }
        }
        return out;
    }

    /**
    * Checks if the passed element contains the passed class.
    */
    function hasClass(el, className){
        if(el == null){
            return false;
        }
        if (el.classList){
            return el.classList.contains(className);
        }
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }

    /**
    * Gets the window height. Crossbrowser.
    */
    function getWindowHeight(){
        return  'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
    }

    /**
    * Set's the CSS properties for the passed item/s.
    * @param {NodeList|HTMLElement} items
    * @param {Object} props css properties and values.
    */
    function css(items, props) {
        items = getList(items);

        var key;
        for (key in props) {
            if (props.hasOwnProperty(key)) {
                if (key !== null) {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        item.style[key] = props[key];
                    }
                }
            }
        }

        return items;
    }

    /**
    * Generic function to get the previous or next element.
    */
    function until(item, selector, fn){
        var sibling = item[fn];
        while(sibling && !matches(sibling, selector)){
            sibling = sibling[fn];
        }

        return sibling;
    }

    /**
    * Gets the previous element to the passed element that matches the passed selector.
    */
    function prevUntil(item, selector){
        return until(item, selector, 'previousElementSibling');
    }

    /**
    * Gets the next element to the passed element that matches the passed selector.
    */
    function nextUntil(item, selector){
        return until(item, selector, 'nextElementSibling');
    }

    /**
    * Gets the previous element to the passed element.
    */
    function prev(item, selector){
        if(selector == null){
            return item.previousElementSibling;
        }
        var prevItem = prev(item);
        return prevItem && matches(prevItem, selector) ? prevItem : null;
    }

    /**
    * Gets the next element to the passed element.
    */
    function next(item, selector){
        if(selector == null){
            return item.nextElementSibling;
        }
        var nextItem = next(item);
        return nextItem && matches(nextItem, selector) ? nextItem : null;
    }

    /**
    * Gets the last element from the passed list of elements.
    */
    function last(item){
        return item[item.length-1];
    }

    /**
    * Gets index from the passed element.
    * @param {String} selector is optional.
    */
    function index(item, selector) {
        item = isArrayOrList(item) ? item[0] : item;
        var children = selector != null? $(selector, item.parentNode) : item.parentNode.childNodes;
        var num = 0;
        for (var i=0; i<children.length; i++) {
             if (children[i] == item) return num;
             if (children[i].nodeType==1) num++;
        }
        return -1;
    }

    /**
    * Gets an iterable element for the passed element/s
    */
    function getList(item){
        return !isArrayOrList(item) ? [item] : item;
    }

    /**
    * Adds the display=none property for the passed element/s
    */
    function hide(el){
        el = getList(el);

        for(var i = 0; i<el.length; i++){
            el[i].style.display = 'none';
        }
        return el;
    }

    /**
    * Adds the display=block property for the passed element/s
    */
    function show(el){
        el = getList(el);

        for(var i = 0; i<el.length; i++){
            el[i].style.display = 'block';
        }
        return el;
    }

    /**
    * Checks if the passed element is an iterable element or not
    */
    function isArrayOrList(el){
        return Object.prototype.toString.call( el ) === '[object Array]' ||
            Object.prototype.toString.call( el ) === '[object NodeList]';
    }

    /**
    * Adds the passed class to the passed element/s
    */
    function addClass(el, className) {
        el = getList(el);

        for(var i = 0; i<el.length; i++){
            var item = el[i];
            if (item.classList){
                item.classList.add(className);
            }
            else{
              item.className += ' ' + className;
            }
        }
        return el;
    }

    /**
    * Removes the passed class to the passed element/s
    * @param {String} `className` can be multiple classnames separated by whitespace
    */
    function removeClass(el, className){
        el = getList(el);

        var classNames = className.split(' ');

        for(var a = 0; a<classNames.length; a++){
            className = classNames[a];
            for(var i = 0; i<el.length; i++){
                var item = el[i];
                if (item.classList){
                    item.classList.remove(className);
                }
                else{
                    item.className = item.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                }
            }
        }
        return el;
    }

    /**
    * Appends the given element ot the given parent.
    */
    function appendTo(el, parent){
        parent.appendChild(el);
    }

    /**
    Usage:

    var wrapper = document.createElement('div');
    wrapper.className = 'fp-slides';
    wrap($('.slide'), wrapper);

    https://jsfiddle.net/qwzc7oy3/15/ (vanilla)
    https://jsfiddle.net/oya6ndka/1/ (jquery equivalent)
    */
    function wrap(toWrap, wrapper, isWrapAll) {
        var newParent;
        wrapper = wrapper || document.createElement('div');
        for(var i = 0; i < toWrap.length; i++){
            var item = toWrap[i];
            if(isWrapAll && !i || !isWrapAll){
                newParent = wrapper.cloneNode(true);
                item.parentNode.insertBefore(newParent, item);
            }
            newParent.appendChild(item);
        }
        return toWrap;
    }

    /**
    Usage:
    var wrapper = document.createElement('div');
    wrapper.className = 'fp-slides';
    wrap($('.slide'), wrapper);

    https://jsfiddle.net/qwzc7oy3/27/ (vanilla)
    https://jsfiddle.net/oya6ndka/4/ (jquery equivalent)
    */
    function wrapAll(toWrap, wrapper) {
        wrap(toWrap, wrapper, true);
    }

    /**
    * Usage:
    * wrapInner(document.querySelector('#pepe'), '<div class="test">afdas</div>');
    * wrapInner(document.querySelector('#pepe'), element);
    *
    * https://jsfiddle.net/zexxz0tw/6/
    *
    * https://stackoverflow.com/a/21817590/1081396
    */
    function wrapInner(parent, wrapper) {
        if (typeof wrapper === "string"){
            wrapper = createElementFromHTML(wrapper);
        }

        parent.appendChild(wrapper);

        while(parent.firstChild !== wrapper){
            wrapper.appendChild(parent.firstChild);
       }
    }

    /**
    * Usage:
    * unwrap(document.querySelector('#pepe'));
    * unwrap(element);
    *
    * https://jsfiddle.net/szjt0hxq/1/
    *
    */
    function unwrap(wrapper) {
        var wrapperContent = document.createDocumentFragment();
        while (wrapper.firstChild) {
            wrapperContent.appendChild(wrapper.firstChild);
        }
         wrapper.parentNode.replaceChild(wrapperContent, wrapper);
    }

    /**
    * http://stackoverflow.com/questions/22100853/dom-pure-javascript-solution-to-jquery-closest-implementation
    * Returns the element or `false` if there's none
    */
    function closest(el, selector) {
        if(el && el.nodeType === 1){
            if(matches(el, selector)){
                return el;
            }
            return closest(el.parentNode, selector);
        }
        return null;
    }

    /**
    * Places one element (rel) after another one or group of them (reference).
    * @param {HTMLElement} reference
    * @param {HTMLElement|NodeList|String} el
    * https://jsfiddle.net/9s97hhzv/1/
    */
    function after(reference, el) {
        insertBefore(reference, reference.nextSibling, el);
    }

    /**
    * Places one element (rel) before another one or group of them (reference).
    * @param {HTMLElement} reference
    * @param {HTMLElement|NodeList|String} el
    * https://jsfiddle.net/9s97hhzv/1/
    */
    function before(reference, el) {
        insertBefore(reference, reference, el);
    }

    /**
    * Based in https://stackoverflow.com/a/19316024/1081396
    * and https://stackoverflow.com/a/4793630/1081396
    */
    function insertBefore(reference, beforeElement, el){
        if(!isArrayOrList(el)){
            if(typeof el == 'string'){
                el = createElementFromHTML(el);
            }
            el = [el];
        }

        for(var i = 0; i<el.length; i++){
            reference.parentNode.insertBefore(el[i], beforeElement);
        }
    }

    //http://stackoverflow.com/questions/3464876/javascript-get-window-x-y-position-for-scroll
    function getScrollTop(){
        var doc = document.documentElement;
        return (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    }

    /**
    * Gets the siblings of the passed element
    */
    function siblings(el){
        return Array.prototype.filter.call(el.parentNode.children, function(child){
          return child !== el;
        });
    }

    //for IE 9 ?
    function preventDefault(event){
        if(event.preventDefault){
            event.preventDefault();
        }
        else{
            event.returnValue = false;
        }
    }

    /**
    * Determines whether the passed item is of function type.
    */
    function isFunction(item) {
      if (typeof item === 'function') {
        return true;
      }
      var type = Object.prototype.toString(item);
      return type === '[object Function]' || type === '[object GeneratorFunction]';
    }

    /**
    * Trigger custom events
    */
    function trigger(el, eventName, data){
        var event;
        data = typeof data === 'undefined' ? {} : data;

        // Native
        if(typeof window.CustomEvent === "function" ){
            event = new CustomEvent(eventName, {detail: data});
        }
        else{
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, data);
        }

        el.dispatchEvent(event);
    }

    /**
    * Polyfill of .matches()
    */
    function matches(el, selector) {
        return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    }

    /**
    * Toggles the visibility of the passed element el.
    */
    function toggle(el, value){
        if(typeof value === "boolean"){
            for(var i = 0; i<el.length; i++){
                el[i].style.display = value ? 'block' : 'none';
            }
        }
        //we don't use it in other way, so no else :)

        return el;
    }

    /**
    * Creates a HTMLElement from the passed HTML string.
    * https://stackoverflow.com/a/494348/1081396
    */
    function createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes
        return div.firstChild;
    }

    /**
    * Removes the passed item/s from the DOM.
    */
    function remove(items){
        items = getList(items);
        for(var i = 0; i<items.length; i++){
            var item = items[i];
            if(item && item.parentElement) {
                item.parentNode.removeChild(item);
            }
        }
    }

    /**
    * Filters an array by the passed filter funtion.
    */
    function filter(el, filterFn){
        Array.prototype.filter.call(el, filterFn);
    }

    //https://jsfiddle.net/w1rktecz/
    function untilAll(item, selector, fn){
        var sibling = item[fn];
        var siblings = [];
        while(sibling){
            if(matches(sibling, selector) || selector == null) {
                siblings.push(sibling);
            }
            sibling = sibling[fn];
        }

        return siblings;
    }

    /**
    * Gets all next elements matching the passed selector.
    */
    function nextAll(item, selector){
        return untilAll(item, selector, 'nextElementSibling');
    }

    /**
    * Gets all previous elements matching the passed selector.
    */
    function prevAll(item, selector){
        return untilAll(item, selector, 'previousElementSibling');
    }

    /**
    * Converts an object to an array.
    */
    function toArray(objectData){
        return Object.keys(objectData).map(function(key) {
           return objectData[key];
        });
    }

    //extensions only
    function prependTo(parentNode, item){
        parentNode.insertBefore(item, parentNode.firstChild);
    }

    function toggleClass(el, className, force){
        if (el.classList && force == null){
            el.classList.toggle(className);
        }
        else{
            var classExist = hasClass(el, className);
            if(classExist && force == null || !force){
                removeClass(el, className);
            }
            else if(!classExist && force == null || force){
                addClass(el, className);
            }
        }
    }

    /**
    * forEach polyfill for IE
    * https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Browser_Compatibility
    */
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function (callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
    }

    //utils are public, so we can use it wherever we want
    window.fp_utils = {
        $: $,
        deepExtend: deepExtend,
        hasClass: hasClass,
        getWindowHeight: getWindowHeight,
        css: css,
        until: until,
        prevUntil: prevUntil,
        nextUntil: nextUntil,
        prev: prev,
        next: next,
        last: last,
        index: index,
        getList: getList,
        hide: hide,
        show: show,
        isArrayOrList: isArrayOrList,
        addClass: addClass,
        removeClass: removeClass,
        appendTo: appendTo,
        wrap: wrap,
        wrapAll: wrapAll,
        wrapInner: wrapInner,
        unwrap: unwrap,
        closest: closest,
        after: after,
        before: before,
        insertBefore: insertBefore,
        getScrollTop: getScrollTop,
        siblings: siblings,
        preventDefault: preventDefault,
        isFunction: isFunction,
        trigger: trigger,
        matches: matches,
        toggle: toggle,
        createElementFromHTML: createElementFromHTML,
        remove: remove,
        filter: filter,
        untilAll: untilAll,
        nextAll: nextAll,
        prevAll: prevAll,
        showError: showError,

        //extensions only
        prependTo: prependTo,
        toggleClass: toggleClass
    };

    return initialise;
}));

/**
 * jQuery adapter for fullPage.js 3.0.0
 */
if(window.jQuery && window.fullpage){
    (function ($, fullpage) {
        'use strict';

        // No jQuery No Go
        if (!$ || !fullpage) {
            window.fp_utils.showError('error', 'jQuery is required to use the jQuery fullpage adapter!');
            return;
        }

        $.fn.fullpage = function(options) {
            var FP = new fullpage(this[0], options);

            //Static API
            Object.keys(FP).forEach(function (key) {
                $.fn.fullpage[key] = FP[key];
            });
        };
    })(window.jQuery, window.fullpage);
}

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(0);
var external_react_default = /*#__PURE__*/__webpack_require__.n(external_react_);

// CONCATENATED MODULE: ./components/Wrapper/index.js
/* eslint-disable import/no-extraneous-dependencies */var Wrapper_Wrapper=function Wrapper(_ref){var children=_ref.children;return external_react_default.a.createElement(external_react_["Fragment"],null,children);};/* harmony default export */ var components_Wrapper = (Wrapper_Wrapper);
// CONCATENATED MODULE: ./components/index.js
/* eslint-disable */var exported=void 0;if(typeof window!=='undefined'){exported=__webpack_require__(9).default;}else{exported=__webpack_require__(3).default;}exported.Wrapper=components_Wrapper;/* harmony default export */ var components = __webpack_exports__["default"] = (exported);

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/* eslint-disable import/no-extraneous-dependencies *//* eslint-disable react/prop-types */// NOTE: SSR support
var ReactFullpageShell=function(_React$Component){_inherits(ReactFullpageShell,_React$Component);function ReactFullpageShell(props){_classCallCheck(this,ReactFullpageShell);var _this=_possibleConstructorReturn(this,(ReactFullpageShell.__proto__||Object.getPrototypeOf(ReactFullpageShell)).call(this,props));_this.state={};return _this;}_createClass(ReactFullpageShell,[{key:"render",value:function render(){return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div",{id:"fullpage"},this.props.render(this));}}]);return ReactFullpageShell;}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);/* harmony default export */ __webpack_exports__["default"] = (ReactFullpageShell);

/***/ }),
/* 4 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getTarget = function (target) {
  return document.querySelector(target);
};

var getElement = (function (fn) {
	var memo = {};

	return function(target) {
                // If passing function in options, then use it for resolve "head" element.
                // Useful for Shadow Root style i.e
                // {
                //   insertInto: function () { return document.querySelector("#foo").shadowRoot }
                // }
                if (typeof target === 'function') {
                        return target();
                }
                if (typeof memo[target] === "undefined") {
			var styleTarget = getTarget.call(this, target);
			// Special case to return head of iframe instead of iframe itself
			if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[target] = styleTarget;
		}
		return memo[target]
	};
})();

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(4);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
        if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 6 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(6)(true);
// imports


// module
exports.push([module.i, "/*!\r\n * fullPage 3.0.3\r\n * https://github.com/alvarotrigo/fullPage.js\r\n *\r\n * @license GPLv3 for open source use only\r\n * or Fullpage Commercial License for commercial use\r\n * http://alvarotrigo.com/fullPage/pricing/\r\n *\r\n * Copyright (C) 2018 http://alvarotrigo.com/fullPage - A project by Alvaro Trigo\r\n */.fp-enabled body,html.fp-enabled{margin:0;padding:0;overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0)}.fp-section{position:relative;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.fp-slide{float:left}.fp-slide,.fp-slidesContainer{height:100%;display:block}.fp-slides{z-index:1;height:100%;overflow:hidden;position:relative;-webkit-transition:all .3s ease-out;transition:all .3s ease-out}.fp-section.fp-table,.fp-slide.fp-table{display:table;table-layout:fixed;width:100%}.fp-tableCell{display:table-cell;vertical-align:middle;width:100%;height:100%}.fp-slidesContainer{float:left;position:relative}.fp-controlArrow{-webkit-user-select:none;-moz-user-select:none;-khtml-user-select:none;-ms-user-select:none;position:absolute;z-index:4;top:50%;cursor:pointer;width:0;height:0;border-style:solid;margin-top:-38px;-webkit-transform:translateZ(0);-ms-transform:translateZ(0);transform:translateZ(0)}.fp-controlArrow.fp-prev{left:15px;width:0;border-width:38.5px 34px 38.5px 0;border-color:transparent #fff transparent transparent}.fp-controlArrow.fp-next{right:15px;border-width:38.5px 0 38.5px 34px;border-color:transparent transparent transparent #fff}.fp-scrollable{position:relative}.fp-scrollable,.fp-scroller{overflow:hidden}.iScrollIndicator{border:0!important}.fp-notransition{-webkit-transition:none!important;transition:none!important}#fp-nav{position:fixed;z-index:100;margin-top:-32px;top:50%;opacity:1;-webkit-transform:translateZ(0)}#fp-nav.fp-right{right:17px}#fp-nav.fp-left{left:17px}.fp-slidesNav{position:absolute;z-index:4;opacity:1;-webkit-transform:translateZ(0);-ms-transform:translateZ(0);transform:translateZ(0);left:0!important;right:0;margin:0 auto!important}.fp-slidesNav.fp-bottom{bottom:17px}.fp-slidesNav.fp-top{top:17px}#fp-nav ul,.fp-slidesNav ul{margin:0;padding:0}#fp-nav ul li,.fp-slidesNav ul li{display:block;width:14px;height:13px;margin:7px;position:relative}.fp-slidesNav ul li{display:inline-block}#fp-nav ul li a,.fp-slidesNav ul li a{display:block;position:relative;z-index:1;width:100%;height:100%;cursor:pointer;text-decoration:none}#fp-nav ul li:hover a.active span,#fp-nav ul li a.active span,.fp-slidesNav ul li:hover a.active span,.fp-slidesNav ul li a.active span{height:12px;width:12px;margin:-6px 0 0 -6px;border-radius:100%}#fp-nav ul li a span,.fp-slidesNav ul li a span{border-radius:50%;position:absolute;z-index:1;height:4px;width:4px;border:0;background:#333;left:50%;top:50%;margin:-2px 0 0 -2px;-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}#fp-nav ul li:hover a span,.fp-slidesNav ul li:hover a span{width:10px;height:10px;margin:-5px 0 0 -5px}#fp-nav ul li .fp-tooltip{position:absolute;top:-2px;color:#fff;font-size:14px;font-family:arial,helvetica,sans-serif;white-space:nowrap;max-width:220px;overflow:hidden;display:block;opacity:0;width:0;cursor:pointer}#fp-nav.fp-show-active a.active+.fp-tooltip,#fp-nav ul li:hover .fp-tooltip{-webkit-transition:opacity .2s ease-in;transition:opacity .2s ease-in;width:auto;opacity:1}#fp-nav ul li .fp-tooltip.fp-right{right:20px}#fp-nav ul li .fp-tooltip.fp-left{left:20px}.fp-auto-height.fp-section,.fp-auto-height .fp-slide,.fp-auto-height .fp-tableCell,.fp-responsive .fp-auto-height-responsive.fp-section,.fp-responsive .fp-auto-height-responsive .fp-slide,.fp-responsive .fp-auto-height-responsive .fp-tableCell{height:auto!important}.fp-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}", "", {"version":3,"sources":["/Library/WebServer/Documents/react-fullpage/node_modules/fullpage.js/dist/fullpage.min.css"],"names":[],"mappings":"AAAA;;;;;;;;;GASG,iCAAiC,SAAS,UAAU,gBAAgB,yCAAyC,CAAC,YAAY,kBAAkB,8BAA8B,2BAA2B,qBAAqB,CAAC,UAAU,UAAU,CAAC,8BAA8B,YAAY,aAAa,CAAC,WAAW,UAAU,YAAY,gBAAgB,kBAAkB,oCAAoC,2BAA2B,CAAC,wCAAwC,cAAc,mBAAmB,UAAU,CAAC,cAAc,mBAAmB,sBAAsB,WAAW,WAAW,CAAC,oBAAoB,WAAW,iBAAiB,CAAC,iBAAiB,yBAAyB,sBAAsB,wBAAwB,qBAAqB,kBAAkB,UAAU,QAAQ,eAAe,QAAQ,SAAS,mBAAmB,iBAAiB,gCAAqC,4BAAiC,uBAA4B,CAAC,yBAAyB,UAAU,QAAQ,kCAAkC,qDAAqD,CAAC,yBAAyB,WAAW,kCAAkC,qDAAqD,CAAC,eAA+B,iBAAiB,CAAC,4BAAlC,eAAgB,CAA+C,kBAAkB,kBAAkB,CAAC,iBAAiB,kCAAkC,yBAAyB,CAAC,QAAQ,eAAe,YAAY,iBAAiB,QAAQ,UAAU,+BAAoC,CAAC,iBAAiB,UAAU,CAAC,gBAAgB,SAAS,CAAC,cAAc,kBAAkB,UAAU,UAAU,gCAAqC,4BAAiC,wBAA6B,iBAAiB,QAAQ,uBAAuB,CAAC,wBAAwB,WAAW,CAAC,qBAAqB,QAAQ,CAAC,4BAA4B,SAAS,SAAS,CAAC,kCAAkC,cAAc,WAAW,YAAY,WAAW,iBAAiB,CAAC,oBAAoB,oBAAoB,CAAC,sCAAsC,cAAc,kBAAkB,UAAU,WAAW,YAAY,eAAe,oBAAoB,CAAC,wIAAwI,YAAY,WAAW,qBAAqB,kBAAkB,CAAC,gDAAgD,kBAAkB,kBAAkB,UAAU,WAAW,UAAU,SAAS,gBAAgB,SAAS,QAAQ,qBAAqB,uCAAuC,oCAAoC,kCAAkC,8BAA8B,CAAC,4DAA4D,WAAW,YAAY,oBAAoB,CAAC,0BAA0B,kBAAkB,SAAS,WAAW,eAAe,uCAAuC,mBAAmB,gBAAgB,gBAAgB,cAAc,UAAU,QAAQ,cAAc,CAAC,4EAA4E,uCAAuC,+BAA+B,WAAW,SAAS,CAAC,mCAAmC,UAAU,CAAC,kCAAkC,SAAS,CAAC,AAAyG,oPAAiK,qBAAqB,CAAC,YAAY,kBAAkB,UAAU,WAAW,UAAU,gBAAgB,mBAAmB,mBAAmB,QAAQ,CAAC","file":"fullpage.min.css","sourcesContent":["/*!\r\n * fullPage 3.0.3\r\n * https://github.com/alvarotrigo/fullPage.js\r\n *\r\n * @license GPLv3 for open source use only\r\n * or Fullpage Commercial License for commercial use\r\n * http://alvarotrigo.com/fullPage/pricing/\r\n *\r\n * Copyright (C) 2018 http://alvarotrigo.com/fullPage - A project by Alvaro Trigo\r\n */.fp-enabled body,html.fp-enabled{margin:0;padding:0;overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0)}.fp-section{position:relative;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.fp-slide{float:left}.fp-slide,.fp-slidesContainer{height:100%;display:block}.fp-slides{z-index:1;height:100%;overflow:hidden;position:relative;-webkit-transition:all .3s ease-out;transition:all .3s ease-out}.fp-section.fp-table,.fp-slide.fp-table{display:table;table-layout:fixed;width:100%}.fp-tableCell{display:table-cell;vertical-align:middle;width:100%;height:100%}.fp-slidesContainer{float:left;position:relative}.fp-controlArrow{-webkit-user-select:none;-moz-user-select:none;-khtml-user-select:none;-ms-user-select:none;position:absolute;z-index:4;top:50%;cursor:pointer;width:0;height:0;border-style:solid;margin-top:-38px;-webkit-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}.fp-controlArrow.fp-prev{left:15px;width:0;border-width:38.5px 34px 38.5px 0;border-color:transparent #fff transparent transparent}.fp-controlArrow.fp-next{right:15px;border-width:38.5px 0 38.5px 34px;border-color:transparent transparent transparent #fff}.fp-scrollable{overflow:hidden;position:relative}.fp-scroller{overflow:hidden}.iScrollIndicator{border:0!important}.fp-notransition{-webkit-transition:none!important;transition:none!important}#fp-nav{position:fixed;z-index:100;margin-top:-32px;top:50%;opacity:1;-webkit-transform:translate3d(0,0,0)}#fp-nav.fp-right{right:17px}#fp-nav.fp-left{left:17px}.fp-slidesNav{position:absolute;z-index:4;opacity:1;-webkit-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);transform:translate3d(0,0,0);left:0!important;right:0;margin:0 auto!important}.fp-slidesNav.fp-bottom{bottom:17px}.fp-slidesNav.fp-top{top:17px}#fp-nav ul,.fp-slidesNav ul{margin:0;padding:0}#fp-nav ul li,.fp-slidesNav ul li{display:block;width:14px;height:13px;margin:7px;position:relative}.fp-slidesNav ul li{display:inline-block}#fp-nav ul li a,.fp-slidesNav ul li a{display:block;position:relative;z-index:1;width:100%;height:100%;cursor:pointer;text-decoration:none}#fp-nav ul li a.active span,#fp-nav ul li:hover a.active span,.fp-slidesNav ul li a.active span,.fp-slidesNav ul li:hover a.active span{height:12px;width:12px;margin:-6px 0 0 -6px;border-radius:100%}#fp-nav ul li a span,.fp-slidesNav ul li a span{border-radius:50%;position:absolute;z-index:1;height:4px;width:4px;border:0;background:#333;left:50%;top:50%;margin:-2px 0 0 -2px;-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}#fp-nav ul li:hover a span,.fp-slidesNav ul li:hover a span{width:10px;height:10px;margin:-5px 0 0 -5px}#fp-nav ul li .fp-tooltip{position:absolute;top:-2px;color:#fff;font-size:14px;font-family:arial,helvetica,sans-serif;white-space:nowrap;max-width:220px;overflow:hidden;display:block;opacity:0;width:0;cursor:pointer}#fp-nav ul li:hover .fp-tooltip,#fp-nav.fp-show-active a.active+.fp-tooltip{-webkit-transition:opacity .2s ease-in;transition:opacity .2s ease-in;width:auto;opacity:1}#fp-nav ul li .fp-tooltip.fp-right{right:20px}#fp-nav ul li .fp-tooltip.fp-left{left:20px}.fp-auto-height .fp-slide,.fp-auto-height .fp-tableCell,.fp-auto-height.fp-section{height:auto!important}.fp-responsive .fp-auto-height-responsive .fp-slide,.fp-responsive .fp-auto-height-responsive .fp-tableCell,.fp-responsive .fp-auto-height-responsive.fp-section{height:auto!important}.fp-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}\r\n/*# sourceMappingURL=fullpage.min.css.map */\r\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(7);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(5)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var fullpage_js_dist_fullpage_extensions_min__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var fullpage_js_dist_fullpage_extensions_min__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fullpage_js_dist_fullpage_extensions_min__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var fullpage_js_dist_fullpage_min_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var fullpage_js_dist_fullpage_min_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(fullpage_js_dist_fullpage_min_css__WEBPACK_IMPORTED_MODULE_2__);
var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/* eslint-disable import/no-extraneous-dependencies *//* eslint-disable react/prop-types */// eslint-disable-line no-unused-vars
var isFunc=function isFunc(val){return typeof val==='function';};var fullpageCallbacks=['afterLoad','afterRender','afterResize','afterResponsive','afterSlideLoad','onLeave','onSlideLeave'];var ReactFullpage=function(_React$Component){_inherits(ReactFullpage,_React$Component);function ReactFullpage(props){_classCallCheck(this,ReactFullpage);var _this=_possibleConstructorReturn(this,(ReactFullpage.__proto__||Object.getPrototypeOf(ReactFullpage)).call(this,props));var render=_this.props.render;if(!isFunc(render)){throw new Error('must provide render prop to <ReactFullpage />');}_this.state={initialized:false};return _this;}_createClass(ReactFullpage,[{key:'componentDidMount',value:function componentDidMount(){var _props=this.props,$=_props.$,_props$v2compatible=_props.v2compatible,v2compatible=_props$v2compatible===undefined?false:_props$v2compatible;var opts=this.buildOptions();if(v2compatible){if(!$||$ instanceof window.jQuery===false){throw new Error('Must provide $ (jQuery) as a prop if using v2 API');}$(document).ready(function(){// eslint-disable-line
$('#fullpage').fullpage(opts);});}else if(fullpage_js_dist_fullpage_extensions_min__WEBPACK_IMPORTED_MODULE_1___default.a){this.init(opts);this.markInitialized();}}},{key:'componentDidUpdate',value:function componentDidUpdate(prevProps,prevState){if(prevState.initialized===this.state.initialized){return;}var props=this.props,fpUtils=this.fpUtils;var slideSelector=props.slideSelector||'.slide';var sectionSelector=props.sectionSelector||'.section';var activeSection=document.querySelector(sectionSelector+'.active');var activeSectionIndex=activeSection?fpUtils.index(activeSection):-1;var activeSlide=document.querySelector(sectionSelector+'.active'+slideSelector+'.active');var activeSlideIndex=activeSlide?fpUtils.index(activeSlide):-1;this.destroy();if(activeSectionIndex>-1){fpUtils.addClass(document.querySelectorAll(sectionSelector)[activeSectionIndex],'active');}if(activeSlideIndex>-1){fpUtils.addClass(activeSlide,'active');}this.init(this.buildOptions());}},{key:'componentWillUnmount',value:function componentWillUnmount(){this.destroy();}},{key:'init',value:function init(opts){new fullpage_js_dist_fullpage_extensions_min__WEBPACK_IMPORTED_MODULE_1___default.a('#fullpage',opts);// eslint-disable-line
this.fullpageApi=window.fullpage_api;this.fpUtils=window.fp_utils;this.fpEasings=window.fp_easings;}},{key:'destroy',value:function destroy(){// NOTE: need to check for init to support SSR
if(!this.state.initialized)return;this.fullpageApi.destroy('all');}},{key:'markInitialized',value:function markInitialized(){this.setState({initialized:true});}},{key:'buildOptions',value:function buildOptions(){var _this2=this;var filterCb=function filterCb(key){return!!Object.keys(_this2.props).find(function(cb){return cb===key;});};var registered=fullpageCallbacks.filter(filterCb);var listeners=registered.reduce(function(result,key){var agg=_extends({},result);agg[key]=function(){for(var _len=arguments.length,args=Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}var newArgs=[key].concat(args);_this2.update.apply(_this2,_toConsumableArray(newArgs));};return agg;},{});return _extends({},this.props,listeners);}},{key:'update',value:function update(lastEvent){var _this3=this;for(var _len2=arguments.length,args=Array(_len2>1?_len2-1:0),_key2=1;_key2<_len2;_key2++){args[_key2-1]=arguments[_key2];}var _props$v2compatible2=this.props.v2compatible,v2compatible=_props$v2compatible2===undefined?false:_props$v2compatible2;var state=_extends({},this.state);var makeState=function makeState(callbackParameters){return _extends({},state,callbackParameters,{lastEvent:lastEvent});};var fromArgs=function fromArgs(argList){return argList.reduce(function(result,key,i){var value=args[i];result[key]=value;// eslint-disable-line
return result;},{});};// TODO: change all fromArgs to constants After-*
if(v2compatible){// NOTE: remapping callback args for v2
// https://github.com/alvarotrigo/fullPage.js#callbacks
switch(lastEvent){// After-*
case'afterLoad':state=makeState(fromArgs(['anchorLink','index']));break;case'afterResponsive':state=makeState(fromArgs(['isResponsive']));break;case'afterSlideLoad':state=makeState(fromArgs(['anchorLink','index','slideAnchor','slideIndex']));break;// On-*
case'onLeave':state=makeState(fromArgs(['index','nextIndex','direction']));break;case'onSlideLeave':state=makeState(fromArgs(['anchorLink','index','slideIndex','direction','nextSlideIndex']));break;default:break;}}else{// NOTE: remapping callback args to v3
// https://github.com/alvarotrigo/fullPage.js#callbacks
switch(lastEvent){// After-*
case'afterLoad':state=makeState(fromArgs(['origin','destination','direction']));break;// TODO: update accoding to new API
case'afterResize':state=makeState(fromArgs(['']));break;case'afterResponsive':state=makeState(fromArgs(['isResponsive']));break;case'afterSlideLoad':state=makeState(fromArgs(['section','origin','destination','direction']));break;// On-*
case'onLeave':state=makeState(fromArgs(['origin','destination','direction']));break;case'onSlideLeave':state=makeState(fromArgs(['section','origin','slideIndex','destination','direction']));break;default:break;}}this.setState(state,function(){var _props2;(_props2=_this3.props)[lastEvent].apply(_props2,args);});}},{key:'render',value:function render(){return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement('div',{id:'fullpage'},this.state.initialized?this.props.render(this):react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement('div',{className:'section'}));}}]);return ReactFullpage;}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);/* harmony default export */ __webpack_exports__["default"] = (ReactFullpage);

/***/ })
/******/ ]);
});
