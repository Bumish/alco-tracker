'use strict';

const waitUntil = function (checkFn, limit, checkInterval = 10) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    const check = () => {
      if (checkFn()) {
        resolve();
      } else {
        limit && limit === counter++
          ? reject()
          : setTimeout(() => check(), checkInterval);
      }
    };
    check();
  });
};


let run = false;

waitUntil(()=> run === true, 100, 100).then(() => {
  console.log('1//10sec')
}).catch(e => console.warn('1//10sec/fail'));

waitUntil(()=> run === true, 20, 100).then(() => {
  console.log('2//2sec')
}).catch(e => console.warn('2//2sec/fail'));

waitUntil(()=> run === true, 500, 100).then(() => {
  console.log('3//50sec')
}).catch(e => console.warn('3//50sec/fail'));

waitUntil(()=> run === true, 10, 100).then(() => {
  console.log('4//10times')
}).catch(e => console.warn('4//10times/fail'));

waitUntil(()=> run === true, 0, 100).then(() => {
  console.log('5//no-limit')
}).catch(e => console.warn('5//no-limit/fail'));

setTimeout(()=>{
  run = true;
}, 15000);

