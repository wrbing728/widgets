/**
 * 弹层-wangrubing 
 *      $('#modal-test').dtModal({
 *          width: 400,   // 弹层宽度
 *          blankClickOff: false,   // 是否允许点击空白处关闭弹层
 *          dismissCallback: function() {}   // 关闭回调 
 *          confirmCallback: function() {}   // 确认回调
 *      });
 * @return { open(), close() }
 */
$(function() {
    $.fn.dtModal = function(options) {
        var $modal = this,
            curModal,
            defaults = {
                width: 600,
                blankClickOff: false,
                dismissCallback: null,
                confirmCallback: null
            };
        options = $.extend({}, defaults, options);

        var dtModal = {
            modal: $modal,
            settings: options,
            isOpen: false,
            open: function() {
                this.modal.css({
                    "width": options.width,
                    "margin-left": -1*options.width/2
                })
                $('body').append('<div class="modal-mask"></div>');
                this.modal.addClass('in');
                curModal = this.modal;
                this.settings.blankClickOff && this.blankClickOff();
                this.isOpen = true;
            },
            close: function() {
                this.modal.removeClass('in');
                $('.modal-mask').remove();
                this.isOpen = false;
            },
            blankClickOff: function() {
                var self = this;
                $(document).one('click', '.modal-mask', function(e) {
                    // var $target = $(e.target);
                    // console.log(e.target);
                    // if (!$target.is(self.modal) && !self.modal.has($target).length && self.isOpen) {
                    //     self.close();
                    // }
                    self.close();
                });
            }
        };

        $modal.find('[data-operate]').on('click', function() {
            var $this = $(this);

            if ($this.data('operate') == 'dismiss') {
                if (!options.dismissCallback) {
                    dtModal.close();
                } else {
                    options.dismissCallback();
                }
            }

            if ($this.data('operate') == 'confirm') {
                if (!options.confirmCallback) {
                    dtModal.close();
                } else {
                    options.confirmCallback();
                }
            }
        });

        return dtModal;
    }
});