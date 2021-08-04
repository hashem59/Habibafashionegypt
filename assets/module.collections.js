(function($){

    'use strict';

    theme.ProductsView = function() {

        function ProductsView() {
            this.selectors = {
                view: '.js-products-view'
            };

            if($(this.selectors.view).length) {
                this.init();
            }
        };

        ProductsView.prototype = $.extend({}, ProductsView.prototype, {
            init: function() {
                var _ = this,
                    obj_view = localStorage.getItem('products-view');

                if(window.location.href.indexOf('products-view=reset') !== -1) {
                    obj_view = null;
                    localStorage.setItem('products-view', null);
                }

                if(obj_view) {
                    var $wrappers = $(this.selectors.view + ' [data-js-products-grid-buttons]');

                    obj_view = JSON.parse(obj_view);

                    $wrappers.each(function () {
                        var $wrapper = $(this),
                            is_default = true;

                        $.each(obj_view, function (k, v) {
                            if($wrapper.attr('data-value-' + k) !== v) {
                                var active_attr = 'data-active-' + k;

                                $wrapper.attr('data-value-' + k, v);
                                $wrapper.find('[data-value]').removeAttr(active_attr);
                                $wrapper.find('[data-value="' + v +  '"]').attr(active_attr, true);

                                is_default = false;
                            }
                        });

                        if(!is_default) {
                            _.update($wrapper);
                        }
                    });
                }

                $body.on('click', this.selectors.view + ' [data-js-products-grid-buttons] [data-value]', function() {
                    var $this = $(this),
                        $wrapper = $this.parents('[data-js-products-grid-buttons]'),
                        value = $this.attr('data-value'),
                        bp = theme.current.bp,
                        active_attr = 'data-active-' + bp;

                    if(!$this[0].hasAttribute(active_attr)) {
                        var obj_values = {};

                        $wrapper.find('[data-value]').removeAttr(active_attr);
                        $this.attr(active_attr, true);
                        $wrapper.attr('data-value-' + bp, value);

                        _.update($wrapper);

                        $.each(theme.breakpoints.values, function (k, v) {
                            obj_values[k] = $wrapper.attr('data-value-' + k);
                        });

                        localStorage.setItem('products-view', JSON.stringify(obj_values));
                    }
                });
            },
            update: function ($wrapper) {
                var $products = $wrapper.parents(this.selectors.view).find('[data-js-products]'),
                    $buttons = $('[data-js-products-grid-buttons]'),
                    grid_class = '';

                if(!$buttons.length) {
                    return;
                }

                $.each(theme.breakpoints.values, function(k) {
                    var grid_value = $buttons.attr('data-value-' + k),
                        column_size = (grid_value === 'list' ? 12 : 12 / +grid_value);

                    $products[+grid_value === 1 ? 'addClass' : 'removeClass']('products-view-centered-' + k);
                    $products[grid_value === 'list' ? 'addClass' : 'removeClass']('products-view-list-' + k);

                    grid_class += ' col-';

                    if(k !== 'xs') {
                        grid_class += k + '-';
                    }

                    grid_class += column_size;
                });

                $products.find('[data-js-product]').parent().attr('class', grid_class);

                $window.trigger('checkImages');
            }
        });

        theme.ProductsView = new ProductsView;
    };
    
    theme.Collections = function() {

        function Collections() {
            var $collections =  $('.js-collections');

            this.dom = {
                $collections: $collections,
                $body: $collections.find('[data-js-collections-body]'),
                $sidebar: $('[data-js-collection-sidebar]'),
                $pagination: $collections.find('[data-js-collection-pagination]'),
                $filtersCount: $collections.find('[data-js-collection-filters-count]')
            };
    
            this.current = {
                xhr: null,
                handle: null
            };
    
            if(this.dom.$collections.length) {
                this.load();
            }
        };
    
        Collections.prototype = $.extend({}, Collections.prototype, {
            _parseURL: function() {
                var url = window.location.href,
                    path_n_params = url.split(theme.routes.collections_url + '/')[1].split('?'),
                    path_handle_n_tag = path_n_params[0].split('/'),
                    params = path_n_params[1] ? path_n_params[1].split('&') : undefined;
    
                var obj = {
                    handle:  path_handle_n_tag[0],
                    params: {
                        tags: [],
                        vendors: [],
                        types: [],
                        options: [],
                        title: null,
                        price_from: null,
                        price_to: null,
                        only_available_enable: null,
                        logic_or_enable: null,
                        page: null,
                        view: null,
                        sort_by: null
                    }
                };
    
                if(path_handle_n_tag[1]) {
                    obj.params.tags = obj.params.tags.concat(path_handle_n_tag[1].split('+'));
                }
    
                $.each(params, function (i, v) {
                    var key_n_value = v.split('='),
                        key = key_n_value[0],
                        value = key_n_value[1];
    
                    if(key === 'constraint') {
                        value.split('+').map(function callback(val) {
                            obj.params.tags.push(decodeURIComponent(val.replace(/-/g, ' ')));
                        });
                    } else if(key === 'q') {
                        $.each(value.split('+'), function (i, v) {
                            var key_n_value = v.split('_:'),
                                key = key_n_value[0],
                                value = key_n_value[1];
    
                            if(key === 'tg') {
                                obj.params.tags.push(decodeURIComponent(value));
                            } else if(key === 'vd') {
                                obj.params.vendors.push(decodeURIComponent(value));
                            } else if(key === 'tp') {
                                obj.params.types.push(decodeURIComponent(value));
                            } else if(key === 'opt') {
                                value = value.split('::');
                                obj.params.options.push(decodeURIComponent(value[0]) + '::' + decodeURIComponent(value[1]));
                            } else if(key === 'tt') {
                                obj.params.title = decodeURIComponent(value);
                            } else if(key === 'prf') {
                                obj.params.price_from = value;
                            } else if(key === 'prt') {
                                obj.params.price_to = value;
                            } else if(key === 'oa') {
                                obj.params.only_available_enable = value === 'true' ? true : value === 'false' ? false : null;
                            } else if(key === 'lo') {
                                obj.params.logic_or_enable = value === 'true' ? true : value === 'false' ? false : null;
                            } else if(key === 'pg') {
                                obj.params.page = value;
                            }
                        });
                    } else if(key === 'view') {
                        obj.params.view = value;
                    } else if(key === 'sort_by') {
                        obj.params.sort_by = value;
                    } else if(key === 'page') {
                        obj.params.page = value;
                    }
                });
    
                return obj;
            },
            _buildURL: function(obj) {
                var url = theme.routes.collections_url + '/' + obj.handle,
                    ajax_url = url,
                    params = [],
                    ajax_params = [];

                function encodeArray(arr, separator) {
                    var new_arr = [],
                        separated_arr;

                    for(var i = 0; i < arr.length; i++) {
                        if(separator) {
                            separated_arr = arr[i].split(separator);
                            new_arr[i] = encodeURIComponent(separated_arr[0]) + separator + encodeURIComponent(separated_arr[1]);
                        } else {
                            new_arr[i] = encodeURIComponent(arr[i]);
                        }
                    }

                    return new_arr;
                };
    
                if(window.page.default.only_available === true || window.page.default.logic_or === true || obj.params.vendors.length || obj.params.types.length || obj.params.options.length || obj.params.title !== null || obj.params.price_from !== null || obj.params.price_to !== null || obj.params.only_available_enable != null || obj.params.logic_or_enable != null) {
                    params[0] = [];
    
                    if(obj.params.tags.length) {
                        params[0].push('tg_:' + encodeArray(obj.params.tags).join('+tg_:'));
                    }
    
                    if(obj.params.vendors.length) {
                        params[0].push('vd_:' + encodeArray(obj.params.vendors).join('+vd_:'));
                    }
    
                    if(obj.params.types.length) {
                        params[0].push('tp_:' + encodeArray(obj.params.types).join('+tp_:'));
                    }

                    if(obj.params.options.length) {
                        params[0].push('opt_:' + encodeArray(obj.params.options, '::').join('+opt_:'));
                    }
    
                    if(obj.params.title !== null) {
                        params[0].push('tt_:' + encodeURIComponent(obj.params.title));
                    }
    
                    if(obj.params.price_from !== null) {
                        params[0].push('prf_:' + obj.params.price_from);
                    }
    
                    if(obj.params.price_to !== null) {
                        params[0].push('prt_:' + obj.params.price_to);
                    }
    
                    if(obj.params.only_available_enable !== null && obj.params.only_available_enable !== window.page.default.only_available) {
                        params[0].push('oa_:' + obj.params.only_available_enable);
                    }
    
                    if(obj.params.logic_or_enable !== null && obj.params.logic_or_enable !== window.page.default.logic_or) {
                        params[0].push('lo_:' + obj.params.logic_or_enable);
                    }
    
                    if(obj.params.page !== null && obj.params.page !== 1) {
                        params[0].push('pg_:' + obj.params.page);
                    }
    
                    if(params[0].length) {
                        params[0] = 'q=' + params[0].join('+');
                    } else {
                        params = [];
                    }
                } else {
                    if(obj.params.tags.length) {
                        params.push('constraint=' + encodeArray(obj.params.tags.map(function(v){
                            return v.replace(/ /g, '-');
                        })).join('+'));
                    }
    
                    if(obj.params.page !== null && obj.params.page !== 1) {
                        params.push('page=' + obj.params.page);
                    }
                }

                if(obj.params.sort_by !== null && obj.params.sort_by !== window.page.default.sort_by) {
                    params.push('sort_by=' + obj.params.sort_by);
                }
    
                ajax_params = params.slice();
    
                if(obj.params.view !== null && obj.params.view !== window.page.default.view_length) {
                    params.push('view=' + obj.params.view);
                    ajax_params.push('view=' + obj.params.view + '-ajax');
                } else {
                    ajax_params.push('view=ajax');
                }

                if(params.length) {
                    url += '?' + params.join('&');
                }
    
                ajax_url += '?' + ajax_params.join('&');
    
                return {
                    history: url,
                    ajax: ajax_url
                };
            },
            _changeURL: function(url, event) {
                if(event === 'onchange.pagination' && (window.page.default.pagination_type === 'button_load_more' || window.page.default.pagination_type === 'infinite_scroll')) {
                    return;
                }
    
                history.pushState({foo: 'filters'}, url, url);
            },
            _changeObj: function (obj, key, action, value) {
                var new_obj = $.extend(true, {}, obj),
                    lint_new_obj = new_obj,
                    i;
    
                if(key.indexOf('params.') !== -1) {
                    lint_new_obj = new_obj.params;
                    key = key.replace('params.', '');
                }
    
                if(action === 'change') {
                    lint_new_obj[key] = value;
                } else if(action === 'add') {
                    if(lint_new_obj[key].indexOf(value) === -1) {
                        lint_new_obj[key].push(value);
                    }
                } else if(action === 'remove') {
                    i = lint_new_obj[key].indexOf(value);
    
                    if (i !== -1) {
                        lint_new_obj[key].splice(i, 1);
                    }
                }
    
                return new_obj;
            },
            _setControls: function(obj) {
                var only_available_enable = window.page.default.only_available,
                    logic_or_enable = window.page.default.logic_or;
    
                if(obj.params.only_available_enable !== null) {
                    only_available_enable = obj.params.only_available_enable;
                }
    
                if(obj.params.logic_or_enable !== null) {
                    logic_or_enable = obj.params.logic_or_enable;
                }
    
                $('[name="collection"]').prop('checked', false).filter('[value="' + obj.handle + '"]').prop('checked', 'checked');
                
                $('[name="collection_with_tag"], [name="filter_by_tag"], [name="filter_by_color"], [name="filter_by_vendor"], [name="filter_by_type"], [name="filter_by_option"]').prop('checked', false);
                $('[name="filter_by_title"]').val('');
    
                if(theme.RangeOfPrice) {
                    theme.RangeOfPrice.reset();
                }
    
                $.each(obj.params.tags, function (i, v) {
                    $('[name="collection_with_tag"][value="' + v + '"]').prop('checked', 'checked');
                    $('[name="filter_by_tag"][value="' + v + '"]').prop('checked', 'checked');
                    $('[name="filter_by_color"][value="' + v + '"]').prop('checked', 'checked');
                });
    
                $.each(obj.params.vendors, function (i, v) {
                    $('[name="filter_by_vendor"][value="' + v + '"]').prop('checked', 'checked');
                });
    
                $.each(obj.params.types, function (i, v) {
                    $('[name="filter_by_type"][value="' + v + '"]').prop('checked', 'checked');
                });
    
                $.each(obj.params.options, function (i, v) {
                    $('[name="filter_by_option"][value="' + v + '"]').prop('checked', 'checked');
                });
    
                $('[name="filter_by_title"]').val(obj.params.title ? obj.params.title : '');
                $('[name="only_available"]').prop('checked', only_available_enable ? 'checked' : false);
                $('[name="logic_or"]').prop('checked', logic_or_enable ? 'checked' : false);
                $('[name="sort_by"]').val(obj.params.sort_by !== null ? obj.params.sort_by : window.page.default.sort_by).trigger('update');
                $('[name="view_length"]').val(obj.params.view !== null ? obj.params.view : window.page.default.view_length).trigger('update');
    
                if(theme.RangeOfPrice) {
                    theme.RangeOfPrice.update(obj.params.price_from, obj.params.price_to);
                }
            },
            _loadContent: function (url, obj, event) {
                var _ = this;
    
                if(this.current.xhr) {
                    this.current.xhr.abort();
                }
    
                theme.Loader.set($('[data-js-collection-replace="products"]').parent(), {
                    fixed: true,
                    spinner: theme.current.is_mobile ? false : null
                });
    
                this.xhr = $.ajax({
                    type: 'GET',
                    url: url,
                    cache: false,
                    dataType: 'html',
                    success: function (data) {
                        var parser = new DOMParser(),
                            $new_page = $(parser.parseFromString(data, "text/html")),
                            replace_find = '[data-js-collection-replace]',
                            head_sections_arr = [];
    
                        if(theme.ProductsView) {
                            theme.ProductsView.update($new_page.find('[data-js-products]'));
                        }
    
                        if(_.current.handle === obj.handle) {
                            replace_find += ':not([data-js-collection-replace-only-full])';
                        }

                        if(theme.StickySidebar) {
                            theme.StickySidebar.update('listener-enable');
                        }

                        function stickyProcessAndDisable() {
                            if(theme.StickySidebar) {
                                theme.StickySidebar.update('listener-process');
                            }

                            if(theme.StickySidebar) {
                                theme.StickySidebar.update('listener-disable');
                            }
                        }
    
                        $(replace_find).each(function () {
                            var $this = $(this);
    
                            var name = $this.attr('data-js-collection-replace'),
                                $element = $('[data-js-collection-replace="' + name + '"]'),
                                $page_element = $new_page.find('[data-js-collection-replace="' + name + '"]'),
                                $section;
    
                            if(event === 'onchange.pagination' && name === 'products' && (window.page.default.pagination_type === 'button_load_more' || window.page.default.pagination_type === 'infinite_scroll')) {
                                $element.append($page_element.children());
    
                                if(name === 'products') {
                                    theme.Loader.unset($element.parent());
                                }
                            } else {
                                $element.replaceWith($page_element);
    
                                if($page_element[0].hasAttribute('data-js-collection-manual-visible')) {
                                    $page_element.parents('[data-js-collection-manual-visible-section]')[$page_element.attr('data-js-collection-manual-visible') === 'true' ? 'removeClass' : 'addClass']('d-none-important');
                                }
    
                                if($page_element[0].hasAttribute('data-js-collection-replace-hide-empty')) {
                                    $section = $page_element.parents('[data-js-collection-nav-section]');
    
                                    $section[$page_element.find('input, [data-filter-type]').length ? 'removeClass' : 'addClass']('d-none');
                                }
    
                                if(name === 'fullwidth-head' || name === 'head') {
                                    head_sections_arr.push($page_element.parents('[data-section-type]'));
                                } else if(name === 'products') {
                                    theme.Loader.unset($page_element.parent());
                                } else if(name == 'js-settings') {
                                    eval($page_element.text());
                                }
    
                                $element.remove();
                            }
                        });
    
                        if(_.current.handle !== obj.handle) {
                            $new_page.find('[data-js-collection-visible-element]').each(function () {
                                var $this = $(this),
                                    name = $this.attr('data-js-collection-visible-element');
    
                                $('[data-js-collection-visible-element="' + name + '"]')[$this.attr('data-js-collection-visible') === 'true' ? 'removeClass' : 'addClass']('d-none-important')
                            });
    
                            if(obj.params.sort_by === null) {
                                _.dom.$body.find('[name="sort_by"]').val(window.page.default.sort_by).trigger('update');
                            }
    
                            if(obj.params.view === null) {
                                _.dom.$body.find('[name="view_length"]').val(window.page.default.view_length).trigger('update');
                            }
                        }
    
                        _.dom.$pagination = _.dom.$body.find('[data-js-collection-pagination]');

                        if(_.dom.$filtersCount.length) {
                            const paramsLength = obj.params.tags.length + obj.params.vendors.length + obj.params.types.length + obj.params.options.length + (obj.params.title ? 1 : 0) + (obj.params.price_to || obj.params.price_from ? 1 : 0);

                            _.dom.$filtersCount.html(paramsLength > 0 ? theme.strings.collections.control.button_sidebar_filters_count.replace('{{ count }}', paramsLength) : '');
                        }
    
                        if(theme.current.is_mobile) {
                            theme.Loader.unset(_.dom.$sidebar);
                        }
                        
                        theme.ImagesLazyLoad.update();
                        theme.ProductCurrency.update();
                        theme.StoreLists.checkProductStatus();
                        theme.ProductCountdown.init(_.dom.$body.find('.js-countdown'));
                        theme.ProductReview.update();

                        stickyProcessAndDisable();

                        if(head_sections_arr.length) {
                            $(head_sections_arr).each(function (i, v) {
                                $(v).one('section:reloaded', function () {
                                    if(theme.StickySidebar) {
                                        theme.StickySidebar.update(null, 1);
                                    }
                                }).trigger('section.reload');
                            });
                        }

                        if(theme.Tooltip) {
                            theme.Tooltip.init();
                        }
    
                        $new_page.remove();
    
                        _.current.handle = obj.handle;
    
                        _.current.xhr = null;
                    }
                });
            },
            _onChangeHistory: function (obj) {
                var url_obj = this._buildURL(obj);
    
                if(theme.current.is_mobile) {
                    theme.Loader.set(this.dom.$sidebar, {
                        fixed: true
                    });
                }
    
                this._setControls(obj);
                this._loadContent(url_obj.ajax, obj);
            },
            _onChangeControls: function (obj, event) {
                var url_obj = this._buildURL(obj);
    
                if(theme.current.is_mobile) {
                    theme.Loader.set(this.dom.$sidebar, {
                        fixed: true
                    });
                }
    
                if(window.page.default.reload_type_ajax === true) {
                    this._changeURL(url_obj.history, event);
                    this._loadContent(url_obj.ajax, obj, event);
                } else {
                    window.location.href = url_obj.history;
                }
            },
            changePriceParams: function (from, to) {
                var obj = this._parseURL(),
                    new_obj = $.extend(true, {}, obj);
    
                new_obj = this._changeObj(new_obj, 'params.price_from', 'change', from);
                new_obj = this._changeObj(new_obj, 'params.price_to', 'change', to);
    
                this._onChangeControls(new_obj);
            },
            load: function() {
                var _ = this;
    
                function onChangeMenu(do_reset_obj, callback) {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        val = _.dom.$sidebar.find('[name="collection"]:checked').val();
    
                    new_obj = _._changeObj(new_obj, 'handle', 'change', val);
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if(do_reset_obj) {
                        new_obj = _._changeObj(new_obj, 'params.tags', 'change', []);
                        new_obj = _._changeObj(new_obj, 'params.vendors', 'change', []);
                        new_obj = _._changeObj(new_obj, 'params.types', 'change', []);
                        new_obj = _._changeObj(new_obj, 'params.options', 'change', []);
                        new_obj = _._changeObj(new_obj, 'params.title', 'change', null);
                        new_obj = _._changeObj(new_obj, 'params.price_from', 'change', null);
                        new_obj = _._changeObj(new_obj, 'params.price_to', 'change', null);
    
                        $('[data-js-collection-current-tags] [data-filter-type]').remove();
                        $('[name="collection_with_tag"], [name="filter_by_tag"], [name="filter_by_color"], [name="filter_by_vendor"], [name="filter_by_type"], [name="filter_by_option"]').prop('checked', false);
                        $('[name="filter_by_title"]').val('');
    
                        if(theme.RangeOfPrice) {
                            theme.RangeOfPrice.reset();
                        }
                    } else {
                        _.dom.$sidebar.find('[name="collection_with_tag"]').each(function () {
                            var $this = $(this),
                                val = $this.val();
    
                            if($this.is(':checked')) {
                                new_obj = _._changeObj(new_obj, 'params.tags', 'add', val);
                            } else {
                                new_obj = _._changeObj(new_obj, 'params.tags', 'remove', val);
                            }
                        });
                    }
    
                    if(callback) {
                        callback(new_obj);
                    }
    
                    _._onChangeControls(new_obj);
                };
    
                this.dom.$sidebar.on('change', '[name="collection"]', function () {
                    onChangeMenu(true);
                });
    
                this.dom.$sidebar.on('change', '[name="collection_with_tag"]', function () {
                    var $this = $(this),
                        $current_collection = $this.parents('.collections-menu__item').find('[name="collection"]'),
                        $remove_collections = $('[name="collection"]').not($current_collection),
                        is_current_collection_checked = $current_collection.is(':checked');
    
                    $remove_collections.prop('checked', false);
                    $current_collection.prop('checked', 'checked');
    
                    onChangeMenu(!is_current_collection_checked, function (obj) {
                        if(!is_current_collection_checked) {
                            $this.prop('checked', 'checked');
    
                            obj = $.extend(true, obj, _._changeObj(obj, 'params.tags', 'add', $this.val()));
                        }
                    });
                });
                
                this.dom.$sidebar.on('change', '[name="filter_by_tag"], [name="filter_by_color"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        val = $this.val();
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if($this.is(':checked')) {
                        new_obj = _._changeObj(new_obj, 'params.tags', 'add', val);
                    } else {
                        new_obj = _._changeObj(new_obj, 'params.tags', 'remove', val);
                    }
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$sidebar.on('change', '[name="filter_by_vendor"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        val = $this.val();

                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if($this.is(':checked')) {
                        new_obj = _._changeObj(new_obj, 'params.vendors', 'add', val);
                    } else {
                        new_obj = _._changeObj(new_obj, 'params.vendors', 'remove', val);
                    }
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$sidebar.on('change', '[name="filter_by_type"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        val = $this.val();
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if($this.is(':checked')) {
                        new_obj = _._changeObj(new_obj, 'params.types', 'add', val);
                    } else {
                        new_obj = _._changeObj(new_obj, 'params.types', 'remove', val);
                    }
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$sidebar.on('change', '[name="filter_by_option"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        val = $this.val();
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if($this.is(':checked')) {
                        new_obj = _._changeObj(new_obj, 'params.options', 'add', val);
                    } else {
                        new_obj = _._changeObj(new_obj, 'params.options', 'remove', val);
                    }
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$sidebar.on('change', '[name="only_available"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this);
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.only_available_enable', 'change', $this.is(':checked'));
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$sidebar.on('change', '[name="logic_or"]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this);
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.logic_or_enable', 'change', $this.is(':checked'));
    
                    _._onChangeControls(new_obj);
                });
    
                function onChangeTitle() {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        val = _.dom.$sidebar.find('[name="filter_by_title"]').val();
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    if(val.length) {
                        new_obj = _._changeObj(new_obj, 'params.title', 'change', val);
                    } else {
                        new_obj = _._changeObj(new_obj, 'params.title', 'change', null);
                    }
    
                    _._onChangeControls(new_obj);
                };
    
                this.dom.$sidebar.on('click', '[data-js-collection-filter-by-title] button', function () {
                    onChangeTitle()
                });
    
                this.dom.$sidebar.on('keyup', '[data-js-collection-filter-by-title] input', $.debounce(700, function () {
                    onChangeTitle();
                }));
    
                $body.on('click', '[data-js-collection-current-tags] [data-filter-type]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        type = $(this).attr('data-filter-type'),
                        val = $this.attr('data-value');

                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);

                    if(type === 'tg') {
                        new_obj = _._changeObj(new_obj, 'params.tags', 'remove', val);
                    } else if(type === 'vd') {
                        new_obj = _._changeObj(new_obj, 'params.vendors', 'remove', val);
                    } else if(type === 'tp') {
                        new_obj = _._changeObj(new_obj, 'params.types', 'remove', val);
                    } else if(type === 'opt') {
                        new_obj = _._changeObj(new_obj, 'params.options', 'remove', val);
                    } else if(type === 'tt') {
                        new_obj = _._changeObj(new_obj, 'params.title', 'change', null);
                    } else if(type === 'pr') {
                        new_obj = _._changeObj(new_obj, 'params.price_from', 'change', null);
                        new_obj = _._changeObj(new_obj, 'params.price_to', 'change', null);
                    }
                    
                    _._setControls(new_obj);
                    _._onChangeControls(new_obj);
    
                    $this.remove();
                });
    
                $body.on('click', '[data-js-collection-current-tags-clear]', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj);
    
                    new_obj = _._changeObj(new_obj, 'params.tags', 'change', []);
                    new_obj = _._changeObj(new_obj, 'params.vendors', 'change', []);
                    new_obj = _._changeObj(new_obj, 'params.types', 'change', []);
                    new_obj = _._changeObj(new_obj, 'params.options', 'change', []);
                    new_obj = _._changeObj(new_obj, 'params.title', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.price_from', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.price_to', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
    
                    _._setControls(new_obj);
                    _._onChangeControls(new_obj);

                    $('[data-js-collection-current-tags] [data-filter-type]').remove();
                });
    
                this.dom.$body.on('change', '[data-js-collection-sort-by] select', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this);
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.sort_by', 'change', $this.val());
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$body.on('change', '[data-js-collection-view-length] select', function () {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this);
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', null);
                    new_obj = _._changeObj(new_obj, 'params.view', 'change', $this.val());
    
                    _._onChangeControls(new_obj);
                });
    
                this.dom.$body.on('click', '[data-js-collection-pagination] a', function (e) {
                    var obj = _._parseURL(),
                        new_obj = $.extend(true, {}, obj),
                        $this = $(this),
                        value = $this.attr('data-value') || $this.attr('href').split('page=')[1].split('&')[0],
                        header_h;
    
                    $('[name="page"]').val(value);
    
                    new_obj = _._changeObj(new_obj, 'params.page', 'change', value > 1 ? value : null);
    
                    _._onChangeControls(new_obj, 'onchange.pagination');
    
                    if(window.page.default.pagination_type !== 'button_load_more' && window.page.default.pagination_type !== 'infinite_scroll' && window.page.default.reload_type_ajax === true) {
                        header_h = theme.StickyHeader && theme.StickyHeader.$sticky ? theme.StickyHeader.$sticky.stickyHeader('getStickyHeight') : 0;
    
                        $html.add($body).velocity('stop').velocity('scroll', {
                            offset: _.dom.$body.find('[data-js-products]').offset().top - header_h,
                            duration: theme.animations.pagination.scroll_duration * 1000
                        });
                    }
    
                    e.preventDefault();
                    return false;
                });
    
                if(this.dom.$pagination.length && window.page.default.pagination_type === 'infinite_scroll') {
                    setTimeout(function () {
                        $window.on('scroll', function () {
                            var pag_pos = _.dom.$pagination[0].getBoundingClientRect();
    
                            if(pag_pos.top < theme.current.height && !_.dom.$pagination[0].hasAttribute('data-js-loading')) {
                                _.dom.$pagination.attr('data-js-loading', true);
    
                                _.dom.$pagination.find('a').trigger('click');
                            }
                        });
                    }, 500);
                }
    
                if(window.page.default.reload_type_ajax === true) {
                    $window.on('popstate', function() {
                        var obj = _._parseURL();
    
                        _._onChangeHistory(obj);
                    });
                }
            }
        });
    
        theme.Collections = new Collections;
    };

    $(function() {
        theme.ProductsView();
        theme.Collections();
    });
})(jQueryTheme);