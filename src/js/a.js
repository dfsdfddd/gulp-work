define(['b'], function(b) {
	console.log("this in a")
  return {
    hello: function() {
      console.log("hello, a");
      b.hello();
    }
  }
});