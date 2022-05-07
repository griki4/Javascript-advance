//创建Promise对象的时候需要接收一个函数作为参数
function Promise(excutor) {
    //Promise实例对象所具有的属性
    this.PromiseState = 'pending'
    this.PromiseResult = null
    this.callback = []//将回调函数保存在对象中
    /*使用变量保存当前的this, 因为resolve和reject都是以函数形式直接被调用的，它们的this指向window
    * 希望将它们的this指向Promise实例对象*/
    const self = this

    // Promise 的状态只能修改一次，状态凝固。所以执行resolve和reject函数之前需要判断当前promise的状态
    //resolve函数
    function resolve(data) {
        if (self.PromiseState !== "pending") {
            return
        }
       //1.改变状态
        self.PromiseState = "fulfilled"
       //2.改变值
        self.PromiseResult = data
        //3.如果状态改变且callback中存在回调函数则执行
        self.callback.forEach(item => {
            item.onResolved(data)
        })
    }
    //reject函数
    function reject(data) {
        if (self.PromiseState !== "pending") {
            return
        }
        self.PromiseState = "rejected"
        self.PromiseResult = data
        self.callback.forEach(item => {
            item.onRejected(data)
        })
    }

    //执行器函数在创建Promise对象的时候同步调用
    //执行器函数接收两个函数作为参数
    /*执行器函数还会碰见throw抛出异常的情况，所以执行时还需考虑异常捕获以及异常对Promise对象的影响*/
    try {
        excutor(resolve, reject)
    }catch (error) {
        reject(error)
    }


}


//then方法的参数是两个回调函数
//then方法返回的是一个新的Promise对象，对象的状态根据then方法中定义的回调函数的执行结果决定
Promise.prototype.then = function (onResolved, onRejected) {
    return new Promise((resolve, reject) => {
        //根据Promise对象的状态判断执行哪一个回调函数
        //由于调用then方法的是Promise对象，所以直接使用this即可
        if(this.PromiseState === "fulfilled") {
            let result = onResolved(this.PromiseResult)
            if (result instanceof Promise) {
                //若返回新的Promise对象，判断该对象的状态,并且改变返回的新Promise对象的状态
                result.then(v => {
                    resolve(v)
                },
                    r => {
                    reject(r)
                    })
            }else {
                //若返回非Promise对象的值则判定为成功
                resolve(result)
            }
        }
        if(this.PromiseState === "rejected") {
            onRejected(this.PromiseResult)
        }

        /*考虑异步任务，调用then方法的时候，Promise对象的状态还未改变
        * 此时需要保存onResolved onRejected这两个回调函数
        * 存在调用了多个then方法的情况，所以每调用一次then就要保存回调函数，且之前保存的不能删除
        * Promise中包含异步任务时，*/
        if (this.PromiseState === "pending") {
            this.callback.push({
                onResolved,
                onRejected
            })
        }
    })

}