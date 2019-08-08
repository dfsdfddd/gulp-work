define(function() {
  console.log('this in c')

  // 此处的b是undefind
  // b依赖了c，c依赖了b的话，此处依赖的b不能这么依赖
  return {

    hello3: function() {
      console.log(require('./b').hello2(require('./b').d,require('./b').e));
    }
  };
});