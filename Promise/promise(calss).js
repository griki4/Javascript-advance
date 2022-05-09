class Promise{
    constructor(excutor) {
        this.PromiseState = 'pending'
        this.PromiseResult = null
        this.callback = []//存储等待执行的回调函数
        const self = this
        //resolve函数的作用，修改状态并且传递值
        function resolve(data) {
            //Promise的状态只能更改一次
            if (self.PromiseState !== 'pending') {
                return
            }
            self.PromiseState = 'fulfilled'
            self.PromiseResult = data
            setTimeout(() => {
                self.callback.forEach(item => {
                    item.onResolved(self.PromiseResult)
                })
            })
        }

        function reject(data) {
            if (self.PromiseState !== 'pending') {
                return
            }
            self.PromiseState = 'rejected'
            self.PromiseResult = data
            setTimeout(() => {
                self.callback.forEach(item => {
                    item.onRejected(self.PromiseResult)
                })
            })
        }
        //同步执行执行器函数
        //考虑出现异常的情况
        try{
            excutor(resolve, reject)
        }catch (error){
            reject(error)
        }
    }

    //添加then方法，接收两个回调函数作为参数，返回一个新的Promise
    //then方法会根据调用该方法的Promise对象的状态调用不同的回调函数
    then(onResolved, onRejected) {
        const self = this

        //异常穿透
        if (typeof onRejected !== 'function') {
            onRejected = reason => {
                throw reason
            }
        }

        //值传递
        if (typeof onResolved !== 'function') {
            onRejected = value => value
        }

        return new Promise((resolve, reject) => {
        function callback(type) {
            try {
                let result = type(self.PromiseResult)
                if (result instanceof Promise) {
                    //then方法的特点，根据Promise的状态调用不同的回调函数
                    result.then(v => {
                            resolve(v)
                        },
                        r => {
                            reject(r)
                        })
                }else {
                    resolve(result)
                }
            }catch (error) {
                reject(error)
            }
        }
            if (this.PromiseState === 'fulfilled') {
                //根据回调函数的执行结果，决定新返回的Promise的状态
                setTimeout(() => {
                    callback(onResolved)
                })
                //可以封装称为一段函数，供所有的then方法中的分支使用
            }

            if (this.PromiseState === 'rejected') {
                setTimeout(() => {
                    callback(onRejected)
                })
            }

            //异步任务，需要保存当前的回调函数
            if (this.PromiseState === 'pending') {
                this.callback.push({
                    onResolved:function () {
                        callback(onResolved)
                    },
                    onRejected:function () {
                        callback(onRejected)
                    }
                })
            }
        })
    }

    //添加catch方法
    //返回一个新的promise，只有在promise失败时才会调用
    //异常穿透问题和值传递问题，修改then方法
    catch(onRejected) {
        return this.then(undefined, onRejected)
    }

    //resolve方法属于函数对象方法，应当是静态类成员
    //根据参数的数据类型决定返回的Promise的状态
    static resolve(value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(v => {
                    resolve(v)
                },
                    r => {
                    reject(r)
                    })
            }else {
                resolve(value)
            }
        })
    }

    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }

    //all方法
    //参数为数组，所有对象都成功时成功，有一个失败则失败
    static all(promises) {
        return new Promise((resolve, reject) => {
            let count = 0
            let array = []
            for (let i =0; i < promises.length;i++) {
                promises[i].then(v => {
                        //成功则计数并且将值传入数组对应位置
                        count++
                        array[i] = v
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

    static race(promises) {
        return new Promise((resolve, reject) => {
            for (let i =0; i < promises.length;i++) {
                promises[i].then(v => {
                    resolve(v)
                },r => {
                    reject(r)
                })
            }
        })
    }
}

//then方法中回调函数都是异步调用的，需要使用定时器来模拟一下