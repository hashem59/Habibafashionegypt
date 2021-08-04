(function($){

  'use strict';

  window.theme = window.theme || {};
  
  /*================ Theme ================*/
  if(Shopify && typeof Shopify === 'object') {
      Shopify.addValueToString = function(str, obj) {
          $.each(obj, function(i) {
              str = str.replace('{{ ' + i + ' }}', this);
          });
  
          return str;
      };
      Shopify.handleize = function (str) {
          return str.replace(/[-+!"#$€₹%&'* ,./:;<=>?@[\\\]_`{|}~()°^]+/g, "").toLowerCase().replace(/ς/, 'σ');
      };
      Shopify.handleizeArray = function (arr) {
          var newArr = [],
              i = 0;
  
          for(; i < arr.length; i++) {
              newArr[i] = Shopify.handleize(arr[i]);
          }
  
          return newArr;
      };
      Shopify.formatMoney = function (cents, format) {
          var moneyFormat = '${{amount}}';
  
          if (typeof cents === 'string') {
              cents = cents.replace('.', '');
          }
          var value = '';
          var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
          var formatString = format || moneyFormat;
  
          function formatWithDelimiters(number, precision, thousands, decimal) {
              thousands = thousands || ',';
              decimal = decimal || '.';
  
              if (isNaN(number) || number === null) {
                  return 0;
              }
  
              number = (number / 100.0).toFixed(precision);
  
              var parts = number.split('.');
              var dollarsAmount = parts[0].replace(
                  /(\d)(?=(\d\d\d)+(?!\d))/g,
                  '$1' + thousands
              );
              var centsAmount = parts[1] ? decimal + parts[1] : '';
  
              return dollarsAmount + centsAmount;
          }
  
          switch (formatString.match(placeholderRegex)[1]) {
              case 'amount':
                  value = formatWithDelimiters(cents, 2);
                  break;
              case 'amount_no_decimals':
                  value = formatWithDelimiters(cents, 0);
                  break;
              case 'amount_with_comma_separator':
                  value = formatWithDelimiters(cents, 2, '.', ',');
                  break;
              case 'amount_no_decimals_with_comma_separator':
                  value = formatWithDelimiters(cents, 0, '.', ',');
                  break;
              case 'amount_no_decimals_with_space_separator':
                  value = formatWithDelimiters(cents, 0, ' ');
                  break;
              case 'amount_with_apostrophe_separator':
                  value = formatWithDelimiters(cents, 2, "'");
                  break;
          }
  
          return formatString.replace(placeholderRegex, value);
      };
  }
  theme.Position = function() {
  
      function Position() {
          this.settings = {
              name: 'data-js-position-name',
              desktop: 'data-js-position-desktop',
              mobile: 'data-js-position-mobile',
              all: 'data-js-position-all'
          };
  
          this.selectors = {
              elements: '.js-position'
          };
  
          this.load();
      };
  
      Position.prototype = $.extend({}, Position.prototype, {
          load: function() {
              var _ = this,
                  current_position_is_desktop;
  
              function check_position() {
                  if(current_position_is_desktop !== theme.current.is_desktop) {
                      _.update();
  
                      current_position_is_desktop = theme.current.is_desktop;
                  }
              };
  
              $window.on('theme.resize.position', function() {
                  check_position();
              });
              
              check_position();
  
              var $elements_append_onload = $(this.selectors.elements).filter('[data-js-position-onload]');
  
              this.append($elements_append_onload, this.settings.all);
          },
          update: function(name) {
              var $elements = name ? $('[' + this.settings.name + '="' + name + '"]') : $(this.selectors.elements).not('[data-js-position-onload]'),
                  append_to = theme.current.is_desktop ? this.settings.desktop : this.settings.mobile;
              
              this.append($elements, append_to);
          },
          append: function($elements, append_to) {
              var _ = this;
              
              $elements.each(function() {
                  var $this = $(this),
                      append_to_name = $this.attr(_.settings.name);
  
                  var $append_to = $('[' + append_to + '="' + append_to_name + '"]');
  
                  if($append_to.length && !$.contains($append_to[0], $this[0])) {
                      if($append_to.find('[' + _.settings.name + '="' + append_to_name + '"]').length) {
                          $this.remove();
                      } else {
                          $this.appendTo($append_to);
                      }
                  }
              });
          }
      });
  
      theme.Position = new Position;
  };
  theme.Dropdown = function() {
  
      var settings = {
          namespace: '.dropdown'
      };
  
      function Dropdown() {
          this.selectors = {
              element: '.js-dropdown',
              button: '[data-js-dropdown-button]',
              dropdown: '[data-js-dropdown]'
          };
  
          this.load();
      };
  
      Dropdown.prototype = $.extend({}, Dropdown.prototype, {
          duration: function () {
              return theme.animations.dropdown.duration * 1000;
          },
          load: function() {
              var _ = this;
  
              theme.Global.responsiveHandler({
                  namespace: settings.namespace,
                  element: $body,
                  delegate: this.selectors.button + ', ' + this.selectors.dropdown,
                  on_desktop: true,
                  events: {
                      'show hide close': function(e) {
                          var $elem = $(this).parents(_.selectors.element),
                              $btn = $elem.find(_.selectors.button),
                              $dropdown = $elem.find(_.selectors.dropdown);
  
                          _['_' + e.type]($elem, $dropdown, $btn);
                      }
                  }
              });
  
              theme.Global.responsiveHandler({
                  namespace: settings.namespace,
                  element: $body,
                  delegate: this.selectors.button,
                  on_desktop: true,
                  events: {
                      'mouseenter': function() {
                          var $this = $(this),
                              $elem = $this.parents(_.selectors.element),
                              $dropdown = $elem.find(_.selectors.dropdown);
  
                          if(!$this.hasClass('active') && !$dropdown.hasClass('show')) {
                              _._show($elem, $dropdown, $this);
                          }
                      },
                      'mousedown': function(e) {
                          var $this = $(this),
                              $elem = $this.parents(_.selectors.element),
                              $dropdown = $elem.find(_.selectors.dropdown);
  
                          if(!$this.hasClass('active')) {
                              _._show($elem, $dropdown, $this, true);
  
                              $body.one('mousedown' + settings.namespace, function (e) {
                                  if(!$(e.target).parents(_.selectors.dropdown + ', ' + _.selectors.button).length) {
                                      $(_.selectors.dropdown).trigger('hide');
                                  }
                              });
                          } else {
                              _._hide($elem, $dropdown, $this);
                          }
  
                          e.preventDefault();
                          return false;
                      }
                  }
              });
  
              theme.Global.responsiveHandler({
                  namespace: settings.namespace,
                  element: $body,
                  delegate: this.selectors.element,
                  on_desktop: true,
                  events: {
                      'mouseleave': function() {
                          var $this = $(this),
                              $btn = $this.find(_.selectors.button),
                              $dropdown = $this.find(_.selectors.dropdown);
  
                          if(!$btn.hasClass('active')) {
                              _._hide($this, $dropdown, $btn);
                          }
                      }
                  }
              });
          },
          _show: function ($elem, $dropdown, $btn, is_click) {
              $(this.selectors.dropdown).not($dropdown).trigger('close');
  
              if(is_click) {
                  $btn.addClass('active');
              }
  
              if($dropdown.hasClass('show')) {
                  return;
              }
  
              $(this.selectors.element).removeClass('hovered');
              $elem.addClass('hovered');
  
              $dropdown.addClass('show animate');
  
              if(window.edge) {
                  $dropdown.addClass('visible');
              } else {
                  $dropdown.velocity('stop', true).removeAttr('style');
  
                  $dropdown.velocity('slideDown', {
                      duration: this.duration(),
                      begin: function () {
                          setTimeout(function () {
                              $dropdown.addClass('visible');
                          }, 0);
                      },
                      complete: function () {
                          $dropdown.removeAttr('style');
                      }
                  });
              }
          },
          _hide: function ($elem, $dropdown, $btn) {
              if(window.edge) {
                  $dropdown.removeClass('show animate visible');
                  $elem.removeClass('hovered');
              } else {
                  $dropdown.velocity('stop', true);
  
                  $dropdown.velocity('slideUp', {
                      duration: this.duration(),
                      begin: function () {
                          $dropdown.removeClass('visible');
                      },
                      complete: function () {
                          $dropdown.removeClass('show animate').removeAttr('style');
                          $elem.removeClass('hovered');
                      }
                  });
              }
  
              $btn.removeClass('active');
              $body.unbind('click' + settings.namespace);
          },
          _close: function ($dropdown, $btn) {
              $dropdown.velocity('stop');
              $dropdown.removeClass('show animate visible').removeAttr('style');
              $btn.removeClass('active');
              $body.unbind('click' + settings.namespace);
          }
      });
  
      theme.Dropdown = new Dropdown;
  };
  theme.Select = function() {
      
      var settings = {
          namespace: '.select'
      };
  
      function Select() {
          this.selectors = {
              element: '.js-select',
              dropdown: '[data-js-select-dropdown]'
          };
  
          this.load();
      };
  
      Select.prototype = $.extend({}, Select.prototype, {
          load: function() {
              var _ = this;
  
              $body.on('click', this.selectors.element + ' ' + this.selectors.dropdown + ' span', function() {
                  var $this = $(this);
                  
                  if(($this.parents(_.selectors.dropdown)[0].hasAttribute('data-dropdown-unselected') || !$this.hasClass('selected')) && !$this[0].hasAttribute('disabled')) {
                      var value = $this.attr('data-value'),
                          $dropdown = $this.parents(_.selectors.dropdown),
                          $wrapper = $this.parents('.js-select'),
                          $select = $wrapper.find('select');
  
                      $select.val(value);
  
                      $dropdown.find('span').removeClass('selected');
                      $this.addClass('selected');
  
                      $dropdown.trigger('hide');
  
                      $select.change();
                  }
              });
  
              $body.on('change update' + settings.namespace, this.selectors.element + ' select', function() {
                  var $this = $(this),
                      $dropdown_items = $this.parents(_.selectors.element).find(_.selectors.dropdown + ' span'),
                      value = $this.val();
  
                  $dropdown_items.each(function() {
                      var $this = $(this);
  
                      $this[$this.attr('data-value') == value ? 'addClass' : 'removeClass']('selected');
                  });
              });
  
              $(this.selectors.element + '[data-onload-check] select').trigger('update' + settings.namespace);
          }
      });
  
      theme.Select = new Select;
  };
  theme.Loader = function() {
  
      function Loader() {
          var _ = this;
  
          this.$loader = $('#theme-loader .js-loader');
  
          _.load();
      };
  
      Loader.prototype = $.extend({}, Loader.prototype, {
          load: function () {
              var $loader = $body.find('.js-loader[data-js-page-loader]');
  
              if(!$loader.hasClass('visible')) {
                  $loader.remove();
  
                  return;
              }
              
              $loader.on('transitionend', function () {
                  $loader.remove();
              }).addClass('animate').removeClass('visible');
  
              if($loader.css('transition-duration') === '0s') {
                  $loader.trigger('transitionend');
              }
          },
          set: function($elem, obj) {
              if($elem.length && !$elem.find('> .js-loader').length) {
                  var $clone = this.$loader.clone(),
                      $spinner = $clone.find('[data-js-loader-spinner]'),
                      fixed_offset_l;
  
                  if(obj) {
                      if(obj.bg === false) {
                          $clone.find('[data-js-loader-bg]').remove();
                      }
                      if(obj.spinner === false) {
                          $spinner.remove();
                      }
                      if(obj.fixed === true) {
                          $spinner.addClass('fixed');
  
                          fixed_offset_l = ($elem.innerWidth() / 2 + $elem[0].getBoundingClientRect().left) * 100 / theme.current.width;
  
                          $spinner.css({
                              left: fixed_offset_l + '%'
                          });
                      }
                      if(obj.delay) {
                          $clone.addClass('delay');
                      }
                  }
  
                  $elem.addClass('loading-element');
  
                  $elem.append($clone);
  
                  $clone.addClass('animate');
  
                  setTimeout(function () {
                      $spinner.addClass('animate');
                      $clone.addClass('visible');
                  }, 0);
              }
          },
          unset: function ($elem) {
              $elem.find('> .loader').remove();
              $elem.removeClass('loading-element');
          }
      });
  
      theme.Loader = new Loader;
  };
  
  theme.ButtonsBlocksVisibility = function () {
  
      function ButtonsBlocksVisibility() {
          this.selectors = {
              buttons: '.js-button-block-visibility'
          };
  
          this.load();
      };
  
      ButtonsBlocksVisibility.prototype = $.extend({}, ButtonsBlocksVisibility.prototype, {
          load: function() {
              $('[data-block-visibility]').each(function () {
                  var $this = $(this),
                      name = $this.attr('data-block-visibility');
  
                  if(window.location.href.indexOf(name) != -1) {
                      $this.removeClass('d-none-important');
  
                      $this.find('[data-block-visibility-focus]').focus();
                  }
              });
  
              $body.on('click', this.selectors.buttons, function (e) {
                  var $this = $(this),
                      name = $this.attr('data-block-link'),
                      $block = $('[data-block-visibility="' + name + '"]');
  
                  if(!$block.length) {
                      return;
                  }
  
                  var close_popup = $this.attr('data-action-close-popup');
  
                  if($block.attr('data-block-animate') === 'true') {
                      $block.velocity('stop', true).removeAttr('style');
  
                      if($block.hasClass('d-none-important')) {
                          $block.velocity('stop', true).removeAttr('style');
  
                          $block.velocity('slideDown', {
                              duration: theme.animations.dropdown.duration * 1000,
                              begin: function () {
                                  $block.removeClass('d-none-important');
                                  $this.addClass('open');
                              },
                              complete: function () {
                                  $block.removeAttr('style');
                              }
                          });
                      } else {
                          $block.velocity('slideUp', {
                              duration: theme.animations.dropdown.duration * 1000,
                              begin: function () {
  
                              },
                              complete: function () {
                                  $block.addClass('d-none-important').removeAttr('style');
                                  $this.removeClass('open');
                              }
                          });
                      }
                  } else {
                      $block[$this.attr('data-action') === 'close' ? 'addClass' : $this.attr('data-action') === 'open' ? 'removeClass' : 'toggleClass']('d-none-important');
                  }
  
                  function scrollToBlock() {
                      if(!$block.hasClass('d-none-important') || $this.attr('data-action') === 'open') {
                          if($block[0].hasAttribute('data-block-onscroll')) {
                              var block_t = $block.offset().top,
                                  header_h = theme.StickyHeader && theme.StickyHeader.$sticky ? theme.StickyHeader.$sticky.stickyHeader('getStickyHeight') : 0;
  
                              $('html, body').velocity( 'scroll' , {
                                  offset: block_t - header_h,
                                  duration: 300
                              });
                          }
                      }
                  };
  
                  if(close_popup) {
                      theme.Popups.closeByName(close_popup, null, function () {
                          scrollToBlock();
                      });
                  } else {
                      scrollToBlock();
                  }
  
                  if(!$block.hasClass('d-none-important')) {
                      $block.find('[data-block-visibility-focus]').focus();
                  }
  
                  e.preventDefault();
                  return false;
              });
          }
      });
  
      theme.ButtonsBlocksVisibility = new ButtonsBlocksVisibility;
  };
  theme.Trigger = function() {
  
      function Trigger() {
          this.load();
      };
  
      Trigger.prototype = $.extend({}, Trigger.prototype, {
          load: function () {
              var _ = this;
  
              $body.on('click', '[data-js-trigger]', function () {
                  _.process($(this).attr('data-js-trigger'));
              });
          },
          process: function (id, event) {
              event = event || 'click';
  
              $('[data-js-trigger-id="' + id + '"]').trigger(event);
          }
      });
  
      theme.Trigger = new Trigger;
  };
  theme.dynamicCheckout = function () {
  
      function dynamicCheckout() {
          this.selectors = {
              template_dynamic_checkout: '.template-dynamic-checkout',
              dynamic_checkout: '.js-dynamic-checkout'
          };
  
          this.load();
      };
  
      dynamicCheckout.prototype = $.extend({}, dynamicCheckout.prototype, {
          load: function() {
              const _ = this,
                  $template_dynamic_checkout = $(this.selectors.template_dynamic_checkout);
  
              if($template_dynamic_checkout.length) {
                  $template_dynamic_checkout.replaceWith($($template_dynamic_checkout[0].content).find('[data-js-product-button-dynamic-checkout]'));
                  $template_dynamic_checkout.remove();
              }
  
              $('[data-js-dynamic-checkout-confirmation]').each(function () {
                  _.dynamicCheckoutUpdate($(this));
              });
  
              $body.on('change', '[data-js-dynamic-checkout-confirmation]', function () {
                  _.dynamicCheckoutUpdate($(this));
              });
  
              const $dynamic_checkout = $(this.selectors.dynamic_checkout);
  
              if(!$dynamic_checkout.length) {
                  return;
              }
  
              this.checkCheckoutLoad($dynamic_checkout);
  
              $window.on('scroll.checkCheckoutLoad', function () {
                  _.checkCheckoutLoad($dynamic_checkout);
              });
          },
          dynamicCheckoutUpdate: function ($btn) {
              $btn.parents(this.selectors.dynamic_checkout).find('[data-js-dynamic-checkout-button-wrapper]')[$btn.is(':checked') ? 'removeClass' : 'addClass']('disabled');
          },
          checkCheckoutLoad: function ($dynamic_checkout) {
              if($dynamic_checkout[0].getBoundingClientRect().top < window.innerHeight + 300) {
                  $window.unbind('scroll.checkCheckoutLoad');
                  this.initButton();
              }
          },
          initButton: function ($parent) {
              if (($parent ? $parent.find(this.selectors.dynamic_checkout).length : true) && window.Shopify && Shopify.PaymentButton) {
                  Shopify.PaymentButton.init();
              }
          }
      });
  
      theme.dynamicCheckout = new dynamicCheckout;
  };
  theme.Popups = function() {
  
      function Popups() {
          this.selectors = {
              popup: '.js-popup',
              button: '.js-popup-button',
              button_close: '[data-js-popup-close]',
              bg: '[data-js-popup-bg]'
          };
  
          this.load();
      };
  
      Popups.prototype = $.extend({}, Popups.prototype, {
          load: function() {
              var $popup = $(this.selectors.popup);
  
              if($popup.length) {
                  var _ = this;
  
                  $body.on('click', '[data-js-popup-button="message"]', function() {
                      var $product = $(this).parents('[data-js-product]'),
                          json = $product.attr('data-json-product'),
                          current_id = +$product.attr('data-product-variant-id');
  
                      if(json) {
                          json = JSON.parse(json);
  
                          $.each(json.variants, function () {
                              if(this.id === current_id) {
                                  $('#ContactFormProductUrl').attr('value', theme.domain + '/products/' + json.handle + '?variant=' + current_id);
                                  $('#ContactFormProductSKU').attr('value', this.sku ? this.sku : 'Empty');
  
                                  return false;
                              }
                          });
                      }
                  });
  
                  $body.on('click', this.selectors.button, function(e) {
                      var $this = $(this),
                          name = $this.attr('data-js-popup-button');
  
                      if(_.callByName(name, $this)) {
                          e.preventDefault();
                          return false;
                      }
                  });
  
                  $popup.on('click', this.selectors.button_close, function(e) {
                      var $this = $(this),
                          name = $this.parents('[data-js-popup-name]').attr('data-js-popup-name');
  
                      _.closeByName(name, $this);
  
                      e.preventDefault();
                      return false;
                  });
  
                  $popup.on('click', '[data-js-popup-name]:not([data-disable-bg-click])', function(e) {
                      var $t = $(e.target);
  
                      if($t[0].hasAttribute('data-js-popup-name')) {
                          var name = $t.attr('data-js-popup-name');
  
                          _.closeByName(name, $t);
                      }
                  });
  
                  setTimeout(function() {
                      $popup.find('[data-js-auto-call="true"]').each(function() {
                          _.callByName($(this).attr('data-js-popup-name'));
                      });
                  }, 0);
              }
          },
          loadDynamicContent: function (name, $target) {
              if(!$target) {
                  return;
              }
  
              const id = $target.attr('data-js-popup-dynamic-id');
  
              if(!id) {
                  return;
              }
  
              const $insert = this.getByName(name).find('[data-js-popup-dynamic-insert]');
  
              $insert.html($(`[data-js-popup-dynamic-content="${id}"]`).html());
          },
          getByName: function(name) {
              var $popup = $(this.selectors.popup),
                  $content = $popup.find('[data-js-popup-name="' + name + '"]');
  
              return $content;
          },
          callByName: function(name, $target) {
              var _ = this,
                  $popup = $(this.selectors.popup),
                  $bg = $(this.selectors.bg),
                  $content = $popup.find('[data-js-popup-name="' + name + '"]'),
                  is_ajax = $content.attr('data-js-popup-ajax') !== undefined ? true : false;
  
              function onCall() {
                  $popup.scrollTop(0);
  
                  $bg.one('transitionend', function () {
                      $content.add($bg).removeClass('animate');
  
                      $content.trigger(name + '.' + 'call.after', [$content, $target ? $target : null]);
                  });
  
                  $content.add($bg).addClass('animate');
  
                  setTimeout(function () {
                      $content.add($bg).addClass('visible');
  
                      if($bg.css('transition-duration') === '0s') {
                          $bg.trigger('transitionend');
                      }
                  }, 0);
  
                  if($content[0].hasAttribute('data-js-popup-mobile-only')) {
                      $window.on('theme.changed.breakpoint.popups', function() {
                          if(!theme.current.is_mobile) {
                              _.closeByName(name);
                          }
                      });
                  }
              };
  
              if($content.length) {
                  if(theme.current.is_desktop && $content[0].hasAttribute('data-js-popup-mobile-only')) {
                      return false;
                  }
  
                  $bg.unbind('transitionend');
  
                  $content.trigger(name + '.' + 'call.before', [$content, $target ? $target : null]);
  
                  this.loadDynamicContent(name, $target);
  
                  $popup.addClass('active');
  
                  $popup.find('[data-js-popup-name]').removeClass('show visible');
                  $popup.add($content).addClass('show');
  
                  theme.Global.fixBody();
  
                  if(is_ajax) {
                      $content.addClass('is-process-loading');
  
                      theme.Loader.set($popup, {
                          fixed: true,
                          delay: true
                      });
  
                      $content.on('contentloaded', function () {
                          $content.removeClass('is-process-loading');
  
                          onCall();
  
                          theme.Loader.unset($popup);
                      });
                  } else {
                      onCall();
                  }
  
                  $body.on('keyup.popups', function(e) {
                      if(e.keyCode === 27 && !$body.hasClass('product-gallery-fullscreen')) {
                          _.closeAll();
                      }
                  });
  
                  $popup.attr('tabindex', 10).focus();
  
                  $content.trigger(name + '.' + 'call.visible', [$content, $target ? $target : null]);
  
                  return true;
              } else {
                  return false;
              }
          },
          closeByName: function(name, $target, callback) {
              var $popup = $(this.selectors.popup),
                  $bg = $(this.selectors.bg),
                  $content = $popup.find('[data-js-popup-name="' + name + '"]'),
                  duration = $bg.css('transition-duration');
  
              if($content.length) {
                  $content.unbind('contentloaded').removeClass('is-process-loading');
                  $bg.unbind('transitionend');
                  $body.unbind('keyup.popups');
                  $window.unbind('theme.changed.breakpoint.popups');
  
                  $content.trigger(name + '.' + 'close.before', [$content, $target ? $target : null]);
  
                  theme.Loader.unset($popup);
  
                  $bg.one('transitionend', function () {
                      $popup.add($content).removeClass('show');
                      $content.add($bg).removeClass('animate');
  
                      theme.Global.unfixBody();
  
                      $popup.removeClass('active');
  
                      if(callback) {
                          callback();
                      }
  
                      $popup.attr('tabindex', 0);
  
                      $content.trigger(name + '.' + 'close.after', [$content, $target ? $target : null]);
                  });
  
                  $content.add($bg).addClass('animate');
  
                  if(!$bg.hasClass('visible') || $bg.css('transition-duration') === '0s') {
                      $bg.trigger('transitionend');
                  }
  
                  $content.add($bg).removeClass('visible');
  
                  return true;
              } else {
                  if(callback) {
                      callback();
                  }
                  
                  return false;
              }
          },
          closeAll: function() {
              var _ = this,
                  $popup = $(this.selectors.popup + '.active'),
                  $content = $popup.find('[data-js-popup-name]').filter('.show, .is-process-loading');
              
              if($content.length) {
                  $content.each(function () {
                      _.closeByName($content.attr('data-js-popup-name'));
                  });
  
                  return true;
              } else {
                  return false;
              }
          },
          addHandler: function(name, event, func, handler) {
              handler = handler || 'on';
  
              $body[handler](name + '.' + event, '[data-js-popup-name="' + name + '"]', function(e, $popup, $target) {
                  func($popup, $target);
              });
          },
          removeHandler: function(name, event) {
              $body.unbind(name + '.' + event);
          }
      });
  
      theme.Popups = new Popups;
  };
  
  
  
  theme.PopupAccount = function() {
  
      function PopupAccount() {
          this.settings = {
              popup_name: 'account'
          };
  
          this.selectors = {
              account: '.js-popup-account',
              show_sign_up: '.js-popup-account-show-sign-up'
          };
  
          this.load();
      };
  
      PopupAccount.prototype = $.extend({}, PopupAccount.prototype, {
          load: function() {
              var _ = this;
  
              $body.on('click', this.selectors.show_sign_up, function(e) {
                  var $account = $(_.selectors.account);
  
                  $account.find('.popup-account__login').addClass('d-none-important');
                  $account.find('.popup-account__sign-up').removeClass('d-none-important');
  
                  e.preventDefault();
                  return false;
              });
  
              theme.Popups.addHandler(_.settings.popup_name, 'close.after', function() {
                  var $account = $(_.selectors.account);
  
                  $account.find('.popup-account__login').removeClass('d-none-important');
                  $account.find('.popup-account__sign-up').addClass('d-none-important');
              });
          }
      });
  
      theme.PopupAccount = new PopupAccount;
  };
  
  
  
  theme.PopupSearch = function() {
  
      function PopupSearch() {
          this.settings = {
              popup_name: 'navigation',
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
              search: '.js-popup-search-ajax'
          };
  
          this.load();
      };
  
      PopupSearch.prototype = $.extend({}, PopupSearch.prototype, {
          load: function() {
              var _ = this,
                  q = '',
                  ajax;
  
              function resultToHTML($search, $results, data) {
                  if(data.count > 0) {
                      var $template = $($('#template-popup-search-ajax')[0].content),
                          $fragment = $(document.createDocumentFragment()),
                          limit = +$search.attr('data-js-max-products') - 1;
  
                      $.each(data.results, function(i) {
                          var $item = $template.clone(),
                              $image = $item.find('.product-search__image img'),
                              $title = $item.find('.product-search__title a'),
                              $price = $item.find('.product-search__price .price'),
                              $links = $item.find('a');
  
                          $links.attr('href', this.url);
                          $title.html(this.title);
  
                          if(this.image) {
                              $image.attr('srcset', Shopify.resizeImage(this.image, '200x') + ' 1x, ' + Shopify.resizeImage(this.image, '200x@2x') + ' 2x');
                          } else {
                              $image.remove();
                          }
  
                          if($price.length) {
                              if(this.price) {
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
                  var $results = $search.find('.search__result'),
                      $view_all = $search.find('.search__view-all'),
                      $button_view_all = $view_all.find('a'),
                      $empty_result = $search.find('.search__empty'),
                      $empty_result_link = $empty_result.find('a'),
                      $menu_mobile = $('[data-js-menu-mobile]'),
                      $navigation = $('[data-js-popup-navigation-button]'),
                      navigation_button_status = q === '' ? 'close' : 'search';
  
                  if(data.count === 0) {
                      $empty_result_link.html(Shopify.addValueToString(theme.strings.general.popups.search.empty_html, {
                          'result': q
                      }));
                  }
  
                  $button_view_all.add($empty_result_link).attr('href', theme.routes.search_url + '?q=' + q + '&options[prefix]=last' + (theme.search_show_only_products ? '&type=product' : ''));
                  $view_all[data.count > 0 ? 'removeClass' : 'addClass']('d-none-important');
                  $empty_result[q === '' || data.count > 0 ? 'addClass' : 'removeClass']('d-none-important');
                  $menu_mobile[q === '' ? 'removeClass' : 'addClass']('d-none-important');
  
                  $navigation.attr('data-js-popup-navigation-button', navigation_button_status);
  
                  if(theme.Menu) {
                      theme.Menu.closeMobileMenu();
                  }
  
                  if(theme.VerticalMenu) {
                      theme.VerticalMenu.closeMobileMenu();
                  }
  
                  $results.addClass('invisible');
  
                  resultToHTML($search, $results, data);
  
                  $results.removeClass('invisible');
  
                  theme.Loader.unset($search);
              };
  
              $body.on('keyup', this.selectors.search + ' input', $.debounce(500, function (e) {
                  var $search = $(this).parents(_.selectors.search);
  
                  if(e.keyCode !== 27) {
                      var $this = $(this),
                          value = $this.val(),
                          $content = $search.find('.search__content');
  
                      if(value !== q) {
                          q = value;
  
                          if(q === '') {
                              processResult($search, $content, q, { count: 0 });
                          } else {
                              if (ajax) {
                                  ajax.abort();
                              }
  
                              theme.Loader.set($search);
                              
                              ajax = $.getJSON($.extend(true, {}, (theme.search_predictive_enabled ? _.settings.suggest_search_obj : _.settings.default_search_obj), {
                                  type: 'GET',
                                  data: {
                                      q: q
                                  },
                                  success: function (data) {
                                      var max_count = 6,
                                          products_length = data.resources.results.products.length,
                                          pages_length = data.resources.results.pages ? data.resources.results.pages.length : 0,
                                          formatted_data = {
                                              count: Math.min(products_length + pages_length, max_count),
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
  
              function clear() {
                  var $search = $(_.selectors.search),
                      $content = $search.find('.search__content');
  
                  q = '';
  
                  $search.find('input').val('');
                  processResult($search, $content, q, { count: 0 });
              };
  
              $body.on('keyup', this.selectors.search + ' input', function(e) {
                  if(e.keyCode === 27) {
                      var $search = $(this).parents(_.selectors.search),
                          $content = $search.find('.search__content');
  
                      q = '';
  
                      theme.Popups.closeByName('navigation');
                      processResult($search, $content, q, { count: 0 });
                  }
              });
  
              theme.Popups.addHandler(this.settings.popup_name, 'close.before', function() {
                  clear();
              });
  
              theme.Popups.addHandler(this.settings.popup_name, 'call.after', function($content) {
                  if(theme.current.is_desktop) {
                      $content.find('input').focus();
                  }
              });
  
              theme.Global.responsiveHandler({
                  namespace: '.searchMobileBack',
                  element: $body,
                  delegate: '[data-js-popup-navigation-button="search"]',
                  on_mobile: true,
                  events: {
                      'click': function() {
                          clear();
                      }
                  }
              });
          }
      });
  
      theme.PopupSearch = new PopupSearch;
  };
  
  
  
  theme.PopupQuickView = function() {
  
      function PopupQuickView() {
          this.settings = {
              popup_name: 'quick-view',
              popup_size_guide_name: 'size-guide'
          };
  
          this.load();
      };
  
      PopupQuickView.prototype = $.extend({}, PopupQuickView.prototype, {
          load: function() {
              var _ = this,
                  loader_require_arr = [
                      {type: 'styles', name: 'plugin_slick'},
                      {type: 'scripts', name: 'plugin_slick'},
                      {type: 'scripts', name: 'product_gallery'}
                  ];
  
              if(theme.product.enable_sticky_gallery) {
                  loader_require_arr.push({type: 'scripts', name: 'sticky_sidebar'})
              }
  
              theme.Popups.addHandler(this.settings.popup_name, 'call.visible', function($popup, $target) {
                  var $content = $popup.find('[data-js-quick-view]'),
                      $product = $target.parents('[data-js-product]');
  
                  $content.html('');
                  _.$gallery = null;
  
                  Loader.loadManually(loader_require_arr,
                  function() {
                      _.getProduct($product, function (data) {
                          _.insertContent($content, data);
  
                          if(theme.product.enable_sticky_gallery && theme.StickySidebar) {
                              theme.StickySidebar.reload();
                          }
  
                          $popup.trigger('contentloaded');
                      });
                  });
              });
  
              theme.Popups.addHandler(this.settings.popup_name, 'call.after', function($popup) {
                  theme.ProductCurrency.update();
  
                  if(theme.Tooltip) {
                      theme.Tooltip.init({
                          appendTo: $popup[0]
                      });
                  }
  
                  $popup.find('[data-js-popup-button="size-guide"]').one('click.product-size-guide', function () {
                      var $size_guide = theme.Popups.getByName(_.settings.popup_size_guide_name),
                          $product_size_guide_content,
                          $size_guide_content;
  
                      if($size_guide.length) {
                          $product_size_guide_content = $popup.find('[data-product-size-guide-content]');
                          $size_guide_content = $size_guide.find('[data-popup-size-guide-content]');
  
                          if($product_size_guide_content.length) {
                              function removeProductSizeGuide() {
                                  $size_guide_content = $size_guide.find('[data-popup-size-guide-content]');
  
                                  $size_guide_content.find('[data-product-size-guide-content]').remove();
                                  $size_guide_content.children().removeClass('d-none');
                              };
  
                              $size_guide_content.children().addClass('d-none');
                              $size_guide_content.append($product_size_guide_content.removeClass('d-none'));
  
                              theme.Popups.addHandler(_.settings.popup_size_guide_name, 'close.after', function() {
                                  removeProductSizeGuide();
                              }, 'one');
                          }
                      }
                  });
              });
  
              theme.Popups.addHandler(this.settings.popup_name, 'close.after', function($popup) {
                  var $content = $popup.find('[data-js-quick-view]');
  
                  if (_.ajax) {
                      _.ajax.abort();
                  }
  
                  if(_.$gallery && _.$gallery.length) {
                      _.$gallery.productGallery('destroy');
                      _.$gallery = null;
                  }
  
                  $content.html('');
  
                  if(theme.product.enable_sticky_gallery && theme.StickySidebar) {
                      theme.StickySidebar.reload();
                  }
                  
                  $popup.find('[data-js-popup-button="size-guide"]').unbind('click.product-size-guide');
              });
          },
          getProduct: function ($product, success) {
              if (this.ajax) {
                  this.ajax.abort();
              }
  
              var handle = $product.attr('data-product-handle'),
                  variant_url = '';
  
              if(!$product.get(0).hasAttribute('data-qv-check-change') || !$product.find('[data-property][data-disable-auto-select]').length) {
                  variant_url = '?variant=' + $product.attr('data-product-variant-id');
              }
  
              if(handle) {
                  this.ajax = $.ajax({
                      type: 'GET',
                      url: 'https://' + window.location.hostname + '/products/' + handle + variant_url,
                      data: {
                          view: 'quick-view'
                      },
                      dataType: 'html',
                      success: function (data) {
                          success(data);
                      }
                  });
              }
          },
          insertContent: function ($content, data) {
              $content.html(data);
  
              var $product = $content.find('[data-js-product]'),
                  $gallery = $product.find('[data-js-product-gallery]'),
                  $countdown = $product.find('[data-js-product-countdown] .js-countdown'),
                  $text_countdown = $product.find('.js-text-countdown'),
                  $visitors = $product.find('.js-visitors');
  
              if($gallery.length) {
                  this.$gallery = $gallery;
  
                  $gallery.productGallery();
              }
  
              theme.dynamicCheckout.initButton($product);
  
              theme.ImagesLazyLoad.update();
  
              theme.ProductReview.update();
  
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
          }
      });
  
      theme.PopupQuickView = new PopupQuickView;
  };
  
  
  
  theme.ProductCurrency = function() {
  
      function ProductCurrency() {
  
      };
  
      ProductCurrency.prototype = $.extend({}, ProductCurrency.prototype, {
          load: function() {
              if(theme.multipleСurrencies) {
                  var cookieCurrency;
                  
                  try {
                      cookieCurrency = Currency.cookie.read();
                  } catch(err) {}
                  
                  $('span.money span.money').each(function () {
                      $(this).parents('span.money').removeClass('money');
                  });
  
                  $('span.money').each(function () {
                      $(this).attr('data-currency-' + Currency.shopCurrency, $(this).html());
                  });
  
                  if (cookieCurrency == null) {
                      if (Currency.shopCurrency !== Currency.defaultCurrency) {
                          Currency.convertAll(Currency.shopCurrency, Currency.defaultCurrency);
                      } else {
                          Currency.currentCurrency = Currency.defaultCurrency;
                      }
                  } else if (cookieCurrency === Currency.shopCurrency) {
                      Currency.currentCurrency = Currency.shopCurrency;
                  } else {
                      Currency.convertAll(Currency.shopCurrency, cookieCurrency);
                  }
              }
          },
          setCurrency: function(newCurrency) {
              if(theme.multipleСurrencies) {
                  if (newCurrency == Currency.currentCurrency) {
                      Currency.convertAll(Currency.shopCurrency, newCurrency);
                  } else {
                      Currency.convertAll(Currency.currentCurrency, newCurrency);
                  }
              }
          },
          setPrice: function($price, price_origin, compare_at_price_origin) {
              var price = +price_origin,
                  compare_at_price = +compare_at_price_origin;
  
              var html = '',
                  sale = compare_at_price && compare_at_price > price;
  
              $price[sale ? 'addClass' : 'removeClass']('price--sale');
  
              if(sale) {
                  html += '<span>';
                  html += Shopify.formatMoney(compare_at_price_origin, theme.moneyFormat);
                  html += '</span>';
  
                  if($price[0].hasAttribute('data-js-show-sale-separator')) {
                      html += theme.strings.price_sale_separator;
                  }
              }
  
              html += '<span>';
              html += Shopify.formatMoney(price_origin, theme.moneyFormat);
              html += '</span>';
  
              $price.html(html);
          },
          setPriceFull: function ($price, data) {
              const {price, compare_at_price, unit_price, unit_price_measurement} = data,
                  priceHTML = `<span>${Shopify.formatMoney(price, theme.moneyFormat)}</span>`,
                  isSale = compare_at_price && parseInt(compare_at_price) > parseInt(price),
                  compareAtPriceHTML = isSale ? `<span>${Shopify.formatMoney(compare_at_price, theme.moneyFormat)}</span>${theme.priceShowSaleSeparator ? theme.strings.price_sale_separator : ''}` : '';
  
              let resultHTML = `<span class="price${isSale ? ' price--sale' : ''}" data-js-product-price>${compareAtPriceHTML}${priceHTML}</span>`;
  
              if(unit_price) {
                  resultHTML = resultHTML + `
                      <span class="price-unit d-block mt-5">
                          <label class="d-none">${theme.strings.unit_price}</label>
                          <span class="price-unit__price">
                              (<span>${Shopify.formatMoney(unit_price, theme.moneyFormat)}</span>
                              <span> / </span><span class="d-none"> ${theme.strings.price_sale_separator} </span>
                              <span>${(unit_price_measurement && unit_price_measurement.reference_value !== 1 ? unit_price_measurement.reference_value : '')}${(unit_price_measurement.reference_unit ? unit_price_measurement.reference_unit : '')})</span>
                          </span>
                      </span>
                      `;
              }
  
              $price.html(resultHTML);
          },
          update: function() {
              if(theme.multipleСurrencies) {
                  Currency.convertAll(Currency.shopCurrency, Currency.currentCurrency);
              }
          }
      });
  
      theme.ProductCurrency = new ProductCurrency;
  };
  theme.ProductQuantity = function() {
  
      function ProductQuantity() {
          this.selectors = {
              quantity: '.js-product-quantity'
          };
  
          this.load();
      };
  
      ProductQuantity.prototype = $.extend({}, ProductQuantity.prototype, {
          load: function() {
              var _ = this;
  
              $body.on('click', this.selectors.quantity + ' [data-control]', function(e) {
                  var $this = $(this),
                      $quantity = $this.parents(_.selectors.quantity),
                      $input = $quantity.find('input'),
                      direction = $this.attr('data-control'),
                      min = $input.attr('min') || 1,
                      max = $input.attr('max') || Infinity,
                      val = +$input.val(),
                      set_val;
  
                  if(!$.isNumeric(val)) {
                      $input.val(min);
                      return;
                  }
  
                  if(direction === '+') {
                      set_val = ++val;
                  } else if(direction === '-') {
                      set_val = --val;
                  }
  
                  if(set_val < min) {
                      set_val = min;
                  } else if(set_val > max) {
                      set_val = max;
                  }
  
                  if(set_val < 0) {
                      set_val = 0;
                  }
  
                  $input.val(set_val);
                  $input.trigger('custom.change');
  
                  _.dublicate($quantity);
              });
  
              $(document).on('keydown', this.selectors.quantity + ' input', function (e) {
                  var keyArr = [8, 9, 27, 37, 38, 39, 40, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105];
  
                  if($.inArray(e.keyCode, keyArr) === -1) {
                      e.preventDefault();
                      return false;
                  }
              });
  
              $(document).on('focus', this.selectors.quantity + ' input', function () {
                  $(this).select();
              });
  
              $(document).on('blur', this.selectors.quantity + ' input', function () {
                  var $this = $(this),
                      $quantity = $this.parents(_.selectors.quantity),
                      val = +$this.val(),
                      min = $this.attr('min') || 1,
                      max = $this.attr('max') || Infinity;
  
                  if(!$.isNumeric(val) || val < min) {
                      $this.val(min);
                  } else if(val > max) {
                      $this.val(max);
                  }
  
                  _.dublicate($quantity);
              });
          },
          dublicate: function ($quantity) {
              var connect = $quantity.attr('data-js-quantity-connect');
  
              if($quantity.length && connect !== undefined) {
                  var $input = $(this.selectors.quantity + '[data-js-quantity-connect="' + connect + '"]').find('input'),
                      value = $quantity.find('input').val();
  
                  $input.val(value);
                  $input.trigger('custom.change');
              }
          }
      });
  
      theme.ProductQuantity = new ProductQuantity;
  };
  theme.ProductCountdown = function() {
  
      function ProductCountdown() {
          this.selectors = {
  
          };
  
          this.load();
      };
      
      ProductCountdown.prototype = $.extend({}, ProductCountdown.prototype, {
          load: function() {
              this.init($('.js-countdown[data-date]').not('.countdown--init'));
          },
          init: function($elems) {
              var $countdown = $elems.filter('[data-date]').not('.js-countdown--lazy').not('.countdown--init');
  
              function initialize() {
                  $countdown.each(function () {
                      var $this = $(this),
                          date = $this.data('date');
  
                      if(!date) {
                          return;
                      }
  
                      var hideZero = $this.data('hidezero') || true;
  
                      //remove timezone
                      var remove_from = date.indexOf(' +');
  
                      if(remove_from !== -1) {
                          date = date.slice(0, remove_from);
                      }
                      //END:remove timezone
  
                      var date_obj = new Date(date.replace(/-/g, "/"));
  
                      if(date_obj.getTime() - new Date().getTime() <= 0) {
                          $this.addClass('d-none-important');
                          return;
                      }
  
                      var t = $this.countdown(date_obj, function (e) {
                          var format = '',
                              structure = [
                                  ['totalDays', theme.strings.countdown.days],
                                  ['hours', theme.strings.countdown.hours],
                                  ['minutes', theme.strings.countdown.minutes],
                                  ['seconds', theme.strings.countdown.seconds]
                              ];
  
                          for(var i = 0; i < structure.length; i++) {
                              var prop = structure[i][0],
                                  time = e.offset[prop],
                                  postfix = structure[i][1];
  
                              if (i === 0 && time === 0 && hideZero === true) {
                                  continue;
                              }
  
                              if($this.hasClass('countdown--type-01')) {
                                  format += '<span class="countdown__section">' +
                                      '<span class="countdown__time">' + time + '</span>' +
                                      '<span class="countdown__postfix">' + postfix + '</span>' +
                                      '</span>';
  
                              } else if($this.hasClass('countdown--type-02')) {
                                  if(time < 10) time = '0' + time;
                                  else time += '';
  
                                  format += '<span class="countdown__section">' +
                                      '<span class="countdown__time">';
  
                                  for(var j = 0; j < time.length; j++) {
                                      format += '<span>' + time.charAt(j) + '</span>';
                                  }
  
                                  format += '</span>' +
                                      '<span class="countdown__postfix">' + postfix + '</span>' +
                                      '</span>';
                              }
                          }
  
                          $(this).html(format);
                      });
  
                      $this.parents('[data-js-product-countdown]').removeClass('d-none-important');
  
                      $this.addClass('countdown--init');
                  });
              };
  
              if($countdown.length) {
                  Loader.loadManually([
                      {type: 'scripts', name: 'plugin_countdown'}
                  ],
                  function() {
                      initialize();
                  });
              }
          },
          destroy: function($countdown) {
              if($countdown.hasClass('countdown--init')) {
                  $countdown.countdown('remove').off().removeClass('countdown--init').html('');
              }
          },
          reinit: function($countdown, date) {
              this.destroy($countdown);
  
              var $new_countdown = $countdown.clone();
  
              $countdown.replaceWith($new_countdown);
  
              $countdown.remove();
  
              if(date) {
                  $new_countdown.attr('data-date', date);
              }
  
              this.init($new_countdown);
          }
      });
  
      theme.ProductCountdown = new ProductCountdown;
  };
  theme.ProductTextCountdown = function() {
  
      function ProductTextCountdown() {
          this.selectors = {
  
          };
  
          this.load();
      };
  
      ProductTextCountdown.prototype = $.extend({}, ProductTextCountdown.prototype, {
          load: function() {
              this.init($('.js-text-countdown').not('.text-countdown--init'));
          },
          init: function($elems) {
              var $countdown = $elems.not('.text-countdown--init');
  
              function initialize() {
                  $countdown.each(function () {
                      var $this = $(this),
                          $counter = $this.find('[data-js-text-countdown-counter]'),
                          $date = $this.find('[data-js-text-countdown-delivery]'),
                          reset_time = +$this.attr('data-reset-time'),
                          delivery_time = +$this.attr('data-delivery-time'),
                          delivery_format = $this.attr('data-delivery-format'),
                          delivery_excludes = $this.attr('data-delivery-excludes').replace(/ /gi, '').toLowerCase().split(','),
                          hideZero = $this.attr('data-hidezero') || true,
                          date_counter = new Date(),
                          structure = [
                              ['hours', theme.strings.text_countdown.hours.toLowerCase()],
                              ['minutes', theme.strings.text_countdown.minutes.toLowerCase()]
                          ],
                          days_of_week = [
                              theme.strings.text_countdown.days_of_week.sunday,
                              theme.strings.text_countdown.days_of_week.monday,
                              theme.strings.text_countdown.days_of_week.tuesday,
                              theme.strings.text_countdown.days_of_week.wednesday,
                              theme.strings.text_countdown.days_of_week.thursday,
                              theme.strings.text_countdown.days_of_week.friday,
                              theme.strings.text_countdown.days_of_week.saturday
                          ],
                          finalyDeliveryTime,
                          date_now,
                          date_delivery,
                          delivery_html,
                          format_text,
                          prop,
                          time,
                          postfix,
                          i,
                          j;
  
                      date_counter.setDate(date_counter.getDate() + 1);
                      date_counter.setHours(reset_time, 0, 0, 0);
  
                      var t = $counter.countdown(date_counter, function (e) {
                          delivery_html = delivery_format.toLowerCase();
                          format_text = '';
                          finalyDeliveryTime = delivery_time;
  
                          var startExcludesDate = 0,
                              endExcludesDate;
  
                          for (i = 0; i < structure.length; i++) {
                              prop = structure[i][0];
                              time = e.offset[prop];
                              postfix = structure[i][1];
  
                              if (i === 0 && time === 0 && hideZero === true) {
                                  continue;
                              }
  
                              if (i !== 0) {
                                  format_text += ' ';
                              }
  
                              format_text += time + ' ' + postfix;
                          }
  
                          $(this).html(format_text);
  
                          date_now = new Date();
                          date_delivery = new Date();
  
                          if (date_now.getHours() >= date_counter.getHours() && date_now.getMinutes() >= date_counter.getMinutes() && date_now.getSeconds() >= date_counter.getSeconds()) {
                              finalyDeliveryTime = finalyDeliveryTime + 1;
                              startExcludesDate = startExcludesDate + 1;
                          }
  
                          endExcludesDate = delivery_time + startExcludesDate + 1;
  
                          for (j = startExcludesDate; j < endExcludesDate; j++) {
                              var currentDate = new Date();
  
                              currentDate.setDate(currentDate.getDate() + j);
  
                              if (delivery_excludes.indexOf(days_of_week[currentDate.getDay()].toLowerCase()) !== -1) {
                                  date_delivery.setDate(date_delivery.getDate() + 1);
                                  endExcludesDate++;
                              }
                          }
  
                          date_delivery.setDate(date_delivery.getDate() + finalyDeliveryTime);
  
                          delivery_html = delivery_html.replace('day', days_of_week[date_delivery.getDay()])
                              .replace('dd', ('0' + date_delivery.getDate()).slice(-2))
                              .replace('mm', ('0' + (date_delivery.getMonth() + 1)).slice(-2))
                              .replace('yyyy', date_delivery.getFullYear())
                              .replace('yy', date_delivery.getFullYear().toString().slice(-2));
  
                          $date.html(delivery_html);
                      });
  
                      $this.addClass('text-countdown--init');
                  });
              };
  
              if($countdown.length) {
                  Loader.loadManually([
                      {type: 'scripts', name: 'plugin_countdown'}
                  ],
                  function() {
                      initialize();
                  });
              }
          },
          destroy: function($countdown) {
              if($countdown.hasClass('text-countdown--init')) {
                  $countdown.countdown('remove').off().removeClass('text-countdown--init').html('');
              }
          }
      });
  
      theme.ProductTextCountdown = new ProductTextCountdown;
  };
  theme.ProductVisitors = function() {
  
      function ProductVisitors() {
          this.selectors = {
  
          };
  
          this.load();
      };
  
      ProductVisitors.prototype = $.extend({}, ProductVisitors.prototype, {
          load: function() {
              this.init($('.js-visitors').not('.visitors--init'));
          },
          init: function($elems) {
              var $countdown = $elems.not('.visitors--init');
  
              function randomInteger(min, max) {
                  return Math.round(min - 0.5 + Math.random() * (max - min + 1));
              };
  
              $countdown.each(function () {
                  var $this = $(this),
                      $counter = $this.find('[data-js-counter]'),
                      min = $this.attr('data-min'),
                      max = $this.attr('data-max'),
                      interval_min = $this.attr('data-interval-min'),
                      interval_max = $this.attr('data-interval-max'),
                      stroke = +$this.attr('data-stroke'),
                      current_value,
                      new_value;
  
                  $this.addClass('visitors--processing');
  
                  function update() {
                      setTimeout(function() {
                          if(!$this.hasClass('visitors--processing')) {
                              return;
                          }
  
                          current_value = +$counter.text();
                          new_value = randomInteger(min, max);
  
                          if(Math.abs(current_value - new_value) > stroke) {
                              new_value = new_value > current_value ? current_value + stroke : current_value - stroke;
                              new_value = randomInteger(current_value, new_value);
                          }
  
                          $counter.text(new_value);
  
                          update();
                      }, randomInteger(interval_min, interval_max) * 1000);
                  };
  
                  update();
  
                  $this.addClass('visitors--init');
              });
          },
          destroy: function($countdown) {
              if($countdown.hasClass('visitors--init')) {
                  $countdown.off().removeClass('visitors--processing visitors--init').html('');
              }
          }
      });
  
      theme.ProductVisitors = new ProductVisitors;
  };
  theme.ProductImagesNavigation = function() {
  
      function ProductImagesNavigation() {
          this.selectors = {
              images_nav: '.js-product-images-navigation'
          };
  
          this.load();
      };
  
      ProductImagesNavigation.prototype = $.extend({}, ProductImagesNavigation.prototype, {
          load: function() {
              var _ = this;
  
              $body.on('click', '[data-js-product-images-navigation]:not([data-disabled])', function() {
                  var $this = $(this),
                      $product = $this.parents('[data-js-product]'),
                      direction = $this.attr('data-js-product-images-navigation');
  
                  theme.ProductImagesHover.disable($product.find('img'));
  
                  var data = theme.ProductOptions.switchByImage($product, direction, null, function (data) {
                      _._updateButtons($product, data.is_first, data.is_last);
                  });
              });
          },
          switch: function($product, data) {
              var $image_container = $product.find('[data-js-product-image]'),
                  $image,
                  image,
                  src,
                  master_src;
  
              if($image_container.length) {
                  $image = $image_container.find('img');
                  image = data.update_variant.featured_image;
  
                  theme.ProductImagesHover.disable($image);
  
                  if(!image || !image.src) {
                      if(data.json.images[0]) {
                          image = data.json.images[0];
                      }
                  }
  
                  if(image && image.src && +image.id !== +$image.attr('data-image-id')) {
                      src = Shopify.resizeImage(image.src, Math.ceil($image_container.width()) + 'x') + ' 1x, ' + Shopify.resizeImage(image.src, Math.ceil($image_container.width()) * 2 + 'x') + ' 2x';
                      master_src = Shopify.resizeImage(image.src, '{width}x');
  
                      this.changeSrc($image, src, image.id, master_src);
  
                      if($image.parents(this.selectors.images_nav).length) {
                          this._updateButtons($product, +data.json.images[0].id === +image.id, +data.json.images[data.json.images.length - 1].id === +image.id);
                      }
                  }
              }
          },
          changeSrc: function ($image, srcset, id, master_src) {
              var $parent = $image.parent();
  
              id = id || 'null';
  
              theme.Loader.set($parent);
  
              $image.one('load', function () {
                  theme.Loader.unset($parent);
              });
              
              $image.attr('srcset', srcset).attr('data-image-id', id);
  
              if(master_src) {
                  $image.attr('data-master', master_src);
              }
          },
          _updateButtons: function($product, is_first, is_last) {
              $product.find('[data-js-product-images-navigation="prev"]')[is_first ? 'attr' : 'removeAttr']('data-disabled', 'disabled');
              $product.find('[data-js-product-images-navigation="next"]')[is_last ? 'attr' : 'removeAttr']('data-disabled', 'disabled');
          }
      });
  
      theme.ProductImagesNavigation = new ProductImagesNavigation;
  };
  
  
  
  theme.ProductImagesHover = function() {
  
      function ProductImagesHover() {
          this.selectors = {
              images_hover: '.js-product-images-hover',
              images_hovered_end: '.js-product-images-hovered-end'
          };
  
          this.load();
      };
  
      ProductImagesHover.prototype = $.extend({}, ProductImagesHover.prototype, {
          load: function() {
              function changeImage($wrap, $image, url, id) {
                  var srcset = theme.ImagesLazyLoad.buildSrcset($image, url);
  
                  $wrap.attr('data-js-product-image-hover-id', $image.attr('data-image-id'));
  
                  theme.ProductImagesNavigation.changeSrc($image, srcset, id);
              };
  
              theme.Global.responsiveHandler({
                  namespace: '.product-collection.images.hover',
                  element: $body,
                  delegate: this.selectors.images_hover,
                  on_desktop: true,
                  events: {
                      'mouseenter': function() {
                          var $this = $(this),
                              $image = $this.find('img'),
                              url = $this.attr('data-js-product-image-hover'),
                              id = $this.attr('data-js-product-image-hover-id');
  
                          if(url) {
                              changeImage($this, $image, url, id);
  
                              $this.one('mouseleave', function () {
                                  var url = $image.attr('data-master'),
                                      id = $this.attr('data-js-product-image-hover-id');
                                  
                                  changeImage($this, $image, url, id);
                              });
                          }
                      }
                  }
              });
  
              theme.Global.responsiveHandler({
                  namespace: '.product-collection.images.hoveredend',
                  element: $body,
                  delegate: this.selectors.images_hovered_end,
                  on_desktop: true,
                  events: {
                      'mouseenter': function() {
                          var $this = $(this),
                              timeout;
  
                          timeout = setTimeout(function () {
                              $this.addClass('hovered-end');
                          }, theme.animations.css.duration * 1000);
  
                          $this.one('mouseleave', function () {
                              clearTimeout(timeout);
                          });
                      },
                      'mouseleave': function() {
                          $(this).removeClass('hovered-end');
                      }
                  }
              });
          },
          disable: function ($image) {
              $image.parents(this.selectors.images_hover).removeClass('js-product-images-hover').unbind('mouseleave');
          }
      });
  
      theme.ProductImagesHover = new ProductImagesHover;
  };
  
  
  
  theme.ProductOptions = function() {
  
      function ProductOptions() {
          this.selectors = {
              options: '.js-product-options',
              options_attr: '[data-js-product-options]'
          };
  
          this.afterChange = [];
  
          this.load();
      };
  
      ProductOptions.prototype = $.extend({}, ProductOptions.prototype, {
          load: function() {
              var _ = this,
                  timeout,
                  xhr;
  
              function onProcess(e) {
                  var $this = $(this),
                      $options = $this.parents(_.selectors.options),
                      $section = $this.parents('[data-property]');
  
                  if ($this.hasClass('disabled') || ($this.hasClass('active') && !$section[0].hasAttribute('data-disable-auto-select'))) {
                      return;
                  }
  
                  var $values = $section.find('[data-js-option-value]'),
                      $product = $this.parents('[data-js-product]'),
                      json = $product.attr('data-json-product'),
                      current_values = [],
                      update_variant = null;
  
                  $values.removeClass('active');
                  $this.filter('[data-js-option-value]').addClass('active');
  
                  $section.removeAttr('data-disable-auto-select');
  
                  _._loadJSON($product, json, function (json) {
                      var $active_values = $options.find('[data-js-option-value].active').add($options.find('option[data-value]:selected'));
  
                      $.each($active_values, function() {
                          var $this = $(this);
  
                          current_values.push($this.attr('data-value'));
                      });
  
                      $options.find('[data-js-option-value]').removeClass('active');
  
                      $.each(json.variants, function() {
                          if(current_values.join(' / ') === Shopify.handleizeArray(this.options).join(' / ')) {
                              if(!this.available && theme.product.hide_options_without_availability_variants) {
                                  return false;
                              }
                              
                              update_variant = this;
  
                              return false;
                          }
                      });
  
                      if(!update_variant && current_values.length > 1) {
                          $.each(json.variants, function() {
                              if(current_values[0] === Shopify.handleize(this.options[0]) && current_values[1] === Shopify.handleize(this.options[1])) {
                                  if(!this.available) {
                                      if(update_variant || theme.product.hide_options_without_availability_variants) {
                                          return;
                                      }
                                  }
  
                                  update_variant = this;
  
                                  if(this.available) {
                                      return false;
                                  }
                              }
                          });
                      }
  
                      if(!update_variant) {
                          $.each(json.variants, function() {
                              if(current_values[0] === Shopify.handleize(this.options[0])) {
                                  if(!this.available) {
                                      if(update_variant || theme.product.hide_options_without_availability_variants) {
                                          return;
                                      }
                                  }
  
                                  update_variant = this;
  
                                  if(this.available) {
                                      return false;
                                  }
                              }
                          });
                      }
  
                      if(!update_variant) {
                          update_variant = _._getDefaultVariant(json);
                      }
  
                      _._updatePossibleVariants($product, {
                          update_variant: update_variant,
                          json: json
                      });
  
                      $.each(update_variant.options, function(i, k) {
                          var $prop = $options.find('[data-property]').eq(i);
  
                          $prop.find('[data-js-option-value][data-value="' + Shopify.handleize(k) + '"]').addClass('active');
                          $prop.filter('[data-js-option-select]').val(Shopify.handleize(k)).trigger('change', [ true ]);
                      });
  
                      _._switchVariant($product, {
                          update_variant: update_variant,
                          json: json,
                          has_unselected_options: $product.find('[data-property][data-disable-auto-select]').length ? true : false
                      });
                  });
              };
  
              $body.on('click', this.selectors.options + ' [data-js-option-value]', onProcess);
  
              $body.on('mouseenter', this.selectors.options + '[data-js-options-onhover] [data-js-option-value]', $.debounce(400, onProcess));
  
              $body.on('change', '[data-js-product] [data-js-option-select]', function (e, onupdate) {
                  if(onupdate) {
                      return;
                  }
  
                  var $this = $(this).find('option[data-value]:selected');
                  
                  $(this).parents('.select').find('[data-js-select-dropdown]').removeAttr('data-dropdown-unselected');
  
                  onProcess.call($this, e);
              });
  
              $body.on('change', '[data-js-product-variants="control"]', function () {
                  var $this = $(this),
                      $product = $this.parents('[data-js-product], [data-js-product-clone]'),
                      dontUpdateVariantsSelect = true,
                      updateProductOptions = false;
                  
                  if($product[0].hasAttribute('data-js-product-clone')) {
                      $product = $('[data-js-product-clone-id="' + $product[0].getAttribute('data-js-product-clone') + '"]');
                      dontUpdateVariantsSelect = false;
                      updateProductOptions = true;
                  }
  
                  var id = $this.find('option:selected').attr('value'),
                      json = $product.attr('data-json-product'),
                      update_variant = null;
  
                  _._loadJSON($product, json, function (json) {
                      $.each(json.variants, function() {
                          if(+this.id === +id) {
                              update_variant = this;
                              return false;
                          }
                      });
  
                      _._switchVariant($product, {
                          update_variant: update_variant,
                          json: json,
                          dontUpdateVariantsSelect: dontUpdateVariantsSelect,
                          updateProductOptions: updateProductOptions
                      });
                  });
              });
  
              theme.Global.responsiveHandler({
                  namespace: '.product.load-json',
                  element: $body,
                  delegate: '[data-js-product][data-js-product-json-preload]',
                  on_desktop: true,
                  events: {
                      'mouseenter': function() {
                          var $this = $(this);
  
                          clearTimeout(timeout);
  
                          timeout = setTimeout(function () {
                              if(!$this.attr('data-json-product')) {
                                  xhr = _._loadJSON($this, null, function() {
                                      xhr = null;
                                  }, false);
                              }
                          }, 300);
                      },
                      'mouseleave': function() {
                          clearTimeout(timeout);
  
                          if(xhr) {
                              xhr.abort();
                              xhr = null;
                          }
                      }
                  }
              });
          },
          _loadJSON: function ($product, json, callback, animate) {
              if($product[0].hasAttribute('data-js-process-ajax-loading-json')) {
                  $product.one('json-loaded', function () {
                      if(callback) {
                          callback(JSON.parse($product.attr('data-json-product')));
                      }
                  });
  
                  return;
              }
  
              animate = animate === undefined ? true : animate;
  
              if(json) {
                  if(callback) {
                      callback(typeof json == 'object' ? json : JSON.parse(json));
                  }
              } else {
                  $product.attr('data-js-process-ajax-loading-json', true);
  
                  /*if(animate) {
                      theme.Loader.set($product);
                  }*/
  
                  var handle = $product.attr('data-product-handle');
                  
                  var xhr = $.ajax({
                      type: 'GET',
                      url: theme.routes.root_url + 'products/' + handle,
                      data: {
                          view: 'get_json'
                      },
                      cache: false,
                      dataType: 'html',
                      success: function (data) {
                          json = JSON.parse(data);
                          $product.attr('data-json-product', JSON.stringify(json));
  
                          /*if(animate) {
                              theme.Loader.unset($product);
                          }*/
  
                          if(callback) {
                              callback(json);
                          }
  
                          $product.trigger('json-loaded');
                      },
                      complete: function () {
                          $product.removeAttr('data-js-process-ajax-loading-json');
                      }
                  });
  
                  return xhr;
              }
          },
          switchByImage: function($product, get_image, id, callback) {
              var _ = this,
                  $image = $product.find('[data-js-product-image] img'),
                  json = $product.attr('data-json-product'),
                  data = false;
  
              this._loadJSON($product, json, function (json) {
                  var json_images = json.images,
                      current_image_id = (get_image === 'by_id') ? +id : +$image.attr('data-image-id'),
                      image_index,
                      update_variant;
  
                  $.each(json_images, function(i) {
                      if(+this.id === current_image_id) {
                          image_index = i;
                          return false;
                      }
                  });
  
                  if(image_index || image_index === 0) {
                      if(get_image === 'prev' && image_index !== 0) {
                          image_index--;
                      } else if(get_image === 'next' && image_index !== json_images.length - 1) {
                          image_index++;
                      }
  
                      $.each(json.variants, function() {
                          if(this.featured_image && +this.featured_image.id === +json_images[image_index].id) {
                              if(theme.product.hide_options_without_availability_variants && !this.available) {
                                  return;
                              }
  
                              update_variant = this;
                              return false;
                          }
                      });
  
                      if(!update_variant) {
                          update_variant = _._getDefaultVariant(json);
                          update_variant.featured_image = json_images[image_index];
                      }
  
                      _._updateOptions($product, {
                          update_variant: update_variant,
                          json: json
                      });
  
                      _._switchVariant($product, {
                          update_variant: update_variant,
                          json: json,
                          has_unselected_options: $product.find('[data-property][data-disable-auto-select]').length ? true : false
                      });
  
                      data = {
                          index: image_index,
                          image: json_images[image_index],
                          is_first: image_index === 0,
                          is_last: image_index === json_images.length - 1
                      };
                  }
  
                  callback(data);
              });
          },
          _updatePossibleVariants: function ($product, data) {
              var $options = $product.find(this.selectors.options_attr),
                  $section_eq_values,
                  $section_eq_select_options,
                  possible_variants = [],
                  hidden_variants = [];
  
              if(data.update_variant.options.length > 1) {
                  $.each(data.json.variants, function() {
                      if(Shopify.handleize(this.options[0]) !== Shopify.handleize(data.update_variant.options[0])) {
                          return;
                      } else if(!this.available) {
                          if(this.id !== data.update_variant.id && theme.product.hide_options_without_availability_variants) {
                              return;
                          } else {
                              hidden_variants.push(this);
                          }
                      }
  
                      possible_variants.push(this);
                  });
  
                  $.each(hidden_variants, function (i) {
                      const option = this.options[1];
  
                      $.each(possible_variants, function () {
                          if(option === this.options[1] && this.available) {
                              hidden_variants.splice(i, 1);
                          }
                      });
                  });
  
                  $section_eq_values = $options.find('[data-property]').eq(1).find('[data-js-option-value]');
                  $section_eq_select_options = $options.find('[data-property]').eq(1).filter('[data-js-option-select]').parents('.select').find('[data-value]');
  
                  $section_eq_values.addClass('disabled').removeClass('disabled-hidden');
                  $section_eq_select_options.attr('disabled', 'disabled').removeAttr('data-disabled-hidden');
  
                  $.each(possible_variants, function () {
                      $section_eq_values.filter('[data-js-option-value][data-value="' + Shopify.handleize(this.options[1]) + '"]').removeClass('disabled');
                      $section_eq_select_options.filter('[data-value="' + Shopify.handleize(this.options[1]) + '"]').removeAttr('disabled');
                  });
  
                  $.each(hidden_variants, function () {
                      $section_eq_values.filter('[data-js-option-value][data-value="' + Shopify.handleize(this.options[1]) + '"]').addClass('disabled-hidden');
                      $section_eq_select_options.filter('[data-value="' + Shopify.handleize(this.options[1]) + '"]').attr('data-disabled-hidden', 'disabled');
                  });
  
                  if(data.update_variant.options.length > 2) {
                      possible_variants = [];
                      hidden_variants = [];
  
                      $.each(data.json.variants, function() {
                          if(Shopify.handleize(this.options[0]) !== Shopify.handleize(data.update_variant.options[0]) || Shopify.handleize(this.options[1]) !== Shopify.handleize(data.update_variant.options[1])) {
                              return;
                          } else if(!this.available) {
                              if(this.id !== data.update_variant.id && theme.product.hide_options_without_availability_variants) {
                                  return;
                              } else {
                                  hidden_variants.push(this);
                              }
                          }
  
                          possible_variants.push(this);
                      });
  
                      $section_eq_values = $options.find('[data-property]').eq(2).find('[data-js-option-value]');
                      $section_eq_select_options = $options.find('[data-property]').eq(2).filter('[data-js-option-select]').parents('.select').find('[data-value]');
  
                      $section_eq_values.addClass('disabled').removeClass('disabled-hidden');
                      $section_eq_select_options.attr('disabled', 'disabled').removeAttr('data-disabled-hidden');
  
                      $.each(possible_variants, function () {
                          $section_eq_values.filter('[data-js-option-value][data-value="' + Shopify.handleize(this.options[2]) + '"]').removeClass('disabled');
                          $section_eq_select_options.filter('[data-value="' + Shopify.handleize(this.options[2]) + '"]').removeAttr('disabled');
                      });
  
                      $.each(hidden_variants, function () {
                          $section_eq_values.filter('[data-js-option-value][data-value="' + Shopify.handleize(this.options[2]) + '"]').addClass('disabled-hidden');
                          $section_eq_select_options.filter('[data-value="' + Shopify.handleize(this.options[2]) + '"]').attr('data-disabled-hidden', 'disabled');
                      });
                  }
              }
          },
          _switchVariant: function($product, data) {
              data.update_variant.metafields = $.extend({}, data.json.metafields);
  
              $.each(data.json.variants_metafields, function() {
                  if(+this.variant_id === +data.update_variant.id) {
                      data.update_variant.metafields = $.extend(true, data.update_variant.metafields, this.metafields);
                  }
              });
  
              $.each(data.json.variants_quantity, function() {
                  if(+this.id === +data.update_variant.id) {
                      if(+this.quantity <= 0 && this.policy == 'continue') {
                          data.update_variant.variant_pre_order = true;
                      }
  
                      return false;
                  }
              });
  
              this._updateContent($product, data);
          },
          _getDefaultVariant: function(json) {
              var default_variant = {};
  
              $.each(json.variants, function() {
                  if(+this.id === +json.default_variant_id) {
                      Object.assign(default_variant, this);
                      return false;
                  }
              });
  
              return default_variant;
          },
          _updateContent: function($product, data) {
              var clone_id = $product.attr('data-js-product-clone-id'),
                  $clone_product = $('[data-js-product-clone="' + clone_id + '"]');
  
              $product.attr('data-product-variant-id', data.update_variant.id);
              $product.add($clone_product).find('[data-js-product-options]').attr('data-variant-was-chanched', true);
  
              if(theme.StickySidebar) {
                  theme.StickySidebar.update('listener-enable');
              }
  
              this._updateFormVariantInput($product, data);
              this._updatePrice($product, $clone_product, data);
              this._updateTextLabelValue($product, $clone_product, data);
              this._updateLabelSale($product, data);
              this._updateLabelInStock($product, data);
              this._updateLabelPreOrder($product, data);
              this._updateLabelOutStock($product, data);
              this._updateLabelHot($product, data);
              this._updateLabelNew($product, data);
              this._updateCountdown($product, data);
              this._updateAddToCart($product, $clone_product, data);
              this._updateDynamicCheckout($product, data);
              this._updateSKU($product, data);
              this._updateBarcode($product, data);
              this._updateAvailability($product, data);
              this._updateStockCountdown($product, data);
              this._updateGallery($product, data);
              this._updateLinks($product, data);
              this._updateHistory($product, data);
              this._updatePickupAvailable($product, data);
  
              theme.StoreLists.checkProductStatus($product);
              theme.ProductImagesNavigation.switch($product, data);
  
              if(!data.dontUpdateVariantsSelect) {
                  this._updateVariantsSelect($product, data, true);
              }
  
              if(data.updateProductOptions) {
                  this._updateOptions($product, data);
              }
  
              if($clone_product.length) {
                  this._updateVariantsSelect($clone_product, data);
                  this._updateOptions($clone_product, data, $product);
                  theme.ProductImagesNavigation.switch($clone_product, data);
              }
  
              if(theme.StickySidebar) {
                  theme.StickySidebar.update('listener-process');
              }
  
              if (theme.StickySidebar) {
                  theme.StickySidebar.update('listener-disable');
              }
          },
          _updateOptions: function($product, data, $product_origin) {
              var _ = this;
  
              $product.each(function () {
                  var $this = $(this),
                      $options = $this.find(_.selectors.options_attr),
                      $sections;
  
                  if($options.length) {
                      $options.find('[data-js-option-value]').removeClass('active');
  
                      _._updatePossibleVariants($this, data);
  
                      $.each(data.update_variant.options, function(i, k) {
                          var $prop = $options.find('[data-property]').eq(i);
  
                          $prop.find('[data-js-option-value][data-value="' + Shopify.handleize(k) + '"]').addClass('active');
                          $prop.filter('[data-js-option-select]').val(Shopify.handleize(k)).trigger('change', [ true ]);
                      });
                  }
  
                  if($product_origin && theme.product.variant_auto_select !== 'enable') {
                      $sections = $product.find('[data-property]');
  
                      $sections.attr('data-disable-auto-select');
  
                      $product_origin.find('[data-property]').each(function (i, v) {
                          if(!this.hasAttribute('data-disable-auto-select')) {
                              $sections.eq(i).removeAttr('data-disable-auto-select');
                          }
                      });
                  }
              });
          },
          _updateFormVariantInput: function ($product, data) {
              var $input = $product.find('[data-js-product-variant-input]');
  
              $input.attr('value', data.update_variant.id);
          },
          _updateVariantsSelect: function($product, data, onchange) {
              var $select = $product.find('[data-js-product-variants]');
  
              if($select.length && !data.has_unselected_options) {
                  $select.val(data.update_variant.id);
  
                  if(onchange) {
                      $select.change();
                  }
              }
          },
          _updateAddToCart: function($product, $clone_product, data) {
              var $button = $product.add($clone_product).find('[data-js-product-button-add-to-cart]');
  
              if($button.length && !data.has_unselected_options) {
                  if(data.update_variant.variant_pre_order) {
                      $button.removeAttr('disabled').attr('data-button-status', 'pre-order');
                  } else {
                      data.update_variant.available ? $button.removeAttr('disabled data-button-status') : $button.attr('disabled', 'disabled').attr('data-button-status', 'sold-out');
                  }
              }
          },
          _updateDynamicCheckout: function($product, data) {
              var $button = $product.find('[data-js-product-button-dynamic-checkout]');
  
              if($button.length && !data.has_unselected_options) {
                  data.update_variant.available ? $button.removeClass('d-none') : $button.addClass('d-none');
              }
          },
          _updatePrice: function($product, $clone_product, data) {
              var $price = $product.add($clone_product).find('[data-js-product-price]').parent(),
                  $details = $product.find('[data-js-product-price-sale-details]'),
                  details;
  
              if($price.length) {
                  theme.ProductCurrency.setPriceFull($price, data.update_variant);
              }
  
              if($details.length) {
                  $.each(data.json.variants_price_sale_details, function () {
                      if(+this.id === +data.update_variant.id) {
                          details = this.details;
                      }
                  });
  
                  $details.html(details ? details : '')[details ? 'removeClass' : 'addClass']('d-none-important');
              }
  
              if($price.length || $details.length) {
                  theme.ProductCurrency.update();
              }
          },
          _updateTextLabelValue: function($product, $clone_product, data) {
              var $container = $product.find('[data-section-container]'),
                  $clone_container = $clone_product.find('[data-section-container]');
  
              if(data.update_variant.option1) {
                  $container.eq(0).add($clone_container.eq(0)).find('[data-label-value]').text(data.update_variant.option1);
              }
  
              if(data.update_variant.option2) {
                  $container.eq(1).add($clone_container.eq(1)).find('[data-label-value]').text(data.update_variant.option2);
              }
  
              if(data.update_variant.option3) {
                  $container.eq(2).add($clone_container.eq(2)).find('[data-label-value]').text(data.update_variant.option3);
              }
          },
          _updateLabelSale: function($product, data) {
              var $label = $product.find('[data-js-product-label-sale]');
  
              if($label.length) {
                  var html = '',
                      sale = (data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price);
  
                  $label[!sale ? 'addClass' : 'removeClass']('d-none-important');
  
                  if(sale) {
                      var percent = Math.ceil(100 - data.update_variant.price * 100 / data.update_variant.compare_at_price);
  
                      html += theme.strings.label.sale;
                      html = Shopify.addValueToString(html, {
                          'percent': percent
                      });
                  }
  
                  $label.html(html);
              }
          },
          _updateLabelInStock: function($product, data) {
              var $label = $product.find('[data-js-product-label-in-stock]');
  
              if($label.length) {
                  $label[!data.update_variant.available || data.update_variant.variant_pre_order ? 'addClass' : 'removeClass']('d-none-important');
              }
          },
          _updateLabelPreOrder: function($product, data) {
              var $label = $product.find('[data-js-product-label-pre-order]');
  
              if($label.length) {
                  $label[data.update_variant.variant_pre_order ? 'removeClass' : 'addClass']('d-none-important');
              }
          },
          _updateLabelOutStock: function($product, data) {
              var $label = $product.find('[data-js-product-label-out-stock]');
  
              if($label.length) {
                  $label[data.update_variant.available ? 'addClass' : 'removeClass']('d-none-important');
              }
          },
          _updateLabelHot: function($product, data) {
              var $label = $product.find('[data-js-product-label-hot]');
  
              if($label.length) {
                  $label[data.update_variant.metafields.labels && data.update_variant.metafields.labels.hot ? 'removeClass' : 'addClass']('d-none-important');
              }
          },
          _updateLabelNew: function($product, data) {
              var $label = $product.find('[data-js-product-label-new]');
  
              if($label.length) {
                  $label[data.update_variant.metafields.labels && data.update_variant.metafields.labels.new ? 'removeClass' : 'addClass']('d-none-important');
              }
          },
          _updateCountdown: function($product, data) {
              var $countdown = $product.find('[data-js-product-countdown]'),
                  date = data.update_variant.metafields.countdown && data.update_variant.metafields.countdown.date ? data.update_variant.metafields.countdown.date : false,
                  $countdown_init,
                  need_coundown;
  
              if($countdown.length) {
                  $countdown_init = $countdown.find('.js-countdown');
                  need_coundown = date && data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price;
  
                  if(need_coundown && $countdown_init.attr('data-date') !== date) {
                      theme.ProductCountdown.reinit($countdown_init, date);
                  }
  
                  if(!need_coundown) {
                      $countdown.addClass('d-none-important');
                  }
              }
          },
          _updateSKU: function($product, data) {
              var $sku = $product.find('[data-js-product-sku]');
  
              if($sku.length) {
                  $sku[data.update_variant.sku ? 'removeClass' : 'addClass']('d-none-important');
  
                  $sku.find('span').html(data.update_variant.sku);
              }
          },
          _updateBarcode: function($product, data) {
              var $barcode = $product.find('[data-js-product-barcode]');
  
              if($barcode.length) {
                  $barcode[data.update_variant.barcode ? 'removeClass' : 'addClass']('d-none-important');
  
                  $barcode.find('span').html(data.update_variant.barcode);
              }
          },
          _updateAvailability: function($product, data) {
              var $availability = $product.find('[data-js-product-availability]');
  
              if($availability.length) {
                  var html = '',
                      quantity = 0;
  
                  $.each(data.json.variants_quantity, function() {
                      if(+this.id === +data.update_variant.id) {
                          quantity = +this.quantity;
  
                          return false;
                      }
                  });
  
                  if(data.update_variant.available) {
                      html += theme.strings.availability_value_in_stock;
                      html = Shopify.addValueToString(html, {
                          'count': quantity,
                          'item': quantity === 1 ? theme.strings.layout.cart.items_count.one : theme.strings.layout.cart.items_count.other
                      });
                  } else {
                      html += theme.strings.availability_value_out_stock;
                  }
  
                  $availability.attr('data-availability', data.update_variant.available).find('span').html(html);
              }
          },
          _updateStockCountdown: function ($product, data) {
              var $stock_countdown = $product.find('[data-js-product-stock-countdown]'),
                  $title = $stock_countdown.find('[data-js-product-stock-countdown-title]'),
                  $progress = $stock_countdown.find('[data-js-product-stock-countdown-progress]'),
                  min = +$stock_countdown.attr('data-min'),
                  quantity = 0;
  
              $.each(data.json.variants_quantity, function () {
                  if(+this.id === +data.update_variant.id) {
                      quantity = +this.quantity;
  
                      return false;
                  }
              });
  
              if($title) {
                  $title.html(Shopify.addValueToString(theme.strings.stock_countdown.title, {
                      'quantity': '<span class="stock-countdown__counter">' + quantity + '</span>'
                  }));
              }
  
              if($progress) {
                  $progress.width(quantity / (min / 100) + '%');
              }
  
              if($stock_countdown.length) {
                  $stock_countdown[quantity > 0 && quantity < min ? 'removeClass' : 'addClass']('d-none-important');
              }
          },
          _updateGallery: function ($product, data) {
              var $gallery = $product.find('[data-js-product-gallery].initialized');
  
              if(!$gallery.length) {
                  return;
              }
  
              var image = data.update_variant.featured_media || data.json.media[0],
                  group = data.update_variant.option1 ? data.update_variant.option1.replace('"', '') : false;
  
              $gallery.productGallery('goToSlideById', +image.id, group);
          },
          _updateLinks: function ($product, data) {
              var url = decodeURIComponent(window.location.origin) + '/products/' + data.json.handle + '?variant=' + data.update_variant.id;
  
              $product.find('a[href*="products/' + data.json.handle + '"]').attr('href', url);
          },
          _updateHistory: function ($product, data) {
              var $options = $product.find(this.selectors.options);
  
              if(!data.has_unselected_options && $options.length && $options[0].hasAttribute('data-js-change-history')) {
                  var url = window.location.href.split('?')[0] + '?variant=' + data.update_variant.id;
  
                  history.replaceState({foo: 'product'}, url, url);
              }
          },
          _updatePickupAvailable: function ($product, data) {
              if(!theme.product.show_pickup_available) {
                  return;
              }
  
              const handle = $product.attr('data-product-handle'),
                  $pickupAvailable = $product.find('[data-js-pickup-available-container]');
  
              $pickupAvailable.addClass('is-loading');
  
              fetch(`${theme.routes.root_url}products/${handle}/?variant=${data.update_variant.id}&view=variant_data`)
                  .then(response => response.text())
                  .then(html => {
                      $pickupAvailable.html($(html).find('[data-js-pickup-available-container]').html()).removeClass('is-loading');
                  })
                  .catch(e => {
                      console.error(e);
                  });
          }
      });
  
      theme.ProductOptions = new ProductOptions;
  };
  theme.ProductReview = function() {
  
      function ProductReview() {
  
      };
  
      ProductReview.prototype = $.extend({}, ProductReview.prototype, {
          update: function() {
  
              if(window.SPR) {
                  try {
                      SPR.registerCallbacks();
                      SPR.initRatingHandler();
                      SPR.initDomEls();
                      //SPR.loadProducts();
                      SPR.loadBadges();
                  } catch(e) {}
              }
          }
      });
  
      theme.ProductReview = new ProductReview;
  };
  theme.cart = function() {
      "use strict";
  
      class CartData {
          constructor() {
              this.rootURL = window.langify && window.langify.locale.root_url != '/' ? window.langify.locale.root_url + '/cart' : theme.routes.cart_url;
              this.currentData = {};
              this.hasData = false;
  
              window.addEventListener('storage', e => {
                  if(e.key === 'cartCurrentData') {
                      this.setCurrentData(JSON.parse(localStorage.getItem('cartCurrentData')));
                      this.storageWasModified = true;
                  }
              });
          }
  
          setCurrentData(data) {
              this.currentData = data;
              localStorage.setItem('cartCurrentData', JSON.stringify(this.currentData));
              this.hasData = true;
              return this.currentData;
          }
  
          updateData(parentResponse) {
              var _ = this;
  
              return fetch(`${this.rootURL}.js`)
                  .then(response => response.json())
                  .then(data => {
                      _.setCurrentData(data);
                      return parentResponse;
                  })
                  .catch(error => console.error('Error:', error));
          }
  
          addItem(item) {
              return this.addItems([item]);
          }
  
          addItems(items) {
              const requestParams = {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({items: items})
              };
  
              return fetch(`${this.rootURL}/add.js`, requestParams)
                  .then(response => {
                      if(response.ok) {
                          return this.updateData(response);
                      } else {
                          return response;
                      }
                  })
                  .catch(error => console.error('Error:', error));
          }
  
          changeItemById(id, quantity) {
              const requestParams = {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({"id": id, "quantity": quantity})
              };
  
              return fetch(`${this.rootURL}/change.js`, requestParams)
                  .then(response => response.json())
                  .then(data => this.setCurrentData(data))
                  .catch(error => console.error('Error:', error));
          }
  
          changeItemByLine(line, quantity) {
              const requestParams = {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({"line": line, "quantity": quantity})
              };
  
              return fetch(`${this.rootURL}/change.js`, requestParams)
                  .then(response => response.json())
                  .then(data => this.setCurrentData(data))
                  .catch(error => console.error('Error:', error));
          }
          
          removeItemById(id) {
              return this.changeItemById(id, 0);
          }
  
          removeItemByLine(line) {
              return this.changeItemByLine(line, 0);
          }
  
          getPageContent() {
              const requestParams = {
                  method: 'GET'
              };
  
              return fetch(`${this.rootURL}?view=ajax`, requestParams)
                  .then(response => response.text())
                  .catch(error => console.error('Error:', error));
          }
      };
  
      class CartViewer extends CartData {
          constructor() {
              super();
  
              this.selectorPage = '.js-page-cart-ajax';
  
              this.$counterDesktop = $('[data-js-cart-count-desktop]');
              this.$counterMobile = $('[data-js-cart-count-mobile]');
              this.$popup = $('.js-popup-cart-ajax');
              this.$page = $(this.selectorPage);
              this.$freeShipping = $('.js-free-shipping');
          }
  
          updateCart() {
              this.updateCounter();
              this.updateCartPopupContent();
              this.updateFreeShipping();
              this.updateCartPageContent();
          }
  
          updateCounter() {
              const count = this.currentData.item_count;
  
              this.$counterDesktop.attr('data-js-cart-count-desktop', count).html(theme.strings.header.cart_count_desktop.replace('{{ count }}', count));
              this.$counterMobile.attr('data-js-cart-count-mobile', count).html(count);
          }
  
          updateCartPopupContent() {
              if(this.$popup.length) {
                  const $content = this.$popup.find('.popup-cart__content'),
                      $empty = this.$popup.find('.popup-cart__empty'),
                      $items = this.$popup.find('.popup-cart__items'),
                      $count = this.$popup.find('[data-js-popup-cart-count]'),
                      $subtotal = this.$popup.find('[data-js-popup-cart-subtotal]'),
                      $discounts = this.$popup.find('[data-js-popup-cart-discounts]');
  
                  $count.html(theme.strings.general.popups.cart.count.replace('{{ count }}', this.currentData.item_count));
                  $content[this.currentData.item_count > 0 ? 'removeClass' : 'addClass']('d-none-important');
                  $empty[this.currentData.item_count > 0 ? 'addClass' : 'removeClass']('d-none-important');
                  $discounts.html('').addClass('d-none');
                  
                  if(this.currentData.item_count > 0) {
                      const $template = $($('#template-cart-ajax')[0].content),
                          $fragment = $(document.createDocumentFragment());
  
                      this.currentData.items.forEach(function (item, i) {
                          const $item = $template.clone(),
                              $product = $item.find('.product-cart'),
                              $image = $item.find('.product-cart__image img'),
                              $title = $item.find('.product-cart__title a'),
                              $variant = $item.find('.product-cart__variant'),
                              $price = $item.find('.product-cart__price-value'),
                              $quantity = $item.find('.product-cart__quantity'),
                              $inputQuantity = $item.find('.product-cart__input-quantity'),
                              $remove = $item.find('.product-cart__remove'),
                              $links = $item.find('a').not('.product-cart__remove');
                          
                          $product.attr('data-product-variant-id', item.variant_id);
                          $product.attr('data-product-cart-line', i + 1);
                          $links.attr('href', item.url);
                          $title.html(item.product_title);
                          $image.attr('src', Shopify.resizeImage(item.image, '120x')).attr('srcset', Shopify.resizeImage(item.image, '120x') + ' 1x, ' + Shopify.resizeImage(item.image, '240x') + ' 2x');
                          $quantity.html(item.quantity);
                          $remove.attr('href', '/cart/change?line=' + (i + 1) + '&amp;quantity=0');
  
                          if($inputQuantity.length) {
                              $inputQuantity.val(item.quantity);
                          }
  
                          if(item.variant !== 'Default variant') {
                              $variant.html(item.variant_title).removeClass('d-none-important');
                          }
  
                          theme.ProductCurrency.setPriceFull($price, item);
                          $fragment.append($item);
                      });
  
                      $items.html('');
                      $items.append($fragment);
                      theme.ProductCurrency.setPrice($subtotal, this.currentData.total_price);
  
                      if(this.currentData.cart_level_discount_applications.length) {
                          const $template_discount = $($('#template-cart-discount')[0].content);
  
                          for(let application of this.currentData.cart_level_discount_applications) {
                              const $item = $template_discount.clone();
  
                              $item.find('[data-js-popup-cart-discount-title]').text(application.title);
                              theme.ProductCurrency.setPrice($item.find('[data-js-popup-cart-discount-price]'), application.total_allocated_amount);
                              $discounts.append($item);
                          }
  
                          $discounts.removeClass('d-none');
                      }
  
                      theme.ProductCurrency.update();
                  } else {
                      $items.add($subtotal).html('');
                  }
              }
          }
  
          updateCartPageContent() {
              const _ = this;
  
              if(this.$page.length) {
                  this.getPageContent().then(data => {
                      const $data = $(data),
                          $page = $data.find(_.selectorPage);
  
                      _.$page.html($page.html());
  
                      theme.ImagesLazyLoad.update();
                  });
              }
          }
  
          updateFreeShipping() {
              if(this.$freeShipping.length) {
                  const total = this.currentData.total_price,
                      money = Math.max(theme.cart_free_shipping_value - total, 0);
  
                  this.$freeShipping.find('[data-js-progress]').css({
                      width:  Math.min(total / (theme.cart_free_shipping_value / 100), 100) + '%'
                  });
  
                  this.$freeShipping
                      .find('[data-js-text]')
                      .html(money > 0 ? theme.strings.cart.general.free_shipping_html.replace('{{ value }}', Shopify.formatMoney(money, theme.moneyFormat)) : theme.strings.cart.general.free_shipping_complete);
              }
          }
      }
  
      class CartController extends CartViewer {
          constructor() {
              super();
  
              this.selectorButtonAdd = '.js-product-button-add-to-cart';
              this.selectorPopupButtonRemove = '.js-product-button-remove-from-cart';
              this.selectorPageInputQuantity = '.js-input-quantity-cart';
  
              this.popupController();
              this.addToCartController();
              this.removeFromCartPopupController();
              this.changeQuantityCartPageController();
          }
  
          set storageWasModified(v) {
              this.updateCart();
          }
  
          popupController() {
              theme.Popups.addHandler('cart', 'call.visible', $popup => {
                  this.hasData ? $popup.trigger('contentloaded') : this.updateData().then(() => {
                      this.updateCartPopupContent();
                      $popup.trigger('contentloaded');
                  });
              });
          }
  
          addToCartController() {
              const _ = this;
  
              $body.on('click', this.selectorButtonAdd, function(e) {
                  const $this = $(this);
                  const attrButtonStatus = $this.attr('data-button-status');
  
                  if(attrButtonStatus !== 'added' && !$this.hasClass('active')) {
                      const $btns = _.mergeWithDuplicateButtons($this);
  
                      if(attrButtonStatus === 'select') {
                          const $product = $this.parents('[data-js-product]');
  
                          _.disableButton($btns);
                          _.goToProductPage($product);
                      } else {
                          const $form = $this.parents('form');
  
                          _.disableButton($btns);
                          _.addItem(_.serializeForm($form))
                              .then(response => {
                                  if(response.ok) {
                                      _.updateCart();
                                      _.showPopup();
                                      _.statusButtonAdded($btns);
                                      setTimeout(() => _.enableButton($btns), 2000);
                                  } else if(response.status === 422) {
                                      return response.json().then(err => {
                                          // alert(theme.strings.general.popups.cart.item_added.replace('{{ title }}', title));
                                          // alert(theme.strings.general.popups.cart.limit_is_exceeded.replace('{{ limit }}', limit));
                                          alert(err.description);
                                          _.enableButton($btns);
                                      });
                                  }
                              });
                      }
                  }
  
                  e.preventDefault();
              });
  
              $body.on('click', `[data-js-product-button-add-to-cart]:not(${this.selectorButtonAdd})`, function() {
                  const $this = $(this);
                  const $btns = _.mergeWithDuplicateButtons($this);
  
                  setTimeout(() => _.disableButton($btns), 100);
              });
          }
  
          removeFromCartPopupController() {
              const _ = this;
  
              $body.on('click', this.selectorPopupButtonRemove, function(e) {
                  const $this = $(this);
  
                  if(!$this.hasClass('active')) {
                      const $btns = _.mergeWithDuplicateButtons($this);
                      const line = $this.parents('[data-js-product]').attr('data-product-cart-line');
  
                      _.disableButton($btns);
                      _.removeItemByLine(line)
                          .then(() => {
                              _.updateCart();
                              _.enableButton($btns)
                          });
                  }
  
                  e.preventDefault();
              });
          }
  
          changeQuantityCartPageController() {
              const _ = this;
              
              $body.on('change keyup custom.change', this.selectorPageInputQuantity, $.debounce(700, function() {
                  const $this = $(this),
                      quantity = Math.trunc($this.val()) || 1,
                      line = $this.parents('[data-js-product]').attr('data-product-cart-line'),
                      dataLastUpdateValue = $this.attr('data-last-update-value');
  
                  if(dataLastUpdateValue && +dataLastUpdateValue === quantity) {
                      return;
                  }
  
                  $this.attr('data-last-update-value', quantity);
  
                  _.changeItemByLine(line, quantity)
                      .then(() => {
                          _.updateCart();
                      });
              }));
          }
  
          mergeWithDuplicateButtons($btn) {
              const cloneId = $btn.attr('data-js-button-add-to-cart-clone-id');
  
              if(cloneId !== undefined) {
                  $btn = $btn.add($(`[data-js-button-add-to-cart-clone="${cloneId}"]`));
              }
  
              return $btn;
          }
  
          disableButton($btns) {
              $btns.addClass('active').attr('disabled', 'disabled');
          }
  
          statusButtonAdded($btns) {
              $btns.each(function () {
                  const $this = $(this),
                      btnWidth = $this.outerWidth();
  
                  $this.css({
                      'min-width': `${btnWidth}px`
                  });
              });
  
              $btns.removeAttr('disabled').attr('data-button-status', 'added');
          }
  
          enableButton($btns) {
              $btns.removeAttr('data-button-status disabled style').removeClass('active')
          }
          
          showPopup() {
              theme.Popups.callByName('cart');
          }
  
          goToProductPage($product) {
              location.href = '/products/' + $product.attr('data-product-handle');
          }
  
          serializeForm($form, serialize_obj = {quantity: 1}) {
              $form.serializeArray().forEach(obj => {
                  if(['id', 'quantity'].includes(obj.name)) {
                      serialize_obj[obj.name] = obj.value;
                  } else if(obj.name.indexOf('properties') !== -1 && obj.value !== '') {
                      serialize_obj.properties = serialize_obj.properties || {};
                      serialize_obj.properties[obj.name.replace('properties[', '').replace(']', '')] = obj.value;
                  }
              });
              return serialize_obj;
          }
      };
  
      theme.cart = new CartController;
  };
  theme.StoreLists = function() {
  
      function Engine(namespace, callback) {
          this.namespace = namespace;
  
          this.selectors = {
              button: '.js-store-lists-add-' + namespace,
              button_remove: '.js-store-lists-remove-' + namespace,
              button_clear: '.js-store-lists-clear-' + namespace,
              has_items: '[data-js-store-lists-has-items-' + namespace + ']',
              dhas_items: '[data-js-store-lists-dhas-items-' + namespace + ']'
          };
  
          if(theme.customer) {
              this.current_storage = namespace + '-customer-' + theme.customer_id;
  
              this.app_obj = {
                  namespace: namespace,
                  customerid: theme.customer_id,
                  shop: theme.permanent_domain,
                  domain: theme.host,
                  iid: theme.lists_app.iid
              };
          } else {
              this.current_storage = namespace + '-guest';
          }
  
          this.load(callback);
      };
  
      Engine.prototype = $.extend({}, Engine.prototype, {
          load: function(callback) {
              var _ = this;
  
              if(theme.customer) {
                  var customer_storage = localStorage.getItem(this.current_storage),
                      customer_storage_arr = customer_storage ? JSON.parse(customer_storage) : [],
                      guest_storage = localStorage.getItem(this.namespace + '-guest'),
                      guest_storage_arr = guest_storage ? JSON.parse(guest_storage) : [],
                      sort_data_arr = [],
                      sort_customer_storage_arr,
                      sort_concat_arr,
                      sort_concat_arr_json;
  
                  var sortObjectsArray = function(arr) {
                      var obj = {},
                          new_arr = [],
                          i = 0;
  
                      for(i = 0; i < arr.length; i++) {
                          $.each(arr[i], function (k, v) {
                              obj[k + ''] = v;
                          });
                      }
  
                      $.each(obj, function (k, v) {
                          var obj = {};
  
                          obj[k] = v;
                          new_arr.push(obj);
                      });
  
                      return new_arr;
                  };
  
                  var loadData = function() {
                      _.getCustomerList(function (data) {
                          if(data.status !== 200) {
                              return;
                          }
  
                          sort_customer_storage_arr = sortObjectsArray(customer_storage_arr);
  
                          if(data.items && data.items.length) {
                              sort_data_arr = sortObjectsArray(data.items);
                          }
  
                          sort_concat_arr = sortObjectsArray(sort_customer_storage_arr.concat(sort_data_arr));
  
                          sort_concat_arr_json = JSON.stringify(sort_concat_arr);
  
                          if(sort_concat_arr_json !== JSON.stringify(sort_customer_storage_arr) || sort_concat_arr_json !== JSON.stringify(sort_data_arr)) {
                              localStorage.setItem(_.current_storage, sort_concat_arr_json);
  
                              _.setCustomerList(sort_concat_arr_json);
                          }
  
                          _.updateHeaderCount();
                          _.checkProductStatus();
  
                          localStorage.removeItem(_.namespace + '-guest');
                      });
                  };
  
                  if(guest_storage_arr.length) {
                      callback({
                          trigger: function (is_active) {
                              if(is_active) {
                                  customer_storage_arr = customer_storage_arr.concat(guest_storage_arr);
                              }
  
                              loadData();
                          },
                          info: {
                              namespace: _.namespace,
                              count: guest_storage_arr.length
                          }
                      });
                  } else {
                      loadData();
                  }
              } else {
                  this.checkProductStatus();
              }
  
              $body.on('click', this.selectors.button, function(e) {
                  var $this = $(this);
  
                  $this.attr('disabled', 'disabled');
  
                  var $product = $this.parents('[data-js-product]'),
                      handle = $product.attr('data-product-handle'),
                      id = +$product.attr('data-product-variant-id');
  
                  if($this.attr('data-button-status') === 'added') {
                      _.removeItem(id, handle, function(data) {
                          $this.removeAttr('data-button-status');
                          $this.removeAttr('disabled');
                      });
                  } else {
                      _.addItem(id, handle, function(data) {
                          $this.attr('data-button-status', 'added');
                          $this.removeAttr('disabled');
                      });
                  }
  
                  e.preventDefault();
                  return false;
              });
  
              function removeCallback($product, handle, id) {
                  var find = '[data-js-store-lists-product-' + _.namespace + ']',
                      $popup = theme.Popups.getByName(_.namespace);
  
                  if(handle) find += '[data-product-handle="' + handle + '"]';
                  if(id) find += '[data-product-variant-id="' + id + '"]';
  
                  $(find).each(function () {
                      var $this = $(this);
  
                      $($this.parent('[class*="col"]').length ? $this.parent() : $this).remove();
                  });
  
                  if($product && typeof $product !== undefined && $product.length) $product.remove();
  
                  if(!$popup.hasClass('d-none-important')) {
                      theme.StoreLists.popups[_.namespace].update($popup);
                  }
              };
  
              $body.on('click', this.selectors.button_remove, function() {
                  var $this = $(this),
                      $product = $this.parents('[data-js-product]'),
                      handle = $product.attr('data-product-handle'),
                      id = +$product.attr('data-product-variant-id');
  
                  _.removeItem(id, handle, function() {
                      removeCallback($product, handle, id);
                  });
              });
  
              $body.on('click', this.selectors.button_clear, function() {
                  _.clear(function() {
                      removeCallback();
                  });
              });
          },
          setCustomerList: function(items, callback) {
              if(theme.customer) {
                  $.ajax({
                      type: "POST",
                      url: "https://" + theme.lists_app.url + "/api/massadd",
                      data: $.extend({}, this.app_obj, {
                          purge: 'yes',
                          items: items
                      }),
                      cache: false,
                      success: function(data) {
                          if(callback) callback(data);
                      }
                  });
              }
          },
          getCustomerList: function(callback) {
              if(theme.customer) {
                  $.ajax({
                      type: 'POST',
                      url: 'https://' + theme.lists_app.url + '/api/getlist',
                      data: this.app_obj,
                      cache: false,
                      success: function(data) {
                          if(callback) callback(data);
                      }
                  });
              }
          },
          addCustomerItem: function(id, handle, callback) {
              if(theme.customer) {
                  $.ajax({
                      type: 'POST',
                      url: 'https://' + theme.lists_app.url + '/api/add',
                      data: $.extend({}, this.app_obj, {
                          key: id,
                          value: handle
                      }),
                      cache: false,
                      success: function(data) {
                          if(callback) callback(data);
                      }
                  });
              }
          },
          removeCustomerItem: function(id, callback) {
              if(theme.customer) {
                  $.ajax({
                      type: 'POST',
                      url: 'https://' + theme.lists_app.url + '/api/delete',
                      data: $.extend({}, this.app_obj, {
                          key: id,
                          _method: 'DELETE'
                      }),
                      cache: false,
                      success: function(data) {
                          if(callback) callback(data);
                      }
                  });
              }
          },
          clearCustomerItem: function(callback) {
              if(theme.customer) {
                  $.ajax({
                      type: 'POST',
                      url: 'https://' + theme.lists_app.url + '/api/massdelete',
                      data: $.extend({}, this.app_obj, {
                          _method: 'DELETE'
                      }),
                      cache: false,
                      success: function(data) {
                          if(callback) callback(data);
                      }
                  });
              }
          },
          addItem: function(id, handle, callback) {
              var storage = localStorage.getItem(this.current_storage),
                  items = storage ? JSON.parse(storage) : [],
                  obj = {};
  
              obj[id] = handle;
  
              items.push(obj);
  
              localStorage.setItem(this.current_storage, JSON.stringify(items));
  
              this.checkProductStatus();
              this.updateHeaderCount();
  
              this.addCustomerItem(id, handle);
  
              if(callback) callback();
          },
          removeItem: function(id, handle, callback) {
              var storage = localStorage.getItem(this.current_storage),
                  items = storage ? JSON.parse(storage) : [];
  
              $.each(items, function (i) {
                  if(id && this[id] && this[id] === handle) {
                      items.splice(i, 1);
                      return false;
                  } else if(!id && this[Object.keys(this)[0]] === handle) {
                      items.splice(i, 1);
                      return false;
                  }
              });
  
              localStorage.setItem(this.current_storage, JSON.stringify(items));
  
              this.checkProductStatus();
  
              $(this.selectors.has_items)[items.length > 0 ? 'removeClass' : 'addClass']('d-none-important');
              $(this.selectors.dhas_items)[items.length > 0 ? 'addClass' : 'removeClass']('d-none-important');
  
              this.updateHeaderCount();
  
              this.removeCustomerItem(id);
  
              if (callback) callback();
          },
          clear: function (callback) {
              localStorage.removeItem(this.current_storage);
  
              this.checkProductStatus();
  
              $(this.selectors.has_items).addClass('d-none-important');
              $(this.selectors.dhas_items).removeClass('d-none-important');
  
              this.updateHeaderCount();
  
              this.clearCustomerItem();
  
              if (callback) callback();
          },
          checkProductStatus: function($products) {
              $products = $products || $('[data-js-product]');
  
              var _ = this,
                  storage = localStorage.getItem(this.current_storage),
                  items = storage ? JSON.parse(storage) : [],
                  $active_products = $();
  
              $.each(items, function () {
                  $.each(this, function (k, v) {
                      var $selected_product = $products.filter('[data-product-handle="' + v + '"][data-product-variant-id="' + k + '"]');
  
                      if ($selected_product.length) {
                          $active_products = $active_products.add($selected_product);
                      }
                  });
              });
  
              $products.not($active_products).find(_.selectors.button).removeAttr('data-button-status');
              $active_products.find(_.selectors.button).attr('data-button-status', 'added');
          },
          updateHeaderCount: function(callback) {
              var storage = localStorage.getItem(this.current_storage),
                  count = storage ? JSON.parse(storage).length : 0;
  
              $('[data-js-' + this.namespace + '-count]').attr('data-js-' + this.namespace + '-count', count).html(count);
  
              if (callback) callback();
          }
      });
  
      function Popup(namespace) {
          this.namespace = namespace;
  
          this.load();
      };
  
      Popup.prototype = $.extend({}, Popup.prototype, {
          load: function() {
              var _ = this;
  
              theme.Popups.addHandler(this.namespace, 'call.visible', function($popup) {
                  _.update($popup, function () {
                      $popup.trigger('contentloaded');
                  });
              });
  
              theme.Popups.addHandler(this.namespace + '-full', 'call.visible', function($popup) {
                  _.updateFull($popup, function () {
                      $popup.trigger('contentloaded');
                  });
              });
          },
          _resultToHTML: function($items, data, callback) {
              var $template = $($('#template-' + this.namespace + '-ajax')[0].content),
                  $fragment = $(document.createDocumentFragment());
  
              for(var i = 0; i < data.params.length; i++) {
                  $.each(data.params[i], function (k, v) {
                      var product = null,
                          variant = null;
  
                      $.each(data.products, function () {
                          if(this.handle === v) {
                              product = this;
                          }
                      });
  
                      if(!product) {
                          return;
                      }
  
                      $.each(product.variants, function() {
                          if(+this.id === +k) {
                              variant = this;
                              return false;
                          }
                      });
  
                      if(!variant) {
                          variant = product.variants[0];
                      }
  
                      var image = variant.featured_image ? variant.featured_image.src : product.featured_image;
  
                      var $item = $template.clone(),
                          $product = $item.find('.product-store-lists'),
                          $image = $item.find('.product-store-lists__image img'),
                          $title = $item.find('.product-store-lists__title a'),
                          $variant = $item.find('.product-store-lists__variant'),
                          $price = $item.find('.product-store-lists__price .price'),
                          $links = $item.find('a').not('.product-store-lists__remove');
  
                      $product.attr('data-product-variant-id', k);
                      $product.attr('data-product-handle', v);
                      $links.attr('href', '/products/' + v + '?variant=' + k);
                      $title.html(product.title);
                      $image.attr('srcset', Shopify.resizeImage(image, '120x') + ' 1x, ' + Shopify.resizeImage(image, '240x') + ' 2x');
  
                      if(variant.title !== 'Default Title') {
                          $variant.html(variant.title).removeClass('d-none-important');
                      }
  
                      theme.ProductCurrency.setPrice($price, variant.price, variant.compare_at_price);
  
                      $fragment.append($item);
                  });
              }
  
              $items.html('');
              $items.append($fragment);
  
              if(callback) {
                  callback();
              }
          },
          _getProducts: function(items, callback) {
              var _ = this,
                  handles = [],
                  cycles = 1,
                  data_items = [],
                  i = 0;
  
              if (this.xhr) {
                  this.xhr.abort();
              }
  
              for(; i < items.length; i++) {
                  $.each(items[i], function () {
                      handles.push(this)
                  });
              }
  
              i = 0;
              cycles = Math.max(1, Math.ceil(handles.length/20));
  
              function recurcionRequests(i) {
                  var request_handles = handles.slice(i * 20, (i + 1) * 20);
  
                  _.xhr = $.ajax({
                      type: 'GET',
                      url: '/collections/all',
                      cache: false,
                      data: {
                          view: 'products_by_handle',
                          constraint: request_handles.join('+')
                      },
                      dataType: 'html',
                      success: function (data) {
                          $.each(JSON.parse(data), function() {
                              data_items.push(this);
                          });
  
                          i++;
  
                          if(i < cycles) {
                              recurcionRequests(i);
                          } else {
                              callback({
                                  params: items,
                                  products: data_items
                              });
                          }
                      }
                  });
              };
  
              recurcionRequests(i);
          },
          update: function($popup, callback) {
              var _ = this,
                  storage = localStorage.getItem(theme.StoreLists.lists[this.namespace].current_storage),
                  items = storage ? JSON.parse(storage) : [],
                  $content = $popup.find('.popup-' + this.namespace + '__content'),
                  $empty = $popup.find('.popup-' + this.namespace + '__empty'),
                  $items = $popup.find('.popup-' + this.namespace + '__items'),
                  $count = $popup.find('[data-js-popup-' + this.namespace + '-count]');
  
              $count.html(theme.strings.general.popups[this.namespace].count.replace('{{ count }}', items.length));
              $content[items.length > 0 ? 'removeClass' : 'addClass']('d-none-important');
              $empty[items.length > 0 ? 'addClass' : 'removeClass']('d-none-important');
  
              if(items.length > 0) {
                  var data = this._getProducts(items, function(data) {
                      _._resultToHTML($items, data, callback);
  
                      theme.ProductCurrency.update();
                  });
              } else {
                  $items.html('');
  
                  if(callback) {
                      callback();
                  }
              }
          },
          updateFull: function ($popup, callback) {
              var _ = this,
                  $content = $popup.find('.popup-' + this.namespace + '-full__content');
  
              $content.html('');
  
              var obj = {
                  type: 'GET',
                  data: {
                      view: _.namespace
                  },
                  cache: false,
                  success: function(data) {
                      $content.html(data);
                      theme.ImagesLazyLoad.update();
                      theme.ProductCurrency.update();
  
                      if(callback) {
                          callback();
                      }
                  }
              };
  
              if(theme.customer) {
                  $.extend(obj, {
                      url: '/cart'
                  });
              } else {
                  var storage = localStorage.getItem(theme.StoreLists.lists[this.namespace].current_storage),
                      items = storage ? JSON.parse(storage) : [],
                      constraint = [];
  
                  for(var i = 0; i < items.length; i++) {
                      $.each(items[i], function (v, k) {
                          constraint.push(k + '=' + v);
                      });
                  }
  
                  constraint.join('+');
  
                  $.extend(true, obj, {
                      url: '/collections/all',
                      data: {
                          constraint: constraint
                      }
                  });
              }
  
              $.ajax(obj);
          }
      });
  
  
      function StoreLists() {
          this.namespaces = [
              'wishlist',
              'compare'
          ];
  
          this.load();
      };
  
      StoreLists.prototype = $.extend({}, StoreLists.prototype, {
          lists: {},
          popups: {},
          load: function () {
              var triggers_array = [];
  
              for(var i = 0; i < this.namespaces.length; i++) {
                  this.lists[this.namespaces[i]] = new Engine(this.namespaces[i], function (obj) {
                      triggers_array.push(obj);
                  });
                  this.popups[this.namespaces[i]] = new Popup(this.namespaces[i]);
              }
  
              if(triggers_array.length) {
                  for(var i = 0; i < triggers_array.length; i++) {
                      triggers_array[i].trigger(true);
                  }
              }
          },
          checkProductStatus: function () {
              $.each(this.lists, function () {
                  this.checkProductStatus();
              });
          },
          updateHeaderCount: function () {
              $.each(this.lists, function () {
                  this.updateHeaderCount();
              });
          }
      });
  
      theme.StoreLists = new StoreLists;
  };
  theme.MenuBuilder = function ($menu, params) {
      function Menu($menu, params) {
          this.settings = {
              popup_name: 'navigation',
              button_navigation: 'data-js-popup-navigation-button'
          };
  
          this.selectors = {
              popup_navigation: '.js-popup-navigation'
          };
  
          this.params = {
  
          };
  
          this.init($menu, params);
      };
  
      Menu.prototype = $.extend({}, Menu.prototype, {
          is_vertical: false,
          is_open_animate: false,
          mobile_level: 0,
          duration: function () {
              return window.theme.animations.menu.duration > 0.1 ? (window.theme.animations.menu.duration - 0.1) * 1000 : 0;
          },
          init: function($menu, params) {
              var _ = this,
                  $panel = $menu.find('.menu__panel'),
                  $megamenus = $panel.find('.menu__megamenu'),
                  $dropdowns = $panel.find('.menu__dropdown'),
                  $popup_navigation = $(this.selectors.popup_navigation),
                  $button_navigation = $popup_navigation.find('[' + this.settings.button_navigation + ']'),
                  $curtain = $menu.find('.menu__curtain');
  
              this.$menu = $menu;
              this.$panel = $panel;
              this.$megamenus = $megamenus;
              this.$dropdowns = $dropdowns;
              this.$curtain = $curtain;
  
              this.is_vertical = $menu.hasClass('menu--vertical');
              this.is_vertical_fixed = $menu[0].hasAttribute('data-js-menu-vertical-fixed');
  
              if(this.is_vertical) {
                  var $menu_vertical_btn = $('.js-menu-vertical-btn-toggle'),
                      $menu_vertical_spacer = $('.vertical-menu-spacer'),
                      $panel_items = $panel.find('> .menu__item'),
                      $btn_see_all = $menu.find('[data-js-menu-vertical-see-all]'),
                      pannel_y_offsets = parseInt($panel.css('padding-top')) + parseInt($panel.css('padding-bottom'));
  
                  this.$menu_vertical_btn = $menu_vertical_btn;
                  this.$menu_vertical_spacer = $menu_vertical_spacer;
                  this.$btn_see_all = $btn_see_all;
  
                  this.$megamenus_width = $('[data-js-megamenu-width]');
  
                  this.handlerMenu = theme.Global.responsiveHandler({
                      namespace: params.namespace,
                      element: $menu_vertical_btn,
                      on_desktop: true,
                      events: {
                          'click': function(e) {
                              var $this = $(this);
  
                              if($this.hasClass('menu-vertical-btn--fixed')) {
                                  return;
                              }
  
                              $this.toggleClass('menu-vertical-btn--open');
  
                              $menu[$this.hasClass('menu-vertical-btn--open') ? 'addClass' : 'removeClass']('menu--open');
                          }
                      }
                  });
  
                  this.handlerMenu = theme.Global.responsiveHandler({
                      namespace: params.namespace,
                      element: $body,
                      delegate: '[data-js-menu-vertical-see-all]',
                      on_desktop: true,
                      events: {
                          'click': function(e) {
                              $menu.toggleClass('menu--items-visible');
                          }
                      }
                  });
  
                  this.closeVerticalMenu = function () {
                      $menu_vertical_btn.removeClass('menu-vertical-btn--open');
                      $menu.removeClass('menu--open');
                  };
  
                  if(this.is_vertical_fixed) {
                      this.openVerticalMenu = function () {
                          $menu_vertical_btn.addClass('menu-vertical-btn--open');
                          $menu.addClass('menu--open');
                      };
  
                      this.fixVerticalMenu = function () {
                          $menu_vertical_btn.addClass('menu-vertical-btn--fixed');
                          $menu.addClass('menu--fixed');
                      };
  
                      this.unfixVerticalMenu = function () {
                          $menu_vertical_btn.removeClass('menu-vertical-btn--fixed');
                          $menu.removeClass('menu--fixed');
                      };
  
                      if($menu_vertical_spacer.length) {
                          this.checkHeightVerticalMenu = function () {
                              var height = $menu_vertical_spacer[0].getBoundingClientRect().bottom - $menu[0].getBoundingClientRect().top,
                                  btn_see_all_height = $btn_see_all.innerHeight(),
                                  all_items_height = 0,
                                  items_result_height = 0,
                                  has_hidden_items = false,
                                  inner_height;
  
                              $panel.innerHeight(Math.max(height, btn_see_all_height + pannel_y_offsets));
  
                              inner_height = height - pannel_y_offsets;
  
                              $panel_items.each(function () {
                                  all_items_height += $(this).innerHeight();
                              });
  
                              $panel_items.each(function () {
                                  var $this = $(this);
  
                                  items_result_height += $this.innerHeight();
  
                                  if(all_items_height < inner_height || items_result_height < inner_height - btn_see_all_height) {
                                      $this.attr('data-js-menu-vertical-item', null);
                                  } else {
                                      $this.attr('data-js-menu-vertical-item', 'hidden');
                                      has_hidden_items = true;
                                  }
                              });
  
                              $btn_see_all[has_hidden_items ? 'addClass' : 'removeClass']('menu__see-all--visible');
                          };
  
                          this.handlerMenu = theme.Global.responsiveHandler({
                              namespace: params.namespace,
                              element: $window,
                              on_desktop: true,
                              onbindtrigger: 'verticalmenu.checkheight',
                              events: {
                                  'load.verticalmenu scroll.verticalmenu theme.resize.verticalmenu verticalmenu.checkheight': function(e) {
                                      $menu.removeClass('menu--items-visible');
  
                                      if($menu_vertical_btn[0].getBoundingClientRect().bottom + pannel_y_offsets + $panel_items.first().innerHeight() + $btn_see_all.innerHeight() > $menu_vertical_spacer[0].getBoundingClientRect().bottom) {
                                          $panel.css({
                                              'height': ''
                                          });
                                          
                                          _.closeVerticalMenu();
                                          _.unfixVerticalMenu();
                                      } else {
                                          _.openVerticalMenu();
                                          _.fixVerticalMenu();
                                          _.checkHeightVerticalMenu();
                                      }
                                  }
                              }
                          });
                      } else {
                          this.handlerMenu = theme.Global.responsiveHandler({
                              namespace: params.namespace,
                              element: $window,
                              on_desktop: true,
                              events: {
                                  'load.verticalmenu scroll.verticalmenu theme.resize.verticalmenu verticalmenu.checkheight': function(e) {
                                      $menu.removeClass('menu--items-visible');
  
                                      if($menu.parents('.header__content--sticky').length) {
                                          _.closeVerticalMenu();
                                          _.unfixVerticalMenu();
                                      } else {
                                          _.openVerticalMenu();
                                          _.fixVerticalMenu();
                                      }
                                  }
                              }
                          });
                      }
                  } else {
                      this.handlerMenu = theme.Global.responsiveHandler({
                          namespace: params.namespace,
                          element: $window,
                          on_desktop: true,
                          events: {
                              'load.verticalmenu scroll.verticalmenu theme.resize.verticalmenu verticalmenu.checkheight': function(e) {
                                  $menu.removeClass('menu--items-visible');
  
                                  _.closeVerticalMenu();
                              }
                          }
                      });
                  }
              }
  
              if($panel.find('[data-js-menu-preview-image]').length) {
                  this.handlerMenu = theme.Global.responsiveHandler({
                      namespace: params.namespace,
                      element: $panel,
                      delegate: '.menu__item > a',
                      on_desktop: true,
                      events: {
                          'mouseenter': function() {
                              var $this = $(this),
                                  $preview = $this.find('[data-js-menu-preview-image]'),
                                  $image,
                                  $header,
                                  bounce;
  
                              if($preview.length) {
                                  $image = $preview.children().first();
                                  $header = $('.header__content--sticky');
  
                                  if(!$header.length) {
                                      $header = $('.header');
                                  }
  
                                  bounce = $window.innerHeight() - $image[0].getBoundingClientRect().bottom;
  
                                  if(bounce < 0) {
                                      bounce *= -1;
  
                                      if($header.length) {
                                          bounce = Math.min(bounce + 20, $this[0].getBoundingClientRect().bottom - $header[0].getBoundingClientRect().bottom - 20);
                                      }
  
                                      $image.css({ 'margin-top': bounce * -1 });
                                  }
                              }
                          },
                          'mouseleave': function() {
                              var $this = $(this),
                                  $preview = $this.find('[data-js-menu-preview-image]'),
                                  $image;
  
                              if($preview.length) {
                                  $image = $preview.children().first();
  
                                  $preview.one('transitionend', function () {
                                      $image.removeAttr('style');
                                  });
  
                                  if($preview.css('transition-duration') === '0s') {
                                      $preview.trigger('transitionend');
                                  }
                              }
                          }
                      }
                  });
              }
  
              function checkScroll($list) {
                  $menu[$list.height() > $menu.height() ? 'addClass' : 'removeClass']('menu--scroll-visible');
  
                  $menu.unbind('scroll');
  
                  $menu.one('scroll', function () {
                      $menu.removeClass('menu--scroll-visible');
                  });
              };
  
              function checkMinHeight($list) {
                  var $popup_content = $panel.parents('[data-popup-content]'),
                      min_height;
  
                  $panel.css({
                      'min-height': ''
                  });
  
                  min_height = $list.innerHeight();
  
                  $panel.css({
                      'min-height': Math.ceil(min_height)
                  });
  
                  $popup_content.css({
                      'overflow': 'hidden'
                  });
  
                  setTimeout(function() {
                      $popup_content.removeAttr('style');
                  }, 100);
              };
  
              this.handlerMenu = theme.Global.responsiveHandler({
                  namespace: params.namespace,
                  element: $menu,
                  delegate: 'a',
                  on_mobile: true,
                  events: {
                      'click': function(e) {
                          var $this = $(this),
                              $item = $this.parent(),
                              $list = $item.find('.menu__list').first(),
                              level;
  
                          $panel.unbind('transitionend');
  
                          if($list.length) {
                              if ($item.parents('.menu__level-03').length) {
                                  level = 4;
                              } else if ($item.parents('.menu__level-02').length) {
                                  level = 3;
                              } else {
                                  level = 2;
                              }
  
                              $menu.scrollTop(0);
  
                              $item.addClass('open');
  
                              $list.addClass('show');
  
                              $panel.attr('data-mobile-level', level);
  
                              checkMinHeight($list);
  
                              checkScroll($list);
  
                              $button_navigation.attr(_.settings.button_navigation, 'back');
  
                              _.mobile_level = level;
  
                              e.preventDefault();
                              return false;
                          }
                      }
                  }
              });
  
              this.handlerBack = theme.Global.responsiveHandler({
                  namespace: params.namespace,
                  element: $popup_navigation,
                  delegate: '[' + this.settings.button_navigation + '="back"]',
                  on_mobile: true,
                  events: {
                      'click': function() {
                          var level = $panel.attr('data-mobile-level') - 1,
                              button_status = level > 1 ? 'back' : 'close',
                              $item = $menu.find('.menu__item.open').last(),
                              $list = $item.find('.menu__list').first();
  
                          $menu.scrollTop(0);
  
                          _.mobile_level = level;
  
                          if(_.is_vertical && theme.Menu) {
                              if(theme.Menu.mobile_level > 1) {
                                  button_status = 'back';
                              }
                          } else if(!_.is_vertical && theme.VerticalMenu) {
                              if(theme.VerticalMenu.mobile_level > 1) {
                                  button_status = 'back';
                              }
                          }
  
                          $item.removeClass('open');
  
                          $panel.one('transitionend', function () {
                              $list.removeClass('show');
                          });
  
                          $panel.attr('data-mobile-level', level);
  
                          checkMinHeight($item.parents('.menu__list').first());
  
                          checkScroll($list.parents('.menu__list').first());
  
                          $button_navigation.attr(_.settings.button_navigation, button_status);
  
                          if($panel.css('transition-duration') === '0s') {
                              $panel.trigger('transitionend');
                          }
                      }
                  }
              });
  
              theme.Popups.addHandler(this.settings.popup_name, 'close.before.closeMobileMenu', function() {
                  if(theme.current.is_mobile) {
                      _.closeMobileMenu();
  
                      $button_navigation.attr(_.settings.button_navigation, 'close');
                  }
              });
  
              this.handlerDropdown = theme.Global.responsiveHandler({
                  namespace: params.namespace,
                  element: $panel,
                  delegate: '> .menu__item',
                  on_desktop: true,
                  events: {
                      'mouseenter mouseleave': function(e) {
                          if(theme.SearchAjax) {
                              theme.SearchAjax.closeAll();
                          }
  
                          _._toggleMegamenu($(this), e);
                      }
                  }
              });
  
              this.handlerDropdown = theme.Global.responsiveHandler({
                  namespace: params.namespace,
                  element: $panel,
                  delegate: '> .menu__item > a',
                  on_desktop: true,
                  events: {
                      'touchstart': function(e) {
                          $body.unbind('touchstart.menu-item');
  
                          var $item = $(this).parent(),
                              $megamenuOrDropdown = $item.find('.menu__megamenu, .menu__dropdown');
  
                          if($megamenuOrDropdown.length) {
                              if(!$megamenuOrDropdown.hasClass('show')) {
                                  $item.trigger('mouseenter');
  
                                  $body.one('touchstart.menu-item', function (e) {
                                      if(!$.contains($megamenuOrDropdown[0], e.target)) {
                                          $item.trigger('mouseleave');
                                      }
                                  });
                              } else {
                                  location.href = $item.find('> a').attr('href');
                              }
  
                              e.preventDefault;
                              return false;
                          } else {
                              var $openedMenu = $panel.find('.menu__megamenu, .menu__dropdown').filter('.show')
  
                              if($openedMenu.length) {
                                  $openedMenu.first().parents('.menu__item').find('> a').trigger('mouseleave');
  
                                  setTimeout(function() {
                                      location.href = $item.find('> a').attr('href');
                                  }, (window.theme.animations.menu.duration > 0.1 ? (window.theme.animations.menu.duration - 0.1) * 1000 : 0));
  
                                  e.preventDefault;
                                  return false;
                              }
                          }
                      }
                  }
              });
  
              $window.on('theme.changed.breakpoint' + params.namespace, function () {
                  if(theme.current.is_desktop) {
                      _.closeMobileMenu(true);
  
                      $button_navigation.attr(_.settings.button_navigation, 'close');
                  }
              });
  
              $menu.addClass('menu--loaded');
  
              return {
                  destroy: function() {
                      theme.Popups.removeHandler(_.settings.popup_name, 'close.before.closeMobileMenu');
                      _.handlerMenu.unbind();
                      _.handlerBack.unbind();
                      _.handlerDropdown.unbind();
                  }
              }
          },
          _toggleMegamenu: function ($item, e) {
              var _ = this,
                  $megamenu = $item.find('.menu__megamenu'),
                  $dropdown = $item.find('.menu__dropdown'),
                  $holder = $item.find('.menu__holder'),
                  width_limit;
  
              if(e.type === 'mouseenter') {
                  if($megamenu.length) {
                      this.is_open_animate = true;
  
                      $holder.removeClass('d-none').css({
                          height: this.$panel[0].getBoundingClientRect().bottom - $item[0].getBoundingClientRect().bottom + 'px'
                      });
  
                      $megamenu.velocity('stop', true);
                      this.$dropdowns.velocity('finish');
  
                      if(this.is_vertical) {
                          width_limit = $megamenu.attr('data-js-width-limit');
  
                          width_limit = width_limit ? +width_limit : Infinity;
  
                          $megamenu.add(this.$curtain).css({
                              'width': Math.ceil(Math.min(width_limit, this.$megamenus_width.innerWidth())) + 1
                          });
  
                          if(!this.$megamenus.filter('.show').length) {
                              this.$curtain.add($megamenu).css({
                                  'height': Math.ceil($menu.innerHeight())
                              });
                          }
                      }
  
                      this.$megamenus.not($megamenu).removeClass('show animate visible').removeAttr('style');
                      this.$dropdowns.removeClass('show animate visible').removeAttr('style');
  
                      $megamenu.addClass('show overflow-hidden');
  
                      var max_height = theme.current.height - $megamenu[0].getBoundingClientRect().top,
                          /*height = Math.min($megamenu.children().innerHeight(), max_height);*/
                          height = $megamenu.children().innerHeight();
  
                      if(this.is_vertical) {
                          height = Math.max($menu.innerHeight(), height);
                      }
  
                      /*$megamenu.css({
                          'max-height': Math.ceil(max_height)
                      });*/
  
                      this.$curtain.velocity({
                          height: height,
                          tween: [height, this.$curtain.height()]
                      }, {
                          duration: this.duration(),
                          begin: function () {
                              _.$curtain.addClass('show');
                              $megamenu.addClass('animate visible');
                          },
                          progress: function (elements, c, r, s, t) {
                              $megamenu.height(t);
                          },
                          complete: function () {
                              $megamenu.removeClass('overflow-hidden').css({
                                  'max-height': ''
                              });
  
                              _.is_open_animate = false;
                          }
                      });
                  } else if($dropdown.length) {
                      if($(e.target).parents('.menu__dropdown').length) {
                          return;
                      }
  
                      $dropdown.addClass('show');
  
                      $dropdown.velocity('stop', true);
                      this.$megamenus.velocity('finish');
  
                      this.$dropdowns.not($dropdown).removeClass('show animate visible').removeAttr('style');
                      this.$megamenus.removeClass('show animate visible').removeAttr('style');
  
  
  
                      $dropdown.velocity('slideDown', {
                          duration: this.duration(),
                          begin: function () {
                              setTimeout(function () {
                                  $dropdown.addClass('animate visible');
                              }, 0);
                          },
                          complete: function () {
                              $dropdown.removeAttr('style');
                          }
                      });
                  }
              } else if(e.type === 'mouseleave') {
                  if($megamenu.length && $megamenu.hasClass('show')) {
                      this.$curtain.velocity('stop');
  
                      $holder.addClass('d-none').removeAttr('style');
  
                      $megamenu.velocity({
                          height: 0,
                          tween: [0, $megamenu.height()]
                      }, {
                          duration: this.duration(),
                          begin: function () {
                              $megamenu.addClass('overflow-hidden').removeClass('visible');
                          },
                          progress: function (elements, c, r, s, t) {
                              _.$curtain.height(t);
                          },
                          complete: function () {
                              $megamenu.removeClass('show animate overflow-hidden').removeAttr('style');
  
                              if(!_.is_open_animate) {
                                  _.$curtain.removeClass('show').removeAttr('style');
                              }
                          }
                      });
                  } else if($dropdown.length) {
                      $dropdown.velocity('slideUp', {
                          duration: this.duration(),
                          begin: function () {
                              $dropdown.removeClass('visible');
                          },
                          complete: function () {
                              $dropdown.removeClass('show animate').removeAttr('style');
                          }
                      });
                  }
              }
          },
          closeMobileMenu: function(manually) {
              if(theme.current.is_mobile || manually) {
                  var $panel = this.$menu.find('.menu__panel');
  
                  $panel.find('.menu__item').removeClass('open');
  
                  $panel.one('transitionend', function () {
                      $panel.find('.menu__list').removeClass('show');
                  });
  
                  $panel.attr('data-mobile-level', '1');
  
                  if($panel.css('transition-duration') === '0s') {
                      $panel.trigger('transitionend');
                  }
  
                  this.$menu.scrollTop(0);
  
                  this.mobile_level = 0;
              }
          }
      });
  
      var api = new Menu($menu, params);
  
      return api;
  };
  theme.Accordion = function () {
  
      function Accordion() {
          this.settings = {
              elements: 'data-js-accordion',
              button: 'data-js-accordion-button',
              duration: function () {
                  return theme.animations.accordion.duration * 1000;
              }
          };
  
          this.selectors = {
              elements: '[' + this.settings.elements + ']',
              button: '[' + this.settings.button + ']',
              content: '[data-js-accordion-content]',
              input: '[data-js-accordion-input]'
          };
  
          this.load();
      };
  
      Accordion.prototype = $.extend({}, Accordion.prototype, {
          load: function () {
              var _ = this;
  
              function toggle(e) {
                  var $this = $(this),
                      $input = $this.find(_.selectors.input),
                      update_sticky = false;
  
                  if ($input.length) {
                      if (e.target.tagName === 'INPUT') {
                          return;
                      } else if ($.contains($this.find('label')[0], e.target) && !$input.prop('checked') && $this.hasClass('open')) {
                          return;
                      }
                  }
  
                  var $element = $this.parents(_.selectors.elements).first(),
                      $content = $element.find(_.selectors.content);
  
                  if($this.attr('data-js-accordion-select') !== 'all') {
                      $content = $content.first();
                  }
  
                  if ($content.is(':animated')) {
                      return;
                  }
  
                  $this.toggleClass('open');
  
                  if($content.parents('.sticky-sidebar').length) {
                      update_sticky = true;
                  }
  
                  if ($this.hasClass('open')) {
                      $content.hide().removeClass('d-none').slideDown({
                          duration: _.settings.duration(),
                          start: function () {
                              if(update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-enable');
                              }
                          },
                          progress: function () {
                              if(update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-process');
                              }
                          },
                          complete: function () {
                              $content.removeAttr('style');
  
                              if (update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-disable');
                              }
                          }
                      });
                  } else {
                      $content.slideUp({
                          duration: _.settings.duration(),
                          start: function () {
                              if(update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-enable');
                              }
                          },
                          progress: function () {
                              if(update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-process');
                              }
                          },
                          complete: function () {
                              $content.addClass('d-none').removeAttr('style');
  
                              if (update_sticky && theme.StickySidebar) {
                                  theme.StickySidebar.update('listener-disable');
                              }
                          }
                      });
                  }
  
                  $element.find(_.selectors.button)
                      .not($this)
                      .not($element.find(_.selectors.content).find(_.selectors.button))
                      .add($element.find('[' + _.settings.button + '="inner"]'))
                      [$this.hasClass('open') ? 'addClass' : 'removeClass']('open');
              };
  
              $body.on('click', '[' + this.settings.elements + '="all"] ' + this.selectors.button, toggle);
  
              theme.Global.responsiveHandler({
                  namespace: '.accordion',
                  element: '[' + this.settings.elements + '="only-mobile"] ' + this.selectors.button,
                  on_mobile: true,
                  events: {
                      'click': toggle
                  }
              });
          }
      });
  
      theme.Accordion = new Accordion;
  };
  
  
  
  /*================ Sections ================*/
  window.Section = {};
  
  Section.prototype = $.extend({}, Section.prototype, {
      _registerHansler: function() {
          if(!this.elemsHasHandler) {
              this.elemsHasHandler = [];
          }
  
          for (var i = 0; i < arguments.length; i++) {
              this.elemsHasHandler.push(arguments[i]);
          }
      },
      _offHanslers: function() {
          if(this.elemsHasHandler && $.isArray(this.elemsHasHandler)) {
              for (var i = 0; i < this.elemsHasHandler.length; i++) {
                  $(this.elemsHasHandler[i]).off();
              }
  
              delete this.elemsHasHandler;
          }
      }
  });
  
  $(function() {
    theme.ProductCurrency();
    theme.Position();
    theme.Dropdown();
    theme.Select();
    theme.Loader();
    theme.ButtonsBlocksVisibility();
    theme.Trigger();
    theme.dynamicCheckout();
    theme.Popups();
    theme.PopupAccount();
    theme.PopupSearch();
    theme.PopupQuickView();
    theme.ProductQuantity();
    theme.ProductCountdown();
    theme.ProductTextCountdown();
    theme.ProductVisitors();
    theme.ProductImagesNavigation();
    theme.ProductImagesHover();
    theme.ProductOptions();
    theme.ProductReview();
    theme.cart();
    theme.StoreLists();
    theme.Accordion();
  
    theme.sections = new slate.Sections();

    // Common a11y fixes

    if(window.location.hash.indexOf('.') === -1) {

        slate.a11y.pageLinkFocus($(window.location.hash + ''));

    

        $('.in-page-link').on('click', function(evt) {

            slate.a11y.pageLinkFocus($(evt.currentTarget.hash + ''));

        });

    }

    

    // Target tables to make them scrollable

    var tableSelectors = '.rte table';

    

    /*slate.rte.wrapTable({

        $tables: $(tableSelectors),

        tableWrapperClass: 'rte__table-wrapper'

    });*/

    

    // Target iframes to make them responsive

    var iframeSelectors =

        '.rte iframe[src*="youtube.com/embed"]:not(.not-responsive),' +

        '.rte iframe[src*="player.vimeo"]:not(.not-responsive)';

    

    slate.rte.wrapIframe({

        $iframes: $(iframeSelectors),

        iframeWrapperClass: 'rte__video-wrapper'

    });

    

    // Apply a specific class to the html element for browser support of cookies.

    if (slate.cart.cookiesEnabled()) {

        document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');

    }
  });
})(jQueryTheme);