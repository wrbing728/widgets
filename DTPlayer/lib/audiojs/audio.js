(function(audiojs, audiojsInstance, container) {
  // Use the path to the audio.js file to create relative paths to the swf and player graphics
  // Remember that some systems (e.g. ruby on rails) append strings like '?1301478336' to asset paths
  var path = (function() {
    var re = new RegExp('audio(\.min)?\.js.*'),
        scripts = $('script');
    for (var i = 0, ii = scripts.length; i < ii; i++) {
      var path = scripts.eq(i).attr('src');
      if(re.test(path)) {
        return path.replace(re, '');
      }
    }
  })();

  // ##The audiojs interface
  // This is the global object which provides an interface for creating new `audiojs` instances.
  // It also stores all of the construction helper methods and variables.
  container.audiojs = {
    instanceCount: 0,
    instances: {},
    // `$1` The name of the flash movie  
    // `$2` The path to the swf  
    // `$3` Cache invalidation  
    flashSource: '\
      <object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" id="$1" width="1" height="1" name="$1" style="position: absolute; left: -1px;"> \
        <param name="movie" value="$2?playerInstance='+audiojs+'.instances[\'$1\']&datetime=$3"> \
        <param name="allowscriptaccess" value="always"> \
        <embed name="$1" src="$2?playerInstance='+audiojs+'.instances[\'$1\']&datetime=$3" width="1" height="1" allowscriptaccess="always"> \
      </object>',

    settings: {
      autoplay: false,
      loop: false,
      preload: true,
      imageLocation: path + 'player-graphics.gif',
      swfLocation: path + 'audiojs.swf',
      useFlash: (function() {
        var a = document.createElement('audio');
        return !(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
      })(),
      hasFlash: (function() {
        if (navigator.plugins && navigator.plugins.length && navigator.plugins['Shockwave Flash']) {
          return true;
        } else if (navigator.mimeTypes && navigator.mimeTypes.length) {
          var mimeType = navigator.mimeTypes['application/x-shockwave-flash'];
          return mimeType && mimeType.enabledPlugin;
        } else {
          try {
            var ax = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            return true;
          } catch (e) {}
        }
        return false;
      })(),
      // The default markup and classes for creating the player:
      createPlayer: {
        markup: '<div class="nouislider"></div>\
                  <div class="play-pause">\
                  <p class="play"></p>\
                  <p class="pause"></p>\
                </div>\
                <div class="time test">\
                  <strong class="current-time">00:00</strong>/<strong class="duration"></strong>\
                </div>',
        playPauseClass: '.play-pause',
        progressClass: '.progress',
        loaderClass: '.loaded',
        timeClass: '.time',
        durationClass: '.duration',
        playedClass: '.played',
        errorMessageClass: '.error-message',
        playingClass: '.playing',
        loadingClass: '.loading',
        errorClass: '.error'
      },
      // The css used by the default player. This is is dynamically injected into a `<style>` tag in the top of the head.
      css: '',
      // The default event callbacks:
      trackEnded: function(e) {},
      flashError: function() {
        var player = this.settings.createPlayer,
            errorMessage = $(player.errorMessageClass);
            html = 'Missing <a href="http://get.adobe.com/flashplayer/">flash player</a> plugin.';
        if (this.mp3) html += ' <a href="'+this.mp3+'">Download audio file</a>.';
        this.wrapper.removeClass(player.loadingClass);
        this.wrapper.addClass(player.errorClass);
        errorMessage.html(html);
      },
      loadError: function(e) {
        var player = this.settings.createPlayer,
            errorMessage = $(player.errorMessageClass);
        this.wrapper.removeClass(player.loadingClass);
        this.wrapper.addClass(player.errorClass);
        errorMessage.html('Error loading: "'+this.mp3+'"');
      },
      init: function() {
        var player = this.settings.createPlayer;
        this.wrapper.addClass(player.loadingClass);
      },
      loadStarted: function() {
        var player = this.settings.createPlayer,
            duration = $(player.durationClass),
            m = Math.floor(this.duration / 60),
            s = Math.floor(this.duration % 60);
        this.wrapper.removeClass(player.loadingClass);
        duration.html((m<10?'0':'')+m+':'+(s<10?'0':'')+s);
      },
      // loadProgress: function(percent) {
      //   var player = this.settings.createPlayer,
      //       loaded = $(player.loaderClass);
      //   loaded[0].style.width = (100 * percent) + '%';
      // },
      playPause: function() {
        this.playing ? this.settings.play() : this.settings.pause();
      },
      play: function() {
        var player = this.settings.createPlayer;
        this.wrapper.addClass(player.playingClass);
      },
      pause: function() {
        var player = this.settings.createPlayer;
        this.wrapper.removeClass(player.playingClass);
      },
      updatePlayhead: function(percent) {
        var player = this.settings.createPlayer,
            played = $(player.playedClass),
            p = this.duration * percent,
            m = Math.floor(p / 60),
            s = Math.floor(p % 60);
        played.html((m<10?'0':'')+m+':'+(s<10?'0':'')+s);
      }
    },

    // If an array is passed then it calls back to `createAll()`.  
    // Otherwise, it creates a single instance and returns it.  
    create: function(element, options) {
      var options = options || {}
      if (element.length) {
        var ele = this.createAll(options, element)
        return this.createAll(options, element);
      } else {
        return this.newInstance(element, options);
      }
    },

    createAll: function(options, elements) {
      var audioElements = elements || $('audio'),
          instances = []
          options = options || {};
      for (var i = 0, ii = audioElements.length; i < ii; i++) {
        instances.push(this.newInstance(audioElements.eq(i), options));
      }
      return instances;
    },

    // This goes through all the steps required to build out a usable `audiojs` instance.
    newInstance: function(element, options) {
      var element = element,
          s = this.helpers.clone(this.settings),
          id = 'audiojs'+this.instanceCount,
          wrapperId = 'audiojs_wrapper'+this.instanceCount,
          instanceCount = this.instanceCount++;
      if (element.attr('autoplay') != null) s.autoplay = true;
      if (element.attr('loop') != null) s.loop = true;
      if (element.attr('preload') == 'none') s.preload = false;

      // Merge the default settings with the user-defined `options`.
      if (options) this.helpers.merge(s, options); 

      // Inject the player html if required.
      if (s.createPlayer.markup) 
        element = this.createPlayer(element, s.createPlayer, wrapperId);
      else 
        element.parent().attr('id', wrapperId);

      // Return a new `audiojs` instance.
      var audio = new container[audiojsInstance](element, s);
      // If css has been passed in, dynamically inject it into the `<head>`.
      if (s.css) this.helpers.injectCss(audio, s.css);

      // If `<audio>` or mp3 playback isn't supported, insert the swf & attach the required events for it.
      if (s.useFlash && s.hasFlash) {
        this.injectFlash(audio, id);
        this.attachFlashEvents(audio.wrapper, audio);
      } else if (s.useFlash && !s.hasFlash) {
        this.settings.flashError.apply(audio);
      }

      // Attach event callbacks to the new audiojs instance.
      if (!s.useFlash || (s.useFlash && s.hasFlash)) 
        this.attachEvents(audio.wrapper, audio);

      this.instances[id] = audio;
      return audio;
    },

    // Inject a wrapping div and the markup for the html player.
    createPlayer: function(element, player, id) {
      var wrapper = $('<div></div>'),
          newElement = element.clone();
      wrapper.attr('class', 'audiojs');
      wrapper.attr('className', 'audiojs');
      wrapper.attr('id', id);

      // Fix IE's broken implementation of `innerHTML` & `cloneNode` for HTML5 elements.
      if (newElement.prop('outerHTML') && !document.createElement('audio').canPlayType) {
        newElement = $(this.helpers.cloneHtml5Node(element));
        wrapper.html(player.markup); 
        wrapper.append(newElement);
        element.prop('outerHTML', wrapper.prop('outerHTML'));
        wrapper = $(id);
      } else {
        wrapper.append(newElement);
        wrapper.html(wrapper.html() + player.markup);
        element.parent().html(wrapper);
      }
      return wrapper.find('audio');
    },

    // Attaches useful event callbacks to an `audiojs` instance.
    attachEvents: function(wrapper, audio) {
      if (!audio.settings.createPlayer) return;
      var player = audio.settings.createPlayer,
          playPause = $(player.playPauseClass),
          leftPos = function(elem) {
            var curleft = 0;
            if (elem.offsetParent) {
              do { curleft += elem.offsetLeft; } while (elem = elem.offsetParent);
            }
            return curleft;
          };
      playPause.on('click', function(e) {
        audio.playPause.apply(audio);
      });
      

      // _If flash is being used, then the following handlers don't need to be registered._
      if (audio.settings.useFlash) return;

      // Start tracking the load progress of the track.
      // container[audiojs].events.trackLoadProgress(audio);

      // $(audio.element).on('timeupdate', function(e) {
      //   audio.updatePlayhead.apply(audio);
      // });

      $(audio.element).on('ended', function(e) {
        audio.trackEnded.apply(audio);
      });

      audio.source.on('error', function(e) {
        // on error, cancel any load timers that are running.
        clearInterval(audio.readyTimer);
        clearInterval(audio.loadTimer);
        audio.settings.loadError.apply(audio);
      });
    },

    // Flash requires a slightly different API to the `<audio>` element, so this method is used to overwrite the standard event handlers.
    attachFlashEvents: function(element, audio) {
      audio['swfReady'] = false;
      audio['load'] = function(mp3) {
        // If the swf isn't ready yet then just set `audio.mp3`. `init()` will load it in once the swf is ready.
        audio.mp3 = mp3;
        if (audio.swfReady) audio.element.load(mp3);
      }
      audio['loadProgress'] = function(percent, duration) {
        audio.loadedPercent = percent;
        audio.duration = duration;
        audio.settings.loadStarted.apply(audio);
        audio.settings.loadProgress.apply(audio, [percent]);
      }
      audio['skipTo'] = function(percent) {
        if (percent > audio.loadedPercent) return;
        audio.updatePlayhead.call(audio, [percent])
        audio.element.skipTo(percent);
      }
      audio['updatePlayhead'] = function(percent) {
        audio.settings.updatePlayhead.apply(audio, [percent]);
      }
      audio['play'] = function() {
        // If the audio hasn't started preloading, then start it now.  
        // Then set `preload` to `true`, so that any tracks loaded in subsequently are loaded straight away.
        if (!audio.settings.preload) {
          audio.settings.preload = true;
          audio.element.init(audio.mp3);
        }
        audio.playing = true;
        // IE doesn't allow a method named `play()` to be exposed through `ExternalInterface`, so lets go with `pplay()`.  
        // <http://dev.nuclearrooster.com/2008/07/27/externalinterfaceaddcallback-can-cause-ie-js-errors-with-certain-keyworkds/>
        audio.element.pplay();
        audio.settings.play.apply(audio);
      }
      audio['pause'] = function() {
        audio.playing = false;
        // Use `ppause()` for consistency with `pplay()`, even though it isn't really required.
        audio.element.ppause();
        audio.settings.pause.apply(audio);
      }
      audio['setVolume'] = function(v) {
        audio.element.setVolume(v);
      }
      audio['loadStarted'] = function() {
        // Load the mp3 specified by the audio element into the swf.
        audio.swfReady = true;
        if (audio.settings.preload) audio.element.init(audio.mp3);
        if (audio.settings.autoplay) audio.play.apply(audio);
      }
    },

    // ### Injecting an swf from a string
    // Build up the swf source by replacing the `$keys` and then inject the markup into the page.
    injectFlash: function(audio, id) {
      var flashSource = this.flashSource.replace(/\$1/g, id);
      flashSource = flashSource.replace(/\$2/g, audio.settings.swfLocation);
      // `(+new Date)` ensures the swf is not pulled out of cache. The fixes an issue with Firefox running multiple players on the same page.
      flashSource = flashSource.replace(/\$3/g, (+new Date + Math.random()));
      // Inject the player markup using a more verbose `innerHTML` insertion technique that works with IE.
      var html = audio.wrapper.innerHTML,
          div = document.createElement('div');
      div.innerHTML = flashSource + html;
      audio.wrapper.innerHTML = div.innerHTML;
      audio.element = this.helpers.getSwf(id);
    },

    helpers: {
      // **Merge two objects, with `obj2` overwriting `obj1`**  
      // The merge is shallow, but that's all that is required for our purposes.
      merge: function(obj1, obj2) {
        for (attr in obj2) {
          if (obj1.hasOwnProperty(attr) || obj2.hasOwnProperty(attr)) {
            obj1[attr] = obj2[attr];
          }
        }
      },
      // **Clone a javascript object (recursively)**
      clone: function(obj){
        if (obj == null || typeof(obj) !== 'object') return obj;
        var temp = new obj.constructor();
        for (var key in obj) temp[key] = arguments.callee(obj[key]);
        return temp;
      },
      // **Dynamic CSS injection**  
      // Takes a string of css, inserts it into a `<style>`, then injects it in at the very top of the `<head>`. This ensures any user-defined styles will take precedence.
      injectCss: function(audio, string) {

        // If an `audiojs` `<style>` tag already exists, then append to it rather than creating a whole new `<style>`.
        var prepend = '',
            styles = $('style'),
            css = string.replace(/\$1/g, audio.settings.imageLocation);

        for (var i = 0, ii = styles.length; i < ii; i++) {
          var title = styles[i].attr('title');
          if (title && ~title.indexOf('audiojs')) {
            style = styles[i];
            if (style.html() === css) return;
            prepend = style.html();
            break;
          }
        };

        var head = $('head')[0],
            firstchild = head.first(),
            style = $('<style></style>');

        if (!head) return;

        style.attr('type', 'text/css');
        style.attr('title', 'audiojs');

        if (style.styleSheet) style.styleSheet.cssText = prepend + css;
        else style.text(prepend + css);

        if (firstchild) head.prepend(style);
        else head.append(styleElement);
      },
      // **Handle all the IE6+7 requirements for cloning `<audio>` nodes**  
      // Create a html5-safe document fragment by injecting an `<audio>` element into the document fragment.
      cloneHtml5Node: function(audioTag) {
        var fragment = document.createDocumentFragment(),
            doc = fragment.createElement ? fragment : document;
        doc.createElement('audio');
        var div = doc.createElement('div');
        fragment.appendChild(div);
        div.innerHTML = audioTag.outerHTML;
        return div.firstChild;
      },
      // **Cross-browser `<object>` / `<embed>` element selection**
      getSwf: function(name) {
        var swf = document[name] || window[name];
        return swf.length > 1 ? swf[swf.length - 1] : swf;
      }
    },

    events: {
      trackLoadProgress: function(audio) {
        // If `preload` has been set to `none`, then we don't want to start loading the track yet.
        if (!audio.settings.preload) return;

        var readyTimer,
            loadTimer,
            audio = audio,
            ios = (/(ipod|iphone|ipad)/i).test(navigator.userAgent);

        // Use timers here rather than the official `progress` event, as Chrome has issues calling `progress` when loading mp3 files from cache.
        readyTimer = setInterval(function() {
          if (audio.element.readyState > -1) {
            // iOS doesn't start preloading the mp3 until the user interacts manually, so this stops the loader being displayed prematurely.
            if (!ios) audio.init.apply(audio);
          }
          if (audio.element.readyState > 1) {
            if (audio.settings.autoplay) audio.play.apply(audio);
            clearInterval(readyTimer);
            // Once we have data, start tracking the load progress.
            loadTimer = setInterval(function() {
              audio.loadProgress.apply(audio);
              if (audio.loadedPercent >= 1) clearInterval(loadTimer);
            }, 200);
          }
        }, 200);
        audio.readyTimer = readyTimer;
        audio.loadTimer = loadTimer;
      },
      // **Douglas Crockford's IE6 memory leak fix**  
      // <http://javascript.crockford.com/memory/leak.html>  
      // This is used to release the memory leak created by the circular references created when fixing `this` scoping for IE. It is called on page unload.
      purge: function(d) {
        var a = d.attributes, i;
        if (a) {
          for (i = 0; i < a.length; i += 1) {
            if (typeof d[a[i].name] === 'function') d[a[i].name] = null;
          }
        }
        a = d.childNodes;
        if (a) {
          for (i = 0; i < a.length; i += 1) purge(d.childNodes[i]);
        }
      }
    }
  }

  // We create one of these per `<audio>` and then push them into `audiojs['instances']`.
  container.audiojsInstance = function(element, settings) {
    this.element = element[0];
    this.wrapper = element.parent();
    this.source = element.find('source')[0] || element;
    // First check the `<audio>` element directly for a src and if one is not found, look for a `<source>` element.
    this.mp3 = (function(element) {
      var source = element.find('source')[0];
      return element.attr('src') || (source ? source.attr('src') : null);
    })(element);
    this.settings = settings;
    this.loadStartedCalled = false;
    this.loadedPercent = 0;
    this.duration = 1;
    this.playing = false;
  }

  container.audiojsInstance.prototype = {
    // API access events:
    // Each of these do what they need do and then call the matching methods defined in the settings object.
    updatePlayhead: function() {
      var percent = this.element.currentTime / this.duration;
      this.settings.updatePlayhead.apply(this, [percent]);
    },
    skipTo: function(percent) {
      if (percent > this.loadedPercent) return;
      this.element.currentTime = this.duration * percent;
      this.updatePlayhead();
    },
    load: function(mp3) {
      this.loadStartedCalled = false;
      this.source.attr('src', mp3);
      // The now outdated `load()` method is required for Safari 4
      this.element.load();
      this.mp3 = mp3;
      // container[audiojs].events.trackLoadProgress(this);
    },
    loadError: function() {
      this.settings.loadError.apply(this);
    },
    init: function() {
      this.settings.init.apply(this);
    },
    loadStarted: function() {
      // Wait until `element.duration` exists before setting up the audio player.
      if (!this.element.duration) return false;

      this.duration = this.element.duration;
      this.updatePlayhead();
      this.settings.loadStarted.apply(this);
    },
    // loadProgress: function() {
    //   if (this.element.buffered != null && this.element.buffered.length) {
    //     // Ensure `loadStarted()` is only called once.
    //     if (!this.loadStartedCalled) {
    //       this.loadStartedCalled = this.loadStarted();
    //     }
    //     var durationLoaded = this.element.buffered.end(this.element.buffered.length - 1);
    //     this.loadedPercent = durationLoaded / this.duration;

    //     this.settings.loadProgress.apply(this, [this.loadedPercent]);
    //   }
    // },
    playPause: function() {
      if (this.playing) this.pause();
      else this.play();
    },
    play: function() {
      var ios = (/(ipod|iphone|ipad)/i).test(navigator.userAgent);
      // On iOS this interaction will trigger loading the mp3, so run `init()`.
      if (ios && this.element.readyState == 0) this.init.apply(this);
      // If the audio hasn't started preloading, then start it now.  
      // Then set `preload` to `true`, so that any tracks loaded in subsequently are loaded straight away.
      if (!this.settings.preload) {
        this.settings.preload = true;
        this.element.setAttribute('preload', 'auto');
        // container[audiojs].events.trackLoadProgress(this);
      }
      this.playing = true;
      this.element.play();
      this.settings.play.apply(this);
    },
    pause: function() {
      this.playing = false;
      this.element.pause();
      this.settings.pause.apply(this);
    },
    setVolume: function(v) {
      this.element.volume = v;
    },
    trackEnded: function(e) {
      this.skipTo.apply(this, [0]);
      if (!this.settings.loop) this.pause.apply(this);
      this.settings.trackEnded.apply(this);
    }
  }
})('audiojs', 'audiojsInstance', this);