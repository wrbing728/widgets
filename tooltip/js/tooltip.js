/**
 * tooltip  by wangrubing
 * div: data-tooltip-title
 * $(selector).tooltip({
 *     placement: 'top' [bottom, left, right]
 * })
 */
(function($) {
    $.fn.tooltip = function(options) {
        var defaults = {
            placement: 'bottom'
        }
        var instance = [];
        options = $.extend({}, defaults, options);
        
        this.on('mouseenter', function() {
            var $this = $(this),
                top = $this.offset().top,
                left = $this.offset().left,
                width = $this.outerWidth(),
                height = $this.outerHeight(),
                box = $('<div class="tooltip-box"></div>'),
                positionHash = {
                    top: 'tri-angle-top',
                    left: 'tri-angle-left',
                    bottom: 'tri-angle-bottom',
                    right: 'tri-angle-right'
                },
                html = '<div class="'+ positionHash[options.placement] +'"></div><div class="title">'+ $this.data('tooltip-title') +'</div>';
            box.html(html);
            $this.after(box);

            switch(options.placement) {
                case 'top':
                    top += height + 6;
                    left += width/5;
                    break;
                case 'bottom':
                    top -= box.height() + 6;
                    left -= width/5;
                    break;
                case 'left':
                    left += width + 6;
                    break;
                case 'right':
                    left -= box.width() + 6;
                    break;
                default: break;
            }
            box.css({
                top: top,
                left: left                      
            });
            box.fadeIn(300);
        }).on('mouseleave', function() {
            $(this).next().fadeOut(300, function() {
                $(this).remove();
            });
        })
    }
})(jQuery);