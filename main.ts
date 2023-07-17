import { SingleInstance } from "./instance"
import express from 'express'

console.log('Starting app');

const app = new SingleInstance('my-app');
const ex = express()

ex.get('/', (req, res) => {
  res.send('Hello World!')
});

(async () => {
  const gotTheLock = await app.requestSingleInstanceLock({
    foo: 'bar'
  })

  if (!gotTheLock) {
    process.exit(1);
  } else {
    const port = process.argv[2] || 3000;

    ex.listen(port, () => {
      console.log(`Example app listening on port ${port}!`)
    })

    app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
      console.log('second-instance');
      console.log({ event, commandLine, workingDirectory, additionalData });
    });

    app.on('error', (error) => {
      console.log('error');
    });
  }
})()
