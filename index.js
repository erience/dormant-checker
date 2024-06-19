const { fork } = require('child_process');
const path = require('path');

const child = fork(path.join(__dirname, 'generator.js'));

let matchCount = 0;

child.on('message', (message) => {
  if (message.address) {
    if (message.matched) {
      matchCount++;
      console.log(`Match found: ${message.address}`);
      process.exit();  // Exit process if a match is found
    }
  } else if (message.count !== undefined) {
    console.clear();
    console.log(`Total addresses generated in one minute: ${message.count}`);
    console.log(`Total matches found: ${matchCount}`);
    // Keep running without exiting
  }
});

child.send('start');
