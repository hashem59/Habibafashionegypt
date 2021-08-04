(function($){

    'use strict';

    theme.RangeOfPrice = function() {

        function RangeOfPrice() {
            this.dom = {};

            this.init();
        };
    
        RangeOfPrice.prototype = $.extend({}, RangeOfPrice.prototype, {
            init: function() {
                this.dom.$range = $('.js-range-of-price');
    
                if(this.dom.$range.length) {
                    var params = {
                        type: "double",
                        force_edges: true,
                        prettify: function (data) {
                            return Shopify.formatMoney(data * 100, theme.moneyFormat);
                        }
                    };

                    $.extend(params, {
                        onStart: function () {
                            if (window.Currency) {
                                setTimeout(function () {
                                    theme.ProductCurrency.update();
                                }, 0);
                            }
                        },
                        onFinish: function (data) {
                            if (window.Currency) {
                                theme.ProductCurrency.update();
                            }
                            
                            theme.Collections.changePriceParams(data.from !== data.min ? data.from * 100 : null, data.to !== data.max ? data.to * 100 : null);
                        }
                    });
    
                    this.dom.$range.ionRangeSlider(params);
                }
            },
            destroy: function () {
                if(this.dom.$range && this.dom.$range.data('ionRangeSlider')) {
                    this.dom.$range.ionRangeSlider('destroy');
                    delete this.dom.$range;
                }
            },
            update: function(from, to) {
                if(this.dom.$range) {
                    var api = this.dom.$range.data('ionRangeSlider');
    
                    api.update({
                        from: from ? from / 100 : api.result.min,
                        to: to ? to / 100 : api.result.max
                    });
                }
            },
            reset: function() {
                if(this.dom.$range.length) {
                    var api = this.dom.$range.data('ionRangeSlider');
    
                    api.update({
                        from: api.result.min,
                        to: api.result.max
                    });
                }
            }
        });
    
        theme.RangeOfPrice = new RangeOfPrice;
    };
    
    $(function() {
        theme.RangeOfPrice();
    });
})(jQueryTheme);