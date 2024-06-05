import { exec } from 'child_process';

const baseUrl = `https://www.joshwcomeau.com`;

const allPages = [
  `${baseUrl}/css/center-a-div`,
  `${baseUrl}/css/interactive-guide-to-grid`,
  `${baseUrl}/css/color-formats`,
  `${baseUrl}/css/interactive-guide-to-flexbox`,
];

async function sh(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function createFilePath(page) {
  let path = page.split(baseUrl).pop();
  let tree = path.split('/');
  let lastItem = tree.pop();

  let hierarchy = '';
  for (let item of tree) {
    if (item) {
      hierarchy += `/${item}`
    }
  }
  return `dist${hierarchy}`;
}

async function main() {
  for (let page of allPages) {
    await sh(`npx @wcj/html-to-markdown-cli -o="${createFilePath(page)}" ${page}`);
  }
}

main();