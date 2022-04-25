function myModule() {
    var info = "Bury The Light"
    function up() {
        console.log("up " + info.toUpperCase())
    }
    function low() {
        console.log("low " + info.toLowerCase())
    }
    return {
        up:up,
        low:low
    }
}