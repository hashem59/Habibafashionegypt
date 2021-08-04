(function($){

    'use strict';

    theme.CarouselProducts = (function() {

        function CarouselProducts(container) {
            this.$container = $(container);
    
            //var sectionId = this.$container.attr('data-section-id');
    
            this.settings = {
                arrows: true
            };
            
            this.namespace = '.carousel-products';
    
            this.onLoad();
        };
    
        CarouselProducts.prototype = $.extend({}, Section.prototype, CarouselProducts.prototype, {
            onLoad: function() {
                var _ = this,
                    $recommendations = this.$container.find('.product-recommendations'),
                    product_id,
                    limit;

                Loader.loadManually([
                    {type: 'styles', name: 'plugin_slick'},
                    {type: 'scripts', name: 'plugin_slick'}
                ],
                function() {
                    if($recommendations.length) {
                        product_id = $recommendations.attr('data-product-id');
                        limit = $recommendations.attr('data-limit');

                        $.ajax({
                            type: 'GET',
                            url: theme.routes.root_url + 'recommendations/products',
                            data: {
                                section_id: 'carousel-related-products',
                                product_id: product_id,
                                limit: limit
                            },
                            success: function (data) {
                                $recommendations.html($(data).find('.product-recommendations').html());

                                _.initCarousel();

                                theme.ImagesLazyLoad.update();
                                theme.ProductCurrency.update();
                                theme.ProductCountdown.init($recommendations.find('.js-countdown').removeClass('js-countdown--lazy'));
                                theme.ProductReview.update();
                                if (theme.Tooltip) {
                                    theme.Tooltip.init();
                                }
                            }
                        });
                    } else {
                        _.initCarousel();
                    }
                });
            },
            initCarousel: function () {
                var _ = this;

                this.$slick = this.$container.find('[data-js-carousel-slick]');

                if(this.$slick.length) {
                    this.$slider = this.$container.find('[data-js-carousel]');
                    this.$collections_ajax = this.$container.find('[data-carousel-ajax] [data-collection]');
                    this.$products = this.$container.find('[data-carousel-items]');
                    this.$slides = this.$slick.find('> *');
                    this.$prev = this.$slider.find('[data-js-carousel-prev]');
                    this.$next = this.$slider.find('[data-js-carousel-next]');
                    this.$control = this.$container.find('[data-carousel-control]');

                    this.settings.arrows = this.$slider.attr('data-arrows') === 'true' ? true : false;
                    this.settings.bullets = this.$slider.attr('data-bullets') === 'true' ? true : false;
                    this.settings.count = +this.$slider.attr('data-count');
                    this.settings.infinite = this.$slider.attr('data-infinite') === 'true' ? true : false;
                    this.settings.autoplay = this.$slider.attr('data-autoplay') === 'true' ? true : false;
                    this.settings.speed = +this.$slider.attr('data-speed') || 0;

                    if(this.settings.arrows) {
                        $window.on('theme.resize.carousel-products', function() {
                            _.arrowsPosition();
                        });
                    }

                    if(this.$collections_ajax.length) {
                        this.loadProducts(this.$collections_ajax.first());
                    } else {
                        this.initSlick();
                    }

                    this.$control.on('click', 'a', function (e) {
                        var $this = $(this);

                        if(!$this.hasClass('active')) {
                            _.loadProducts($this, true);
                        }

                        e.preventDefault();
                        return false;
                    });
                }
            },
            arrowsPosition: function() {
                var max_height = 0;

                this.$slick.find('.carousel__item img').each(function () {
                    max_height = Math.max(max_height, $(this).innerHeight());
                });

                this.$prev.add(this.$next).css({top: max_height / 2});
            },
            initSlick: function() {
                var _ = this;

                this.$slick.one('init', function() {
                    if(_.settings.arrows) {
                        _.arrowsPosition();
                    }

                    $window.trigger('checkImages');

                    _.$slider.removeClass('invisible');

                    theme.Loader.unset(_.$slider.parent());
                });

                this.$slick.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                    var check_before = nextSlide - 1,
                        check_after = nextSlide + _.settings.count;

                    function beforeAjax($slide) {
                        _.$slides.unbind('loaded');

                        $slide.one('loaded', function () {
                            theme.ProductReview.update();
                        });
                    };

                    _._checkProduct(_.$slick.find('[data-slick-index="' + check_before + '"]'), beforeAjax);

                    for(var i = check_after; i > currentSlide + 1; i--) {
                        _._checkProduct(_.$slick.find('[data-slick-index="' + i + '"]'), beforeAjax);
                    }
                });

                this.$slick.on('afterChange', function () {
                    if(theme.Tooltip) {
                        theme.Tooltip.init();
                    }
                });

                this.$slick.one('init', function () {
                   _.$slider.addClass('initialized');
                });

                this.$slick.slick({
                    lazyLoad: false,
                    arrows: this.settings.arrows,
                    prevArrow: this.$prev,
                    nextArrow: this.$next,
                    dots: this.settings.bullets,
                    dotsClass: 'slick-dots d-flex flex-wrap flex-center list-unstyled mt-7',
                    adaptiveHeight: true,
                    autoplay: this.settings.autoplay,
                    autoplaySpeed: this.settings.speed,
                    infinite: this.settings.infinite,
                    slidesToShow: this.settings.count,
                    slidesToScroll: this.settings.count,
                    touchMove: false,
                    rtl: theme.rtl,
                    responsive: [
                        {
                            breakpoint: theme.breakpoints.values.xl,
                            settings: {
                                slidesToShow: 3,
                                slidesToScroll: 3
                            }
                        },
                        {
                            breakpoint: theme.breakpoints.values.md,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 2
                            }
                        },
                        {
                            breakpoint: theme.breakpoints.values.sm,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 2
                            }
                        }
                    ]
                });
            },
            loadProducts: function($button, loader) {
                if(this.xhr) {
                    this.xhr.abort();
                }

                var _ = this;

                if(loader) {
                    theme.Loader.set(this.$slider.parent());

                    this.$slider.css({
                        'min-height': this.$slider.innerHeight()
                    });
                }

                var collection = $button.attr('data-collection');

                this.xhr = $.ajax({
                    type: 'GET',
                    url: theme.routes.root_url + 'collections/' + collection,
                    cache: false,
                    data: {
                        view: 'carousel',
                        max_count: this.$products.attr('data-max-count'),
                        size_of_columns: this.$products.attr('data-products-pre-row'),
                        async_ajax_loading: this.$products.attr('data-async-ajax-loading')
                    },
                    dataType: 'html',
                    success: function (data) {
                        _.$slider.addClass('invisible');

                        if(_.$slick.hasClass('slick-initialized')) {
                            _.$slick.slick('destroy').off();
                        }

                        _.$slick.one('init', function () {
                            _.$slider.removeAttr('style');

                            if(loader) {
                                theme.Loader.unset(_.$slider.parent());
                            }
                        });

                        _.$products.html(data);

                        _.$slides = _.$slick.find('> *');

                        _.initSlick();

                        theme.ImagesLazyLoad.update();
                        theme.ProductCurrency.update();
                        theme.ProductCountdown.init(_.$products.find('.js-countdown').removeClass('js-countdown--lazy'));
                        theme.ProductReview.update();
                        if(theme.Tooltip) {
                            theme.Tooltip.init();
                        }

                        _.$control.find('a').removeClass('active');
                        $button.addClass('active');

                        _.xhr = null;
                    }
                });
            },
            _checkProduct: function ($slide, beforeAjax) {
                var _ = this,
                    handle = $slide.attr('data-handle');
    
                if(handle) {
                    if(beforeAjax) {
                        beforeAjax($slide);
                    }

                    $.ajax({
                        type: 'GET',
                        url: theme.routes.root_url + 'products/' + handle,
                        data: {
                            view: 'collection'
                        },
                        cache: false,
                        dataType: 'html',
                        success: function (data) {
                            var $data = $(data);
    
                            $slide.add(_.$slick.find('.slick-cloned[data-handle="' + handle + '"]')).html($data).removeAttr('data-handle');
    
                            theme.ImagesLazyLoad.update();
                            theme.ProductCountdown.init($slide.find('.js-countdown').removeClass('js-countdown--lazy'));
    
                            $slide.trigger('loaded');
                        }
                    });
    
                    return true;
                } else {
                    return false;
                }
            },
            onUnload: function() {
                this.$container.off(this.namespace);
    
                if(this.$slick) {
                    this.$slick.slick('destroy').off();
                    this.$slick = null;
    
                    $window.unbind('theme.resize.carousel-products');
                }
    
                this.$control.off();
            }
        });
    
        return CarouselProducts;
    })();
    
    $(function() {
        theme.sections.register('carousel-products', theme.CarouselProducts);
    });
})(jQueryTheme);