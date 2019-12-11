## MyPromise
Mini version promise based on promise a + specification supports asynchronous chain call.
## Support
* new MyPromise
* MyPromise.prototype.then  
* MyPromise.prototype.catch
* MyPromise.all  
* MyPromise.race
* MyPromise.resolve
* MyPromise.reject
## Usage
```js
import 'colors'
import { MyPromise } from '../lib/MyPromise'

const log = console.log

// test asynchronous chain call promsie
let p = new MyPromise((res, rej) => {
	setTimeout(() => {
		res(1)
	}, 600)
}).then(ret1 => {
	log('then1:'.green, ret1)
	return MyPromise.resolve(2)
}).then().then(ret2 => {
	log('then2:'.magenta, ret2)
})

// generate a promise array
let arr = [1, 2, 3, 4, 5].map((t, i) => {
	return new MyPromise((res, rej) => {
		setTimeout(() => {
			res(t)
		}, i * 1000)
	})
})
// test promise.all
MyPromise.all(arr).then(ret => {
	log('promise.all'.rainbow, ret)
})
// test promise.race
MyPromise.race(arr).then(ret => {
	log('promise.race'.yellow, ret)
})

// test promise.resolve
let p1 = MyPromise.resolve(2)
p1.then(ret => {
	log('promsie.resolve'.cyan, ret)
})

// test promise.reject
let p2 = MyPromise.reject(3)
p2.catch(e => {
	log('promsie.reject'.red, e)
})
```