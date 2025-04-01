fetch('https://dlo.cppdev.dev/img/dlo-icon-alt1.png')
  .then(response => response.blob())
  .then(blob => createImageBitmap(blob))
  .then(bitmap => {
    // Create an offscreen canvas with the same dimensions as the image
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    // Draw the image onto the canvas
    ctx.drawImage(bitmap, 0, 0);
    // Get the ImageData object from the canvas
    const imageData = ctx.getImageData(0, 0, 128, 128);
    // Set the extension icon using the ImageData object
    chrome.action.setIcon({ imageData });
  })
  .catch(error => console.error('Error loading image:', error));