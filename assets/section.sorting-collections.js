(function($){

    'use strict';

    theme.SortingCollections = (function() {

        function SortingCollections(container) {
            this.$container = $(container);
    
            //var sectionId = this.$container.attr('data-section-id');
    
            //this.settings = {};
    
            this.namespace = '.sorting-collections';
    
            this.onLoad();
        };
    
        SortingCollections.prototype = $.extend({}, Section.prototype, SortingCollections.prototype, {
            onLoad: function() {
                var $control = this.$container.find('[data-sorting-collections-control]'),
                    $collections = this.$container.find('[data-sorting-collections-ajax] [data-collection]'),
                    $products = this.$container.find('[data-sorting-collections-items]'),
                    $button_more = this.$container.find('[data-sorting-collections-more]'),
                    xhr = null;
    
                this.$control = $control;
    
                function loadProducts($button, loader, callback) {
                    if(xhr) {
                        xhr.abort();
                    }
    
                    if(loader) {
                        theme.Loader.set($products);
                    }
    
                    var collection = $button.attr('data-collection'),
                        count_limit = $products.attr('data-limit'),
                        grid_classes = $products.attr('data-grid');
    
                    xhr = $.ajax({
                        type: 'GET',
                        url: theme.routes.root_url + 'collections/' + collection,
                        cache: false,
                        data: {
                            view: 'sorting',
                            count_limit: count_limit,
                            grid_classes: encodeURIComponent(grid_classes)
                        },
                        dataType: 'html',
                        success: function (data) {
                            var $children;
    
                            $products.html(data);
    
                            if($products[0].hasAttribute('data-is-design-mode')) {
                                $children = $products.children();
    
                                $children.addClass(grid_classes);
    
                                if($children.length > count_limit) {
                                    for(var i = count_limit; i < $children.length; i++) {
                                        $children.eq(i).remove();
                                    }
                                }
                            }
    
                            theme.ImagesLazyLoad.update();
                            theme.ProductCurrency.update();
                            theme.ProductCountdown.init($products.find('.js-countdown').removeClass('js-countdown--lazy'));
                            theme.ProductReview.update();
    
                            $control.find('a').removeClass('active');
                            $button.addClass('active');

                            if($button_more) {
                                $button_more.text(theme.strings.homepage.sorting_collections.button_more_products.replace('{{ collection }}', $button.text())).attr('href', $button.attr('href'));
                            }
    
                            if(loader) {
                                theme.Loader.unset($products);
                            }

                            xhr = null;

                            if(callback) {
                                callback();
                            }
                        }
                    });
                };
    
                if($collections.length) {
                    loadProducts($collections.first(), false, function () {
                        if($button_more.length) {
                            $button_more.removeClass('invisible');
                        }
                    });
                }
    
                $control.on('click', 'a', function (e) {
                    var $this = $(this);
    
                    if(!$this.hasClass('active')) {
                        loadProducts($this, true);
                    }
    
                    e.preventDefault();
                    return false;
                });
            },
            onUnload: function() {
                this.$container.off(this.namespace);
    
                this.$control.off();
            }
        });
    
        return SortingCollections;
    })();
    
    $(function() {
        theme.sections.register('sorting-collections', theme.SortingCollections);
    });
})(jQueryTheme);