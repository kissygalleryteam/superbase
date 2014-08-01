## SuperBase

- BY 虎牙
- 版本：2.0.0

## 简介

> 超级无敌牛逼的Base，继承于Base，扩充更多有用的功能，让代码写得更爽，a little more YUI style

## WHY

* Base中，extension无法在initializer之后处理自己的逻辑，并且没有destructor的生命周期
* Base中，extend完之后无法选择性去扩充更多可选的extension，
* Base中，不能在事件的defaultFn之后处理逻辑，显得defaultFn很鸡肋，Attribute中有afterAttrChange事件，但是Base不支持其他afterEvent类型事件

## 扩充的功能

* 集成AOP功能，提供doBefore，doAfter方法，参见[http://kg.kissyui.com/aop/1.1/guide/index.html](kg/aop)
* 初始化和销毁时自动执行extensions的inititalizer及destructor方法
* 提供after事件绑定，在defaultFn之后执行
* 除了SuperBase.extend方法之外，还添加了SuperBase.mix方法，可以额外添加扩展

## 使用SuperBase

    KISSY.use('kg/superbase/2.0.0/', function(S, SuperBase) {
    
        //你的代码
    
    });
    
## extend - 继承

使用方法和Base.extend完全一样

    var AutoComplete = SuperBase.extend([AutoCompleteSource, AutoCompleteList], {
        initializer: function() {},
        destructor: function() {},
        render: function() {}
    }, {
        ATTRS: {
            rendered: {
                value: false
            }            
        },
        name: 'autocomplete'
    });
    
## mix - 扩充

给组件扩充更多地扩展集，比如说自动完成组件AutoComplete有一个扩展AutoCompleteKeys，提供通过键盘操作上下左右选中选项的功能，这个功能是可选的。
这样的话就不需要在extend的时候扩充进去，我们可以在autocomplete-keys.js里使用mix的方法扩充到AutoComplete里，这样新的事例就拥有键盘操作的功能了。

    function AutoCompleteKeys() {}
    
    //more autocomplete-keys code
    
    AutoComplete.mix([AutoCompleteKeys]);
    
## initializer & destructor - 扩展集的初始化与销毁

扩展和组件一样，也应该拥有初始化与销毁的生命周期，一个组件里拥有多个扩展的话，应该在new和destroy的时候正确地按顺序执行自己及扩展的initializer和destructor。
比如AutoComplete组件拥有AutoCompleteSource,AutoCompleteList,AutoCompleteKeys三个扩展，初始化和销毁顺序如下

    var AutoComplete = SuperBase.extend([AutoCompleteSource, AutoCompleteList], {}, {});
    
    AutoComplete.mix([AutoCompleteKeys]);
    
    //初始化
    var autocomplete = new AutoComplete({});
    
    //销毁
    autocomplete.destroy();
    
    //生命周期
    //AutoComplete constructor
    //AutoCompleteSource constructor
    //AutoCompleteList constructor
    //AutoCompleteKeys constructor
    
    //AutoComplete initializer
    //AutoCompleteSource initializer
    //AutoCompleteList initializer
    //AutoCompleteKeys initializer
    
    //AutoCompleteKeys destructor
    //AutoCompleteList destructor
    //AutoCompleteSource destructor
    //AutoComplete destructor
    
## defaultFn & after 默认事件回调与after事件

我们使用自定义事件时，经常会有默认处理回调，比如AutoComplete组件，选中一个选项的时候，给该节点添加ac-selected的class

    var AutoComplete = SuperBase.extend([AutoCompleteSource, AutoCompleteList], {
        
        initializer: function() {
            this.publish('select', {
                defaultFn: this._defSelectFn
            });
        },
        
        select: function(item) {
            this.set('selectedItem', item);
            this.fire('select', {
                item: item
            });
        },
        
        _defSelectFn: function(e) {
            e.item.addClass('ac-selected');
        }
        
    }, {
    
        ATTRS: {
            selectedItem: {
                value: null
            }
        }
    
    });
    
    var autocomplete = new AutoComplete({});
    
    autocomplete.on('select', function(e) {
        
        //null
        //defaultFn未执行
        //此时item还未添加ac-selected的class
        console.log(S.one('ac-selected'));
    });
    
    autocomplete.select(item);
    
但是有时候，我们需要在defaultFn之后进行一些处理，但是Base不提供这样的功能，SuperBase中可以通过after来绑定事件

    autocomplete.after('select', function(e) {
        
        //Node
        //defaultFn已执行
        console.log(S.one('ac-selected'));
    });
    
    autocomplete.select(item);
    
这个功能有点类似Attribute的beforeAttrChange和afterAttrChange，在set(attr, value)之前执行beforeAttrChange，defaultFn中真正设置value，之后触发afterAttrChange
当然，SuperBase中对此也进行了兼容，API更加简洁直接，例如
    
    //before等同于on
    autocomplete.on('selectedItemChange', fn) == autocomplete.on('beforeSelectedItemChange', fn)
    autocomplete.before('selectedItemChange', fn) == autocomplete.on('beforeSelectedItemChange', fn)
    autocomplete.after('selectedItemChange', fn) == autocomplete.on('afterSelectedItemChange', fn)
    
另外，after事件也可以冒泡的哦

    autocomplete.addTarget(parent);
    
    parent.after('select', function() {
        console.log('autocomplete select');
    });
    
    //autocomplete select
    autocomplete.select(item);
    
事件触发的过程中，可能会冒泡，可能会调用e.preventDefault()和e.stopImmediatePropagation()的方法来阻止默认行为和立即阻止传播，SuperBase中的after也可以正确处理，整个事件的触发流程为

1. on
2. 如果调用了e.preventDefault，则defaultFn与after回调不执行
3. 如果调用了e.stopPropagation，则停止冒泡至父组件，defaultFn和after正常执行
4. 如果调用了e.stopImmediatePropagation，则defaultFn执行，after回调不执行
5. defaultFn
6. after
    
## doBefore & doAfter - AOP

为了完善组件的扩充机制，SuperBase扩充了AOP的功能，提供了doBefore和doAfter的方法，扩展可以无缝的往组件方法注入代码，而不需要修改组件API
    
    S.augment(AutoCompleteSource, {
        initializer: function() {
            //在render方法执行之前执行_renderACSource
            this.doBefore(this._renderACSource, this, 'render');
        },
        _renderACSource: function() {
            console.log('before render');
        }
    });
    
    S.augment(AutoCompleteList, {
        initializer: function() {
            //在render方法执行之后执行_renderACList
            this.doAfter(this._renderACList, this, 'render');
        },
        _renderACList: function() {
            console.log('after render');
        }
    });
    
    var AutoComplete = SuperBase.extend([AutoCompleteSource, AutoCompleteList], {
        render: function() {
            console.log('render');
            return this;
        }
    }, {});
    
    //初始化
    var autocomplete = new AutoComplete({});
    
    //before render
    //render
    //after render
    autocomplete.render();

## 常用方法

### doBefore _(fn, obj, sFn, context)_

注入before回调，参见[http://kg.kissyui.com/aop/1.1/guide/index.html](kg/aop)

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

## 生命周期例子

    KISSY.use('kg/superbase/2.0.0/', function(S, SuperBase) {
        
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
