/* Tiny compatibility guard for the one empty-link segment. */
(function(){
  if(typeof String.prototype.map!=='function'){
    Object.defineProperty(String.prototype,'map',{configurable:true,value:function(){return String(this)===''?[]:[]}});
  }
})();
