import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from "fs";
import * as path from 'path';
import * as urlParser from 'url';

const seenUrls = {};

const getUrl = (link) => {
  if (link.includes('http')) {
    return link;
  } else if (link.startsWith('/')) {
    return `http://localhost:10000${link}`;
  } else {
    return `http://localhost:10000/${link}`;
  }
}

const crawl = async ({ url }) => {
  if (seenUrls[url]) return;
  console.log("crawling", url);
  seenUrls[url] = true;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html); // query for all of the links
  const links = $('a').map((i, link) => link.attribs.href).get();
  const imageUrls = $("img").map((i, link) => link.attribs.src).get();

  imageUrls.forEach(imageUrl => {
    fetch(getUrl(imageUrl)).then(response => {
      const filename = path.basename(imageUrl);
      const dest = fs.createWriteStream(`images/${filename}`);
      response.body.pipe(dest); // every image that we found will be overwritten as myimage
    })
  })

  const { host } = urlParser.parse(url);

  // depth-first search algorithm
  links.filter(link => link.includes(host)).forEach(link => {
    crawl({
      url: getUrl(link),
    })
  })
}

crawl({
  url: "http://stevescooking.blogspot.com/"
})