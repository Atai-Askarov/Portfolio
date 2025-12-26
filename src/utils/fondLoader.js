// fontLoader.js
import opentype from 'opentype.js';

let fontInstance = null;
export function loadFont(url) {
  return new Promise((resolve, reject) => {
    if (fontInstance) return resolve(fontInstance);
    
    opentype.load(url, (err, font) => {

      
      if (err) reject(err);
      else {
        fontInstance = font;
        resolve(fontInstance);
      }
    });
  });
}