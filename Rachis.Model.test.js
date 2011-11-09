define(['Rachis'], function (Rachis) {
  var Model = Rachis.Model

  function defineThing () {
    function Thing () {
      Model.call(this, arguments);
    }

    Thing.prototype = Object.create(Model.prototype, {
      constructor: {value: Thing}
    });

    return Thing;
  }

  describe('Model', function () {

    describe('inheritance', function () {
      describe('subclass instance', function () {
        it('should have a proper prototype chain', function () {
          var Thing = defineThing();
          var t = new Thing;
          expect(t instanceof Thing).toBe(true);
          expect(t instanceof Model).toBe(true);
        });
      });
    });

    describe('field definition', function () {
      var Thing = defineThing();
      Model.defineField(Thing, 'foo');
    });

    describe('serialization', function () {
    });
  });
});
