/*
*   copyright @wangrubing
*/
(function(global) {
    var playMutex = true,
        barWidth

    global.DTPlayer = {
        options: {
            bar: {
                className: '.nouislider',
                backgroundColor: '#fff',
                frontColor: '#ff4200',
                height: '5'
            },
            curTimeClass: false,
            durationClass: false,
            playPauseClass: false,
            playClass: false,
            pauseClass: false,
            loadingClass: false,
            errorMessageClass: false,
            playedProgress: function(percent) {
                if (playMutex) {
                    !!this.slider ? this.slider.val(percent * barWidth) : null;
                    this.wrapper.find('.load-track').css('left', percent*100 + '%');
                }
            },
            loadedProgress: function(percent) {
                var loadTrack = this.wrapper.find('.load-track');
                loadTrack.css('right', (1 - percent)*100 + '%');
            },
            loadError: function() {
                var $this = $(this.audio);
                global.DTPlayer.options.bar ? this.wrapper.find(global.DTPlayer.options.bar.className).hide() : null;
                
                if (!!global.DTPlayer.options.errorMessageClass) {
                    this.wrapper.find(global.DTPlayer.options.errorMessageClass).text('音频加载失败');
                }
            },
            buffering: function(isBuffering) {},
            end: function() {}
        },
        createPlayer: function(element, options) {
            var self = this,
                instances = {};

            this.options = $.extend({}, this.options, options);

            // 创建实例 
            for (var i = 0; i < element.length; i++) {
                if (element.eq(i).parent().hasClass('DTPlayer')) {
                    instances[element.eq(i).attr('id')] = this.newInstance(element[i]);
                }
            }

            return instances;
        },
        newInstance: function(element) {
            var audioInstance = new global.audioInstance(element);
            this.attachEvent(audioInstance);
            if (!!this.options.bar) {
                this.renderBar(audioInstance);
            }
            return audioInstance;
        },
        renderBar: function(audioInstance) {
            var bar  = this.options.bar,
                backgroundColor = bar.backgroundColor,
                frontColor = bar.frontColor,
                height = bar.height;
            $('.DTPlayer .noUi-connect').css({
                'background-color': frontColor,
                'height': height + 'px'
            });

            audioInstance.wrapper.find('.noUi-base').append($('<div class="noUi-origin load-track"></div>'));

            $('.DTPlayer .noUi-background').css('background-color', backgroundColor);
        },
        init: function() {
            var self = this,
                $audio = $(this.audio),
                $duration = !!global.DTPlayer.options.durationClass ? this.wrapper.find(global.DTPlayer.options.durationClass) : null,
                durationStr;

            this.isPlaying = false;
            this.currentTime = 0;
            this.slider.val(0);

            // 加载duration 
            if ($(this.audio).data('duration')) {
                this.duration = $(this.audio).data('duration');
                durationStr = global.DTPlayer.formatTime(this.duration);
                if (!!$duration) {
                    $duration.text(durationStr);
                }
                global.DTPlayer.trackLoadProgress.apply(this);
            } else {
                $audio.on('loadedmetadata', function() {
                    self.duration = self.audio.duration;
                    durationStr = global.DTPlayer.formatTime(self.duration);
                    if (!!$duration) {
                        $duration.text(durationStr);
                    }
                    global.DTPlayer.trackLoadProgress.apply(self);
                });
            }
        },
        attachEvent: function(audioInstance) {
            var self = this,
                $audio  = $(audioInstance.audio);
            var $playerBar = !!this.options.bar ? audioInstance.wrapper.find(this.options.bar.className) : null;
            
            this.init.apply(audioInstance);

            // 监听播放 
            $audio.on('timeupdate', function() {
                audioInstance.playedProgress();
            });

            // 资源错误 
            $audio.on('error', function(e) {
                audioInstance.loadError();
            });

            // 播放控制 
            $audio.on('play', function() {
                audioInstance.isPlaying = true;
            }).on('pause', function() {
                audioInstance.isPlaying = false;
            })

            // 资源缓冲 
            $audio.on('waiting', function() {
                audioInstance.isBuffering = true;
                audioInstance.buffering();
            }).on('playing', function() {
                audioInstance.isBuffering = false;
                audioInstance.buffering();
            });

            // 播放结束 
            $audio.on('ended', function() {
                audioInstance.end();
            });

            /* init playerbar */
                if (!!$playerBar) {
                    barWidth = $playerBar.width();
                    $playerBar.noUiSlider({
                        start: 0,
                        connect: 'lower',
                        range: {
                            'min': 0,
                            'max': barWidth
                        }
                    });
                    $playerBar.on({
                        slide: function(){
                            var $this = $(this),
                                percent = $this.val() / $this.width(),
                                parent = $this.closest('.DTPlayer'),
                                curTimeStr = self.formatTime(percent * audioInstance.duration);
                            if (!!self.options.curTimeClass) {
                                parent.find(self.options.curTimeClass).text(curTimeStr);
                            }
                            audioInstance.wrapper.find('.load-track').css('left', percent*100 + '%');
                            playMutex = false;
                        },
                        set: function() {
                            var $this = $(this),
                                percent = $this.val() / $this.width(),
                                parent = $this.closest('.DTPlayer'),
                                curTimeStr = self.formatTime(percent * audioInstance.duration);
                            if (!!self.options.curTimeClass) {
                                parent.find(self.options.curTimeClass).text(curTimeStr);
                            }
                            audioInstance.wrapper.find('.load-track').css('left', percent*100 + '%');
                        },
                        change: function(){
                            var $this = $(this),
                                parent = $this.closest('.DTPlayer'),
                                percent = $this.val() / $this.width();
                            playMutex = true;
                            audioInstance.audio.currentTime = percent * audioInstance.duration;
                            audioInstance.wrapper.find('.load-track').css('left', percent*100 + '%');
                        }
                    });
                }
            /* end */
        },
        formatTime: function(duration) {
            var t = duration,
                h = Math.floor(t / 3600),
                m = Math.floor(t % 3600 / 60),
                s = Math.floor(t % 60);
            if (h > 0) {
                return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + ( s < 10 ? '0' + s : s);
            } else {
                return (m < 10 ? '0' + m : m) + ':' + ( s < 10 ? '0' + s : s);
            }
        },
        trackLoadProgress: function() {
            var self = this,
                ios = (/(ipod|iphone|ipad)/i).test(navigator.userAgent);

            // Use timers here rather than the official `progress` event, as Chrome has issues calling `progress` when loading mp3 files from cache.
            self.readyTimer = setInterval(function() {
                if (self.audio.readyState > -1) {
                    // iOS doesn't start preloading the mp3 until the user interacts manually, so this stops the loader being displayed prematurely.
                    if (!ios) {

                    }
                }
                if (self.audio.readyState > 1) {
                    clearInterval(self.readyTimer);
                    // Once we have data, start tracking the load progress.
                    self.loadTimer = setInterval(function() {
                        self.loadedProgress();
                        if (self.loadedPercent >= 1) {
                            clearInterval(self.loadTimer);
                        }
                    }, 200);
                }
            }, 200);
        }
    };

    global.audioInstance = function(element) {
        this.audio = element;
        this.wrapper = $(element).closest('.DTPlayer');
        this.slider = global.DTPlayer.options.bar ? this.wrapper.find(global.DTPlayer.options.bar.className) : null;
        this.duration = element.duration;
        this.currentTime = element.currentTime;
        this.loadedPercent = 0;
        this.isPlaying = false;
        this.isBuffering = false;
        this.readyTimer = null;
        this.loadTimer = null;
    };

    global.audioInstance.prototype = {
        play: function() {
            var audio = $(this.audio);
            if (audio.parent().find('.error-control').length) {
                return false;
            }
            this.audio.play();
        },
        pause: function() {
            var audio = $(this.audio);
            if (audio.parent().find('.error-control').length) {
                return false;
            }
            this.audio.pause();
        },
        loadError: function() {
            clearInterval(this.readyTimer);
            clearInterval(this.loadTimer);
            $(this.audio).closest('.DTPlayer')
                        .find(global.DTPlayer.options.playPauseClass)
                        .addClass('error-control');
            global.DTPlayer.options.loadError.apply(this);
        },
        buffering: function() {
            global.DTPlayer.options.buffering.apply(this, [this.isBuffering]);
        },
        playedProgress: function() {
            var percent = this.audio.currentTime / this.audio.duration;
            this.currentTime = this.audio.currentTime;
            global.DTPlayer.options.playedProgress.apply(this, [percent]);
        },
        loadedProgress: function() {

            if (this.audio.buffered != null && this.audio.buffered.length) {
                
                var durationLoaded = this.audio.buffered.end(this.audio.buffered.length - 1);
                durationLoaded = durationLoaded <= this.duration ? durationLoaded : this.duration
                this.loadedPercent = durationLoaded / this.duration;
                global.DTPlayer.options.loadedProgress.apply(this, [this.loadedPercent]);
            }
        },
        changeSrc: function(src, callback) {
            this.audio.src = src;
            this.audio.load();
            this.audio.pause();
            global.DTPlayer.init.apply(this);
            callback ? callback() : null;
        },
        end: function() {
            global.DTPlayer.options.end.apply(this);
        }
    }


})(window);