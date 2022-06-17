/* async pool */
type WorkConstructor = () => Promise<any>;
const concurrency = 2;
const waiting = [] as WorkConstructor[];
const executing = new Set<Promise<any>>();
/**
 * push a work into async pool
 */
function pushWork(constructor: () => Promise<any>) {
  if (executing.size < concurrency) {
    const work = constructor();
    work.finally(() => {
      executing.delete(work);
      if (waiting.length > 0) {
        const next = waiting.shift();
        next && pushWork(next);
      }
    });
    executing.add(work);
  } else {
    waiting.push(constructor);
  }
}

const asyncwork = (id: number, time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log(`${id} ${time} | ${Date.now()}`);
      resolve();
    }, time);
  });
};
pushWork(() => asyncwork(1, 1000));
pushWork(() => asyncwork(2, 1000));
pushWork(() => asyncwork(3, 1000));
pushWork(() => asyncwork(4, 1000));
pushWork(() => asyncwork(5, 1000));
pushWork(() => asyncwork(6, 1000));

export {};
