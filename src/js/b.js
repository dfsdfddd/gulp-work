define(["c"], function(c) {
	console.log('this in b');
  return {
  	d:5,
  	e:3,
    hello: function() {
      console.log("hello, b");
      c.hello3();
    },
    hello2: function(e,d){
    	return e+d;
    }
  };
});