(function (window) {
    var info = "Bury The Light"
    function up() {
        console.log("up " + info.toUpperCase())
    }
    function low() {
        console.log("low " + info.toLowerCase())
    }
    window.module = {
        up:up,
        low:low
    }//将闭包暴露的对象添加为window的方法
})(window)