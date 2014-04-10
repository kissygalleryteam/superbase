## SuperBase

- BY 虎牙
- 版本：1.0

## 简介

> 超级无敌牛逼的Base，继承于Base，扩充更多有用的功能，让代码写得更爽，a little more YUI style

## WHY

* Base对extension的管理不够完全，extension无法在initializer之后和destructor之前处理自己的逻辑，解耦不够完全
* Base不能在事件的defaultFn之后处理逻辑，显得defaultFn很鸡肋

## 扩充的功能

* 集成AOP功能，提供doBefore，doAfter方法，参见[http://gallery.kissyui.com/aop/1.1/guide/index.html](gallery/aop)
* 初始化和销毁时自动执行extensions的inititalizer及destructor方法
* 提供after事件绑定，在defaultFn之后执行
* 除了SuperBase.extend方法之外，还添加了SuperBase.mix方法，可以额外添加扩展

## 常用方法

### doBefore _(fn, obj, sFn, context)_

注入before回调，参见[http://gallery.kissyui.com/aop/1.1/guide/index.html](gallery/aop)

### doAfter _(fn, obj, sFn, context)_

同doBefore

### after _(type, fn, context)_

绑定after事件，在defaultFn后触发（效果同on('afterType')，推荐用after），参数同on

### detachAfter _(type, fn, context)_

解除after的绑定，同detach（但type不能为空）

### extend _(exts, px, sx)_

子组件继承，同Base.extend

### mix _(exts)_

扩充当前组件的扩展集

## 简单例子

    KISSY.use('gallery/superbase/1.0/', function(S, SuperBase) {
        
        //Widget扩展
        function Ext() {
            console.log('Ext constructor');
        }
        
        Ext.prototype = {
            
            initializer: function() {
                console.log('Ext initializer');
            },
            
            destructor: function() {
                console.log('Ext destructor');
            }
            
        };
        
        //Widget组件
        var Widget = SuperBase.extend([Ext], {
            
            initializer: function() {
                console.log('Widget initializer');
            },
            
            destructor: function() {
                console.log('Widget destructor');
            }
            
        });
        
        //Box扩展
        function BoxExt() {
            console.log('BoxExt constructor');
        }
        
        BoxExt.prototype = {
            
            initializer: function() {
                console.log('BoxExt initializer');
                
                this.doBefore(function() {
                    console.log('doBefore render');
                }, this, 'render');
                
                this.doAfter(function() {
                    console.log('doAfter render');
                }, this, 'render');
            },
            
            destructor: function() {
                console.log('BoxExt destructor');
            }
            
        };
        
        //Box组件
        var Box = Widget.extend({
            
            initializer: function() {
                console.log('Box initializer');
                
                this.on('render', function(e) {
                    console.log('on render'); 
                });
                
                this.after('render', function(e) {
                    console.log('after render');
                });
                
                this.on('visibleChange', function(e) {
                    console.log('beforeVisibleChange');
                });
                
                this.after('visibleChange', function(e) {
                    console.log('afterVisibleChange');
                });
                
            },
            
            render: function() {
                this.fire('render'); 
                return this; 
            },
            
            destructor: function() {
                console.log('Box destructor');
            },
            
            _defRenderFn: function() {
                console.log('def render');
            }
            
        }, {
        
            ATTRS: {
                visible: {
                    value: false
                }
            }
        
        });
        
        //扩充
        Box.mix([BoxExt]);
        
        var box = new Box();
        box.render();
        box.set('visible', true);
        box.destroy();
        
        // 执行顺序
        
        // Base constructor
        // SuperBase constructor
        // Widget constructor
        // Ext constructor
        // Widget initializer
        // Ext initializer
        // Box constructor
        // BoxExt constructor
        // Box initializer
        // BoxExt initializer
        // doBefore render
        // on render
        // def render
        // after render
        // doAfter render
        // beforeVisibleChange
        // afterVisibleChange
        // BoxExt destructor
        // Box destructor
        // Ext destructor
        // Widget destructor
        
    });
