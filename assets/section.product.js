(function($){

  'use strict';

  theme.ProductPage = (function() {

    function ProductPage(container) {
      this.$container = $(container);
  
      //var sectionId = this.$container.attr('data-section-id');
  
      //this.settings = {};
  
      this.namespace = '.product-page';
  
      this.onLoad();
    }
  
    ProductPage.prototype = $.extend({}, ProductPage.prototype, {
      onLoad: function () {
        var $product = this.$container.find('[data-js-product]'),
            $gallery = $product.find('[data-js-product-gallery]'),
            $countdown = $product.find('[data-js-product-countdown] .js-countdown'),
            $text_countdown = $product.find('.js-text-countdown'),
            $visitors = $product.find('.js-visitors');

        if($gallery.length && $.fn.productGallery) {
          this.$gallery = $gallery;
          this.$gallery.productGallery();
        }

        if(theme.is_loaded) {
          if($countdown.length) {
            theme.ProductCountdown.init($countdown);
          }
          
          if($text_countdown.length) {
            theme.ProductTextCountdown.init($text_countdown);
          }
  
          if($visitors.length) {
            theme.ProductVisitors.init($visitors);
          }
  
          theme.StoreLists.checkProductStatus($product);
  
          if(theme.Tabs) {
            theme.Tabs.init();
          }
        }
      },
      onUnload: function() {
        this.$container.off(this.namespace);
  
        if(this.$gallery) {
          this.$gallery.productGallery('destroy');
          this.$gallery = null;
        }

        $window.unbind('scroll.checkCheckoutLoad');
      }
    });
  
    return ProductPage;
  })();
  
  $(function() {
    theme.sections.register('product-page', theme.ProductPage);
  });
})(jQueryTheme);