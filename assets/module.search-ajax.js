(function($){

    'use strict';

    theme.SearchAjax = function() {

        function SearchAjax() {
            this.settings = {
                default_search_obj: {
                    url: theme.routes.search_url,
                    data: {
                        view: 'json'
                    }
                },
                suggest_search_obj: {
                    url: theme.routes.search_url + '/suggest.json',
                    data: {
                        resources: {
                            type: theme.search_show_only_products ? 'product' : 'product,page',
                            unavailable_products: 'last',
                            fields: 'title,vendor,product_type,variants.title',
                            options: null
                        }
                    }
                }
            };

            this.selectors = {
                search: '.js-search-ajax'
            };

            this.load();
        };

        SearchAjax.prototype = $.extend({}, SearchAjax.prototype, {
            load: function() {
                var _ = this,
                    q = '',
                    ajax;

                function resultToHTML($search, $results, data) {
                    if(data.count > 0) {
                        var $template = $($('#template-search-ajax')[0].content),
                            $fragment = $(document.createDocumentFragment()),
                            limit = +$search.attr('data-js-max-products') - 1;

                        $.each(data.results, function(i) {
                            var $item = $template.clone(),
                                $image = $item.find('.product-search-2__image img'),
                                $title = $item.find('.product-search-2__title a'),
                                $price = $item.find('.product-search-2__price .price'),
                                $links = $item.find('a');

                            $links.attr('href', this.url);
                            $title.html(this.title);

                            if(this.image) {
                                $image.attr('srcset', Shopify.resizeImage(this.image, '200x') + ' 1x, ' + Shopify.resizeImage(this.image, '200x@2x') + ' 2x');
                            } else {
                                $image.remove();
                            }

                            if($price.length) {
                                if (this.price) {
                                    switch (theme.search_result_correction) {
                                        case '/100': {
                                            this.price = this.price / 100;
                                            this.compare_at_price = this.compare_at_price / 100;
                                            break;
                                        }
                                        case '/10': {
                                            this.price = this.price / 10;
                                            this.compare_at_price = this.compare_at_price / 10;
                                            break;
                                        }
                                        case '*10': {
                                            this.price = this.price * 10;
                                            this.compare_at_price = this.compare_at_price * 10;
                                            break;
                                        }
                                        case '*100': {
                                            this.price = this.price * 100;
                                            this.compare_at_price = this.compare_at_price * 100;
                                            break;
                                        }
                                    }
                                    
                                    theme.ProductCurrency.setPrice($price, this.price, this.compare_at_price);
                                } else {
                                    $price.remove();
                                }
                            }

                            $fragment.append($item);

                            return i < limit;
                        });

                        $results.html('');
                        $results.append($fragment);

                        theme.ImagesLazyLoad.update();
                        theme.ProductCurrency.update();
                    } else {
                        $results.html('');
                    }

                    $results[data.count > 0 ? 'removeClass' : 'addClass']('d-none-important');
                };

                function processResult($search, $content, q, data) {
                    var $results = $search.find('.search-ajax__result'),
                        $view_all = $search.find('.search-ajax__view-all'),
                        $button_view_all = $view_all.find('a'),
                        $empty_result = $search.find('.search-ajax__empty');

                    $button_view_all.attr('href', theme.routes.search_url + '?q=' + q + '&options[prefix]=last' + (theme.search_show_only_products ? '&type=product' : ''));
                    $view_all[data.count > 0 ? 'removeClass' : 'addClass']('d-none-important');
                    $empty_result.html(theme.strings.general.search.no_results_html.replace('{{ terms }}', q))[q === '' || data.count > 0 ? 'addClass' : 'removeClass']('d-none-important');

                    $results.addClass('invisible');

                    resultToHTML($search, $results, data);

                    $results.removeClass('invisible');

                    theme.Loader.unset($content);
                    $search.find('button[type="submit"]').removeClass('disabled');

                    $search.addClass('open');

                    $body.unbind('click.search-ajax');
                    $window.unbind('scroll.search-ajax');

                    $body.on('click.search-ajax', function (e) {
                        if(!$(e.target).parents('.js-search-ajax').length) {
                            clear();
                            $body.unbind('click.search-ajax');
                        }
                    });

                    $window.on('scroll.search-ajax', function () {
                        clear();
                        $window.unbind('scroll.search-ajax');
                    });
                };

                function clear($target) {
                    var $search = $target || $(_.selectors.search),
                        $content = $search.find('.search-ajax__content');

                    q = '';

                    $search.find('input').val('');
                    processResult($search, $content, q, { count: 0 });

                    $search.removeClass('open');
                };

                $body.on('keyup', this.selectors.search + ' input', $.debounce(500, function (e) {
                    var $search = $(this).parents(_.selectors.search);

                    if(e.keyCode !== 27) {
                        var $this = $(this),
                            value = $this.val(),
                            $content = $search.find('.search-ajax__content');

                        if(value !== q) {
                            q = value;

                            if(q === '') {
                                processResult($search, $content, q, { count: 0 });
                            } else {
                                if (ajax) {
                                    ajax.abort();
                                }

                                theme.Loader.set($content);
                                $search.find('button[type="submit"]').addClass('disabled');

                                ajax = $.getJSON($.extend(true, {}, (theme.search_predictive_enabled ? _.settings.suggest_search_obj : _.settings.default_search_obj), {
                                    type: 'GET',
                                    data: {
                                        q: q
                                    },
                                    success: function (data) {
                                        var max_count = 5,
                                            formatted_data = {
                                                count: Math.min(data.resources.results.products.length + (data.resources.results.pages ? data.resources.results.pages.length : 0), max_count),
                                                results: []
                                            },
                                            count = 0;

                                        $.each(data.resources.results.products, function () {
                                            if(count > max_count) {
                                                return false;
                                            }

                                            if(theme.search_predictive_enabled && this.price_min.indexOf('.') === -1) {
                                                this.price_min *= 100;
                                            }

                                            if(theme.search_predictive_enabled && this.compare_at_price_min.indexOf('.') === -1) {
                                                this.compare_at_price_min *= 100;
                                            }

                                            formatted_data.results.push({
                                                price: this.price_min,
                                                compare_at_price: this.compare_at_price_min,
                                                image: this.image,
                                                title: this.title,
                                                url: this.url
                                            });

                                            count++;
                                        });

                                        $.each(data.resources.results.pages, function () {
                                            if(count > max_count) {
                                                return false;
                                            }

                                            formatted_data.results.push({
                                                title: this.title,
                                                url: this.url,
                                                image: this.image || null
                                            });

                                            count++;
                                        });

                                        processResult($search, $content, q, formatted_data);
                                    }
                                }));
                            }
                        }
                    }
                }));

                $body.on('keyup', this.selectors.search + ' input', function(e) {
                    if(e.keyCode === 27) {
                        var $search = $(this).parents(_.selectors.search),
                            $content = $search.find('.search-ajax__content');

                        q = '';

                        processResult($search, $content, q, { count: 0 });
                    }
                });

                $body.on('clear', this.selectors.search, function () {
                    clear($(this));
                });
            },
            closeAll: function () {
                $(this.selectors.search + '.open').trigger('clear');
            }
        });

        theme.SearchAjax = new SearchAjax;
    };

    $(function() {
        theme.SearchAjax();
    });
})(jQueryTheme);