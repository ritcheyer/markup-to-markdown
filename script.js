import { exec } from 'child_process';
import fs from 'node:fs';
import * as data from './data/data.js'

async function sh(cmd, pageData) {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }

      // so hacky
      const markdownFile = stdout.match(/([\/a-zA-Z-]*.md)/);
      generateMarkdownFile(markdownFile[0].replace('m/Users', '/Users'), pageData);
    });
  });
}

/**
 * Generate the date for the frontmatter for a markdown file
 * @param {Array} pageDate If present, the first item in the array contains the date of the generated markdown file
 * @returns A date string in the format YYYY-MM-DD
 */
function generateDate(pageDate) {
  let fileDate = ''

  if (pageDate) {
    fileDate = pageDate[0];
  } else {
    const date = new Date()
    let dateParts = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    fileDate = dateParts;
  }

  // Rearrange the date parts to match the syntax we want
  fileDate = fileDate.split('/')
  fileDate = `${fileDate[2]}-${fileDate[0]}-${fileDate[1]}`;

  return fileDate;
}
/**
 * Generate the frontmatter for a markdown file
 * @param {String} fileData The entire markdown file data
 * @param {String} pageUrl The relative URL of the page
 * @returns A frontmatter string to be used in constructing the new markdown file.
 */
function buildFrontMatter(fileData, pageUrl) {
  const REGEX_TITLE = /#\s([\w\s-()]*)/g;              // Should match: "# Our Principles"
  const REGEX_DATE = /(\d{1,2}\/\d{1,2}\/\d{4})/g;  // Should match: "01/01/2022"

  // Sanitize the page title
  const title = (fileData.match(REGEX_TITLE)[1]).replace('# ', '').replace(/[\r\n]/g, '') || 'NO TITLE FOUND'

  // Generate the correct date
  const pageDate = generateDate(fileData.match(REGEX_DATE));

  // Construct the frontmatter
  const frontMatterData = `---
title: ${title}
date: ${pageDate}
page_url: ${pageUrl}
published: true
---\n`;
  return frontMatterData
}

/**
 * Generate a new markdown file with the frontmatter and the contents of the original file.
 * @param {String} fileName The name of the file to find in the /dist/ directory
 * @param {Array} pageData The contents of the file found and the pageUrl
 * @returns A newly constructed markdown file with the frontmatter and the contents of the original file.
 */
function generateMarkdownFile(fileName, pageData) {
  return fs.readFile(fileName, { encoding: "utf8" }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      const pageUrl = pageData[0].replace(data.baseUrl, '');
      let newFileContent = buildFrontMatter(data, pageUrl) + '\n' + data;

      // Write the file
      fs.writeFile(fileName, newFileContent, err => {
        if (err) {
          console.error(err);
        } else {
          console.log(`✅ ${pageData[1]} => ${fileName}\n`);
        }
      });

    }
  });
}

/**
 * Build the directory structure for the /dist/ directory
 * @param {String} page The URL of the page
 * @returns A hierarchy of directories to be created in the /dist/ directory
 */
function buildDistDir(page) {
  let path = page.split(data.baseUrl).pop();
  let tree = path.split('/');
  let lastItem = tree.pop();

  let hierarchy = '';
  for (let item of tree) {
    if (item) {
      hierarchy += `/${item}`
    }
  }
  return `${hierarchy}`;
}

function main() {
  // cleanup first
  const dir = 'dist';
  fs.rm(dir, { recursive: true, force: true }, err => {
    if (err) throw err;
    console.log(`--------\n${dir} is deleted!\n--------\n`);
  });

  // create markdown files from the urls provided
  for (let page of data.allPages) {
    const localFile = buildDistDir(page);
    sh(`npx @wcj/html-to-markdown-cli -o="dist${localFile}" ${page}`, [page, localFile]);
  }
}

main();
