/*
combined files : 

kg/superbase/2.0.0/index

*/
/**
 * @fileoverview 
 * @author 虎牙<huya.nzb@alibaba-inc.com>
 * @version 2.0.0
 * @date 2014-02.0.09
 * @module superbase
 */

KISSY.add('kg/superbase/2.0.0/index',function (S, Base, Do) {
    
    'use strict';
    
    var BaseProto = Base.prototype,
    
        ATTR_CHANGE_REG = /^.+Change$/,
        WHEN_ATTR_CHANGE_REG = /^(after|before).+Change$/,
        
        KS_PULISHED_EVENTS = '__~ks_published_events',
        
        INITIALIZER = 'initializer',
        DESTRUCTOR = 'destructor',
        
        UNSHIFT = 'unshift',
        PUSH = 'push',
        
        STRING = 'string',
        BEFORE = 'before',
        AFTER = 'after',
        
        _DEF = '_def',
        FN = 'Fn';
    
    /**
     * 转成大驼峰
     * @method toCamel
     * @param {String} s 字符串
     * @return {String} 大驼峰字符串
     * @private 
     */
    function toCamel(s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
    
    /**
     * 方法包裹器
     * @method wrap
     * @param {Object} px 原型对象
     * @param {Array} exts 扩展集
     * @param {String} method 方法名
     * @param {Boolean} reverse 倒序执行
     * @return {Object} 包裹方法后的对象
     * @private
     */
    function wrap(sx, px, exts) {
        var i = 0,
            l = exts.length,
            initializerFns = [px[INITIALIZER] || function() {}],
            destructorFns = [px[DESTRUCTOR] || function() {}],
            proto;
        
        function execute(fns, args) {
            var l = fns.length,
                i = 0;
            
            for (; i < l; i++) {
                fns[i].apply(this, args);
            }
        }
        
        for (; i < l; i++) {
            proto = exts[i].prototype;
            proto[INITIALIZER] && initializerFns.push(proto[INITIALIZER]);
            proto[DESTRUCTOR] && destructorFns.unshift(proto[DESTRUCTOR]);
        }
        
        px[INITIALIZER] = function() {
            execute.call(this, initializerFns, S.makeArray(arguments));
        };
        
        px[DESTRUCTOR] = function() {
            execute.call(this, destructorFns, S.makeArray(arguments));
        };
        
        sx.__wrapInitializerFns = initializerFns;
        sx.__wrapDestructorFns = destructorFns;
        
        return px;
    }
    
    /**
     * 合并扩展
     * @method mix
     * @param {Array} exts 扩展集
     * @param {String} method 方法名
     * @param {Boolean} reverse 倒序执行
     * @private
     */
    function mix(exts) {
        var i = 0,
            l = exts.length,
            constructor = this,
            initializerFns = constructor.__wrapInitializerFns,
            destructorFns = constructor.__wrapDestructorFns,
            mixAttrs = {},
            mixProto = {},
            proto, p;
            
        for (; i < l; i++) {
            proto = exts[i].prototype;
            proto[INITIALIZER] && initializerFns.push(proto[INITIALIZER]);
            proto[DESTRUCTOR] && destructorFns.unshift(proto[DESTRUCTOR]);
        }
        
        exts = constructor.__extensions__ = constructor.__extensions__.concat(exts);
        
        S.each(exts, function(ext) {
            S.each(ext.ATTRS, function (v, name) {
                mixAttrs[name] = mixAttrs[name] || {};
                S.mix(mixAttrs, v);
            });
            
            S.each(ext.prototype, function(p, name) {
                mixProto[name] = p;
            });
        });
        
        S.mix(mixAttrs, constructor.__originAttrs);
        S.mix(mixProto, constructor.__originProto);
        
        S.mix(constructor.ATTRS, mixAttrs);
        S.mix(constructor.prototype, mixProto);
    }
    
    /**
     * 拆分执行
     * @method splitAndRun
     * @param {String} type 名称
     * @param {Function} fn 回调
     * @private
     */
    function splitAndRun(type, fn) {
        if (S.isArray(type)) {
            S.each(type, fn);
            return;
        }
        
        type = S.trim(type);
        
        if (type.indexOf(' ') == -1) {
            fn(type);
        } else {
            S.each(type.split(/\s+/), fn);
        }
    }
    
    /**
     * 批量执行
     * @method batchForType
     * @param {Function} fn
     * @param {Number} num 
     * @private
     */
    function batchForType(fn, num) {
        var args = S.makeArray(arguments),
            types = args[2 + num];
        
        // in case null
        if (types && typeof types == 'object') {
            S.each(types, function (value, type) {
                var args2 = [].concat(args);
                args2.splice(0, 2);
                args2[num] = type;
                args2[num + 1] = value;
                fn.apply(null, args2);
            });
        } else {
            splitAndRun(types, function (type) {
                var args2 = [].concat(args);
                args2.splice(0, 2);
                args2[num] = type;
                fn.apply(null, args2);
            });
        }
    }
    
    /**
     * 获取默认事件回调
     * @param {String} camel 大驼峰事件名
     * @param {Object} cfg 事件配置
     * @return {Function} 默认回调
     * @private
     */
    function getDefaultFn(camel, cfg) {
        var defaultFn = cfg.defaultFn,
            async = cfg.async;
        
        return function(e) {
            var self = this,
                fn = this[_DEF + camel + FN] || defaultFn;
            
            //执行默认函数    
            fn && fn.call(this, e);
            
            //执行after回调函数
            if (e.target === this && !e.isImmediatePropagationStopped()) {
                e.type = AFTER + camel;
                
                if (async) {
                    setTimeout(function() {
                        self.fire(e.type, e);
                    }, 0);
                } else {
                    this.fire(e.type, e);
                }
            }
        };
    }
    
    /**
     * 超级牛逼的Base
     * @class SuperBase
     * @constructor
     * @extends Base
     */
    var SuperBase = Base.extend({
        
        /**
         * 初始化
         * @method initializer
         * @public
         */
        initializer: function() {
            this[KS_PULISHED_EVENTS] = {};
        },
        
        /**
         * AOP before 方法
         * @method doBefore
         * @param {Object} fn 执行回调
         * @param {Object} obj 对象
         * @param {Object} sFn 方法名
         * @param {Object} c 上下文 this
         * @return {EventHandler} 事件句柄
         * @public
         */
        doBefore: function(fn, obj, sFn, c) {
            return Do.before(typeof fn === STRING ? this[fn] : fn, obj, sFn, c || this);
        },
        
        /**
         * AOP after 方法
         * @method doAfter
         * @param {Object} fn 执行回调
         * @param {Object} obj 对象
         * @param {Object} sFn 方法名
         * @param {Object} c 上下文 this
         * @return {EventHandler} 事件句柄
         * @public
         */
        doAfter: function(fn, obj, sFn, c) {
            return Do.after(typeof fn === STRING ? this[fn] : fn, obj, sFn, c || this);
        },
        
        /**
         * 发布事件（覆盖Base，实现after('event', fn)功能）
         * @method publish
         * @param {Object} type
         * @param {Object} cfg
         * @chainable
         * @public
         */
        publish: function(type, cfg) {
            var self = this;
            
            splitAndRun(type, function(t) {
                var c = S.merge(cfg),
                    camel = toCamel(t);
                
                //过滤beforeAttrChange和afterAttrChange
                if (WHEN_ATTR_CHANGE_REG.test(t)) {
                    BaseProto.publish.call(self, t, c);
                    return; 
                }
                
                c.defaultFn = getDefaultFn(camel, c);
                BaseProto.publish.call(self, t, c);
                delete c.defaultFn;
                BaseProto.publish.call(self, AFTER + camel, c);
                self[KS_PULISHED_EVENTS][t] = 1;
            });
            
            return this;
        },
        
        /**
         * 绑定on事件（覆盖Base，实现on('attrChange') === on('beforeAttrChange')功能）
         * @method on
         * @param {String} type 事件名 
         * @param {Function} fn 事件回调 
         * @param {Object} context 上下文
         * @chainable
         * @public
         */
        on: function(type, fn, context) {
            var self = this;
            
            batchForType(function(type, fn, context) {
                
                //如果为attrChange，则转换成beforeAttrChange
                if (ATTR_CHANGE_REG.test(type) && !WHEN_ATTR_CHANGE_REG.test(type)) {
                    type = BEFORE + toCamel(type);
                }
                
                BaseProto.on.call(self, type, fn, context);
            }, 0, type, fn, context);
            
            return this;
        },
        
        /**
         * 绑定before事件（等同on）
         * @method before
         * @param {String} type 事件名 
         * @param {Function} fn 事件回调 
         * @param {Object} context 上下文
         * @chainable
         * @public
         */
        before: function() {
            return this.on.apply(this, arguments);  
        },
        
        /**
         * 绑定after事件
         * @method after
         * @param {String} type 事件名 
         * @param {Function} fn 事件回调 
         * @param {Object} context 上下文
         * @chainable
         * @public
         */
        after: function(type, fn, context) {
            var self = this;
            
            batchForType(function(type, fn, context) {
                
                //如果未发布过该事件，先发布事件
                //否则after回调不会执行
                if (!self[KS_PULISHED_EVENTS][type]) {
                    self.publish(type);
                }
                
                BaseProto.on.call(self, AFTER + toCamel(type), fn, context);
            }, 0, type, fn, context);
            
            return this;
        },
        
        /**
         * 解除after事件绑定
         * @method detachAfter
         * @param {String} type 事件名 （不能为空，不支持 this.detachAfter()）
         * @param {Function} fn 事件回调 
         * @param {Object} context 上下文
         * @chainable
         * @public
         */
        detachAfter: function(type, fn, context) {
            var self = this;
            
            //不支持为空，为空的话相当于detach()，解除所有事件绑定，与API名称不符
            if (!type) { return this; }
            
            batchForType(function (type, fn, context) {
                BaseProto.detach.call(self, AFTER + toCamel(type), fn, context);
            }, 0, type, fn, context);
            
            return this;
        }
        
    });
    
    /**
     * 继承（覆盖Base extend，实现执行extension的initializer及destructor）
     * @method extend
     * @param {Object} exts 扩展集
     * @param {Object} px 原型对象
     * @param {Object} sx 静态对象
     * @static
     */
    SuperBase.extend = function(exts, px, sx) {
        var SubClass, ATTRS;
        
        if (!S.isArray(exts)) {
            sx = px;
            px = exts;
            exts = [];
        }
        
        sx = sx || {};
        ATTRS = sx.ATTRS || (sx.ATTRS = {});
        
        px = px || {};
        px = wrap(sx, px, exts);
        
        SubClass = Base.extend.call(this, exts, px, sx);
        SubClass.extend = SuperBase.extend;
        SubClass.mix = SuperBase.mix;
        SubClass.__originAttrs = ATTRS;
        SubClass.__originProto = px;
        
        return SubClass;
    };
    
    /**
     * 扩展更多
     * @method mix
     * @param {Object} exts 扩展集
     * @static
     */
    SuperBase.mix = function(exts) {

        if (!S.isArray(exts) && exts) {
            exts = [exts];
        }
        
        exts && mix.call(this, exts);
        
        return this;
    };

    return SuperBase;
    
}, {
    requires: ['base', 'kg/aop/1.1/']
});
