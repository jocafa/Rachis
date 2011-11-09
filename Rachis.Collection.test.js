define(['Support/Nonsense', 'Rachis'], function (Nonsense, Rachis) {
  var
    Model = Rachis.Model,
    Collection = Rachis.Collection;

  console.log(Nonsense);

  describe('Collection', function () {
  });


  function Thing () {
    Model.call(this, arguments);
  }

  Thing.prototype = Object.create(Model.prototype, {
    constructor: {value: Thing}
  });

  Model.defineField(Thing, 'foo');

  function Things () {
    Collection.call(this, arguments);
  }

  Things.prototype = Object.create(Collection.prototype, {
    constructor: {value: Things}
  });


  var thing = new Thing();
  var things = new Things();

  var stuff = [];
  for (var i = 0; i < 10; i++) {
    stuff.push(new Thing());
  }

  things.addObserver('add', function (added) {
    console.log('add', added);
  });

  things.addObserver('remove', function (removed) {
    console.log('remove', removed);
  });

  things.addObserver('fieldChange:foo', function (ch) {
    console.log('fieldChange:foo', ch);
  });

  things.addObserver('fieldChange', function (ch) {
    console.log('fieldChange', ch);
  });

  things.add(thing);
  things.add(stuff);



  thing.foo = 'abc';

  things.remove(thing);
  things.remove(stuff.slice(4,8));
  stuff[2].foo = 'zorb';

  thing.foo = 'def';

  console.log(things);
});
