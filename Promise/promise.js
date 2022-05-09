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
        setTimeout(() => {
            self.callback.forEach(item => {
                item.onResolved(data)
            })
        })
    }
    //reject函数
    function reject(data) {
        if (self.PromiseState !== "pending") {
            return
        }
        self.PromiseState = "rejected"
        self.PromiseResult = data
        setTimeout(() => {
            self.callback.forEach(item => {
                item.onRejected(data)
            })
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
//then方法中的回调函数都是异步执行的
Promise.prototype.then = function (onResolved, onRejected) {
    const self = this
    //实现异常穿透
    if (typeof onRejected !== 'function') {
        onRejected = reason => {
            throw reason
        }
    }
    //值传递
    if (typeof onResolved !== 'function') {
        onResolved = value => value
    }
    return new Promise((resolve, reject) => {
        //根据Promise对象的状态判断执行哪一个回调函数
        //由于调用then方法的是Promise对象，所以直接使用this即可
        //三个状态下的重复性代码可以单独拿出来封装成一个函数
        function callback(type) {
            try{
                let result = type(self.PromiseResult)
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
            }catch (error) {
                reject(error)
            }
        }

        if(this.PromiseState === "fulfilled") {
            setTimeout(() => {
                callback(onResolved)
            })
        }
        if(this.PromiseState === "rejected") {
            setTimeout(() => {
                callback(onResolved)
            })
        }

        /*考虑异步任务，调用then方法的时候，Promise对象的状态还未改变
        * 此时需要保存onResolved onRejected这两个回调函数
        * 存在调用了多个then方法的情况，所以每调用一次then就要保存回调函数，且之前保存的不能删除
        * Promise中包含异步任务时，*/
        if (this.PromiseState === "pending") {
            this.callback.push({
                //异步任务中也需要调用resolve和reject方法，时间为异步任务完成的时候
                onResolved: function () {
                    callback(onResolved)
                },
                onRejected: function () {
                    callback(onRejected)
                }
            })
        }
    })
}

//catch方法接收一个回调函数作为参数，返回一个Promise对象
//调用catch时说明调用该方法的Promise对象失败了
//Promise的异常穿透功能，相当于给then方法默认传递一个onRejected
Promise.prototype.catch = function (onRejected) {
    //then方法可以根据Promise对象的状态调用不同的回调函数，只要不定义成功的回调即可实现catch
    //this指向调用catch方法的回调函数
    return this.then(undefined, onRejected)
}

//resolve方法接收一个参数
//根据参数的类型返回一个新的Promise对象
//resolve方法属于Promise函数对象
Promise.resolve = function (value) {
    return new Promise((resolve,reject) => {
        if (value instanceof Promise) {
            value.then(v => {
                resolve(v)
            },r => {
                reject(r)
            })
        }else {
            resolve(value)
        }
    })
}

//reject方法返回一个失败的Promise
Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
        reject(reason)
    })
}

//all方法接收一个数组作为参数,返回一个新的Promise对象
//数组中所有的Promise对象成功时，all才成功；有一个失败。则all失败
Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
        let count = 0//标志，当count的值和数组长度一致时，成功
        let array = []//空数组，存储成功时的值
        //遍历数组
        for (let i = 0;i < promises.length;i++) {
            //then方法查看每个对象的状态
            promises[i].then(v => {
                count++
                array[i] = v//防止顺序错误
                if (count === promises.length) {
                    resolve(array)
                }
            },
                r => {
                    reject(r)
                })
        }
    })
}

//race方法和all方法的使用类似，返回一个Promise
//新的Promise状态由数组中最先改变状态的promise决定
Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
        for (let i = 0;i < promises.length; i++) {
            //最先完成状态改变的Promise，直接遍历即可
            promises[i].then(v => {
                resolve(v)
            },
                r => {
                reject(r)
                })
        }
    })
}
