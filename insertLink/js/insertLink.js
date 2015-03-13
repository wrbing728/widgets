/**
 * 输入框插入链接
 * button: data-insert="link" data-insert-target="idOfDiv"
 * editablediv: id="idOfDiv"
 */
(function(global) {
    var insertLink = {
        $btnAddLink: $('[data-insert="link"]'),
        targetEditor: null,
        editor: null,
        init: function($eles) {
            this.editor = $eles;
            this.attachEvents();
        },
        attachEvents: function() {
            var self = this;
            // 记录需要插入链接的当前输入框
            self.$btnAddLink.on('click', function() {
                var $this = $(this),
                    targetId = $this.data('insert-target')
                self.targetEditor = $(targetId);
            });

            // 插入链接表单验证
            $(document).on('click', '#sure-add-link', function() {
                var $this = $(this),
                    $form = $('#add-link-form'),
                    canSubmit = true,
                    link = [];

                $form.find('input').each(function(i) {
                    var $that = $(this);
                    if ($.trim($that.val()).length) {
                        canSubmit = canSubmit && true;
                        link[i] = $that.val();
                    } else {
                        canSubmit = canSubmit && false;
                    }
                });
                if (canSubmit) {
                    self.insert(link);
                    $('#insert-link').modal('hide');
                }
            });

            // 清空插入链接表单
            $('#insert-link').on('hidden.bs.modal', function(e) {
                var $form = $('#add-link-form');
                $form.find('input').each(function() {
                    $(this).val('');
                });
            });

            // 过滤标签
            self.editor.on('paste', function(e) {
                var $this = $(this),
                    oldContent = $this.html(),
                    $oldLink = $this.find('a'),
                    linkTextHash = {},
                    regArr = [];
                for (var i = 0; i < $oldLink.length; i++) {
                    linkTextHash[$oldLink[i].innerText] = $oldLink[i].outerHTML;
                    regArr.push($oldLink[i].innerText);
                }
                setTimeout(function() {
                    var newContent = $this.html(),
                        reg;
                    newContent = newContent.replace(/<[^>]*>/g, '');
                    for (var i = 0; i < regArr.length; i++) {
                        newContent = newContent.replace(eval('/' + regArr[i] + '/g'), linkTextHash[regArr[i]])
                    }
                    $this.html(newContent);
                }, 100);
            });
        },
        insert: function(link) {
            this.targetEditor.append('<a href="' + link[1] + '" style="text-decoration: underline;" name="' + link[1] + '">' + link[0] + '</a>');
        }
    }
    
    global.insertLink = insertLink;
})(window);