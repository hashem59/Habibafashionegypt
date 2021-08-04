(function($){

    'use strict';

    theme.Parallax = function() {

        function Parallax() {
            this.load();
        };
    
        Parallax.prototype = $.extend({}, Parallax.prototype, {
            load: function () {
                $.widget( 'ui.parallax', {
                    options: {
                        factor: 0,
                        direction: 'to_top'
                    },
                    params: {},
                    _create: function() {
                        var _ = this;

                        this._setOption('direction', this.element.attr('data-direction'));
    
                        this.$image = this.element.find('[data-parallax-image]');
                        this.image_aspect_ratio = this.$image.attr('data-aspect-ratio');
    
                        $window.on('theme.resize.parallax', function () {
                            _.calculateSize();
                            _.calculateScroll();
                        });
                        $window.on('scroll.parallax', function () {
                            _.calculateScroll();
                        });
    
                        this.calculateSize();
                        this.calculateScroll();

                        this.element.addClass('parallax--init');
                    },
                    calculateSize: function() {
                        this.container_w = this.element.width();
                        this.container_h = this.element.height();
                        this.image_h = this.container_w / this.image_aspect_ratio;
                        this.image_stroke = this.image_h - this.container_h;
                        this.factor_body = this.image_h / 100 * this.options.factor;
                        this.scroll_stroke = window.innerHeight + this.container_h;
                        this.image_scroll_ratio = (this.image_stroke + this.factor_body * 2) / this.scroll_stroke;
                    },
                    calculateScroll: function() {
                        var container_pos,
                            set_t;
    
                        if(this.image_stroke > 0) {
                            this.element.addClass('parallax--moved-image');
    
                            container_pos = this.element.get(0).getBoundingClientRect();
                            set_t = container_pos.bottom * this.image_scroll_ratio;
    
                            if(this.options.direction === 'to_top') {
                                set_t = this.image_stroke - set_t;
                            }
    
                            if(container_pos.bottom >= this.factor_body && container_pos.bottom <= this.scroll_stroke - this.factor_body) {
                                this.$image.css({
                                    transform: 'translateY(' + (set_t * -1 + this.factor_body) + 'px)'
                                });
                            }
                        } else {
                            this.element.removeClass('parallax--moved-image');
    
                            this.$image.removeAttr('style');
                        }
                    },
                    _init: function () {
    
                    },
                    _setOption: function(key, value) {
                        $.Widget.prototype._setOption.apply(this, arguments);
                    },
                    destroy: function() {
                        $window.unbind('theme.resize.parallax scroll.parallax');
    
                        this.element.removeClass('parallax--init');
    
                        $.Widget.prototype.destroy.call(this);
                    }
                });

                this.init();
            },
            init: function($parallax) {
                $parallax = $parallax || $('.js-parallax').not('.parallax--init');

                $parallax.each(function () {
                    $(this).parallax();
                });
            },
            destroy: function ($parallax) {
                $parallax = $parallax || $('.js-parallax.parallax--init');

                $parallax.parallax('destroy');
            }
        });
    
        theme.Parallax = new Parallax;
    };
    
    $(function() {
        theme.Parallax();
    });
})(jQueryTheme);