$(function() {
    var $placeholder = $('[data-placeholder]');

    $placeholder.wrap('<div class="ipt clearfix"></div>').each(function() {
        var $this = $(this),
            options = JSON.parse($this.data('placeholder').replace(/\'/g, '\"')),
            phText = options.text,
            phType = options.type,
            $span = $('<span class="ph-text"></span>').text(phText);

            $this.after($span);

            if (phType == 'inputWithIcon') {
                $span.addClass('ph-for-login');
            } else if (phType == 'textarea') {
                $span.addClass('ph-for-textarea');
            }
            if ($.trim($this.val()).length) {
                $this.siblings('span').hide();
            }

    }).on('change', function() {
        var $this = $(this);
        if ($.trim($this.val()).length) {
            $this.siblings('span').hide();
        } else {
            $this.siblings('span').show();
        }
    }).on('focus', function() {
        var $this = $(this);
        $this.siblings('span').hide();
    }).on('blur', function() {
        var $this = $(this);
        if ($.trim($this.val()).length) {
            $this.siblings('span').hide();
        } else {
            $this.val('');
            $this.siblings('span').show();
        }
    }).siblings('span').on('click', function() {
        var $this = $(this);
        $this.hide().siblings('[data-placeholder]').focus();
    });
});


