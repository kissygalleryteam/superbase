KISSY.add(function (S, Node,Demo) {
    var $ = Node.all;
    describe('superbase', function () {
        it('Instantiation of components',function(){
            var demo = new Demo();
            expect(S.isObject(demo)).toBe(true);
        })
    });

},{requires:['node','gallery/superbase/1.0/']});