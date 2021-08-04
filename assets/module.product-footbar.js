(function($){

    'use strict';

    theme.ProductFootbar = function() {

        function ProductFootbar() {
            this.settings = {
                height: 0
            };

            this.load();
        };
    
        ProductFootbar.prototype = $.extend({}, ProductFootbar.prototype, {
            duration: function () {
                return theme.animations.footbar_product.duration * 1000;
            },
            load: function() {
                var _ = this,
                    $footbar = $('.js-footbar-product'),
                    $spacer = $('.js-footer'),
                    $limit = $('[data-js-footbar-product-limit]');
    
                if($footbar.length && $limit.length) {
                    this.$footbar = $footbar;

                    $window.on('load theme.resize.productFootbar scroll.productFootbar', function () {
                        _._checkVisible($footbar, $limit, $spacer);
                    });
                }
            },
            _checkVisible: function ($footbar, $limit, $spacer) {
                var limit = $limit[0].getBoundingClientRect(),
                    topSpacing = theme.StickyHeader && theme.StickyHeader.$sticky ? theme.StickyHeader.$sticky.stickyHeader('getStickyHeight') : 0,
                    height = $footbar.innerHeight();
    
                if(limit.top < topSpacing && !$footbar.hasClass('show')) {
                    $footbar.addClass('show animate');
    
                    $footbar.velocity('stop', true);
    
                    $footbar.velocity('slideDown', {
                        duration: this.duration(),
                        begin: function () {
                            setTimeout(function () {
                                $footbar.addClass('visible');
                            }, 0);
                        },
                        complete: function () {
                            $footbar.removeAttr('style');
                        }
                    });

                    this.settings.height = $footbar.children().first().innerHeight();
                } else if(limit.top >= topSpacing && $footbar.hasClass('visible')) {
                    $footbar.velocity('stop', true);
    
                    $footbar.velocity('slideUp', {
                        duration: this.duration(),
                        begin: function () {
                            $footbar.removeClass('visible');
                        },
                        complete: function () {
                            $footbar.removeClass('show animate').removeAttr('style');
                        }
                    });

                    this.settings.height = 0;
                }
    
                if(height > 0) {
                    if(theme.current.is_mobile) {
                        $spacer.css({
                            paddingBottom: ''
                        });
    
                        $spacer.parent().css({
                            paddingBottom: height
                        });
                    } else {
                        $spacer.css({
                            paddingBottom: height
                        });
    
                        $spacer.parent().css({
                            paddingBottom: ''
                        });
                    }
                }


            },
            getFootbarHeight: function () {
                return this.settings.height;
            },
            destroy: function () {
                $window.unbind('theme.resize.productFootbar scroll.productFootbar');
            }
        });
    
        theme.ProductFootbar = new ProductFootbar;
    };
    
    $(function() {
        theme.ProductFootbar();
    });
})(jQueryTheme);