const PENDING = 'pending' // 初始状态
const FULFILLED = 'fulfilled' // 成功完成状态
const REJECTED = 'rejected' // 失败状态
export class MyPromise {
    constructor(fn) {
        this.__state = PENDING; // 状态
        this.__value = undefined; // 值
        this.__queue = []; // 事件队列，为啥要用事件队列？因为.then是个微任务，需要事件队列处理
        fn && fn(this.resolve.bind(this), this.reject.bind(this));
    }
    resolve(value) {
        if (this.__state == PENDING) {
            setTimeout(() => {
                this.__state = FULFILLED;
                this.__value = value;
                // 遍历这个队列，执行所有的resolve方法
                this.__queue.map(callback => {
                    callback.resolve(value);
                });
            })
        }
    }
    reject(value) {
        if (this.__state == PENDING) {
            setTimeout(() => {
                this.__state = REJECTED;
                this.__value = value;
                // 遍历这个队列，执行所有的reject方法
                this.__queue.map(callback => {
                    callback.reject(value);
                });
            })
        }
    }
}
// 实现异步链式调用then方法
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    // 因为每次then函数都要返回新的promise，用bridgePromise来保存新的返回对象
    let self = this,
        bridgePromise;
    //防止使用者不传成功或失败回调函数，所以成功失败回调都给了默认回调函数
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
    onRejected = typeof onRejected === "function" ? onRejected : error => {
        throw error
    };

    // 如果已经完成或失败，则直接执行
    if (this.__state == FULFILLED) {
        return bridgePromise = new MyPromise((reslove, reject) => {
            setTimeout(() => {
                try {
                    let x = onFulfilled(self.__value);
                    // 这里传入bridgePromise是为了防止循环引用，即bridgePromise不能是x自己
                    resolvePromise(bridgePromise, x, reslove, reject);
                } catch (e) {
                    reject(e);
                }
            })
        });
    } else if (this.__state == REJECTED) {
        return bridgePromise = new MyPromise((reslove, reject) => {
            setTimeout(() => {
                try {
                    let x = onRejected(self.__value);
                    // 这里传入bridgePromise是为了防止循环引用，即bridgePromise不能是x自己
                    resolvePromise(bridgePromise, x, reslove, reject);
                } catch (e) {
                    reject(e);
                }
            })
        });
    } else {
        return bridgePromise = new MyPromise((reslove, reject) => {
            // 如果还是初始状态，则添加到队列里面
            self.__queue.push({
                resolve: (value) => {
                    try {
                        let x = onFulfilled(value);
                        // 这里传入bridgePromise是为了防止循环引用，即bridgePromise不能是x自己
                        resolvePromise(bridgePromise, x, reslove, reject);
                    } catch (e) {
                        reject(e);
                    }
                },
                reject: (value) => {
                    try {
                        let x = onRejected(value);
                        // 这里传入bridgePromise是为了防止循环引用，即bridgePromise不能是x自己
                        resolvePromise(bridgePromise, x, reslove, reject);
                    } catch (e) {
                        reject(e);
                    }
                }
            })
        });
    }
}
// 实现catch方法
MyPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected)
}
// resolvePromise方法  (Promise A+规范)
function resolvePromise(bridgepromise, x, resolve, reject) {
    //2.3.1规范，避免循环引用
    if (bridgepromise === x) {
        return reject(new TypeError('Circular reference'));
    }
    let called = false;
    //这个判断分支其实已经可以删除，用下面那个分支代替，因为promise也是一个thenable对象
    if (x instanceof MyPromise) {
        if (x.__state === PENDING) {
            // 因为这个时候没法判断x的最终结果，所以当x被reslove的时候，就需要再次进行resolvePromise
            x.then(y => {
                resolvePromise(bridgepromise, y, resolve, reject);
            }, error => {
                reject(error);
            });
        } else {
            // 这个时候已经知道x的结果了，所以就直接传resolve, reject就好了
            x.then(resolve, reject);
        }
        // 2.3.3规范，如果 x 为对象或者函数
    } else if (x != null && ((typeof x === 'object') || (typeof x === 'function'))) {
        try {
            // 是否是thenable对象（具有then方法的对象/函数）
            //2.3.3.1 将 then 赋为 x.then
            let then = x.then;
            if (typeof then === 'function') {
                //2.3.3.3 如果 then 是一个函数，以x为this调用then函数，且第一个参数是resolvePromise，第二个参数是rejectPromise
                then.call(x, y => {
                    if (called) return;
                    called = true;
                    resolvePromise(bridgepromise, y, resolve, reject);
                }, error => {
                    if (called) return;
                    called = true;
                    reject(error);
                })
            } else {
                //2.3.3.4 如果 then不是一个函数，则 以x为值fulfill promise。
                resolve(x);
            }
        } catch (e) {
            //2.3.3.2 如果在取x.then值时抛出了异常，则以这个异常做为原因将promise拒绝。
            if (called) return;
            called = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
}
// 实现resolve方法
MyPromise.resolve = (value) => {
    return new MyPromise((res, rej) => {
        res(value);
    })
}
// 实现reject方法
MyPromise.reject = (value) => {
    return new MyPromise((res, rej) => {
        rej(value);
    })
}
// 实现all方法
MyPromise.all = (promiseArr) => {
    return new MyPromise((res, rej) => {
        let arr = []; // 保存结果
        let index = 0,
            len = promiseArr.length;
        const next = () => {
            promiseArr[index].then(ret => {
                arr.push(ret);
                if (index < len - 1) {
                    next(index++);
                } else {
                    res(arr);
                }
            });
        }
        next();
    })
}
// 实现race方法
MyPromise.race = (promiseArr) => {
    return new MyPromise((res, rej) => {
        let done = false;
        promiseArr.map(promise => {
            promise.then(ret => {
                if (!done) {
                    res(ret);
                    done = true;
                }
            }, err => {
                if (!done) {
                    rej(err)
                    done = true;
                }
            })
        })
    })
}