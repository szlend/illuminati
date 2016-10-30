var express = require('express'),
    request = require('request'),
    child   = require('child_process'),
    crypto  = require('crypto'),
    fs      = require('fs'),
    cv      = require('opencv');

/*
 * Return a list of all detected triangles from the image
 */
var findTriangles = function(img) {
  var tmp = img.copy();
  tmp.convertGrayscale();
  tmp.gaussianBlur([7, 7])
  tmp.canny(10, 100);
  tmp.dilate(1);

  var contours = tmp.findContours();
  var triangles = [];

  for (var i = 0; i < contours.size(); i++) {
    if (contours.area(i) < 200) continue;

    var arcLength = contours.arcLength(i, true);
    contours.approxPolyDP(i, 0.06 * arcLength, true);

    if (contours.cornerCount(i) == 3) {
      triangles.push([
        contours.point(i, 0),
        contours.point(i, 1),
        contours.point(i, 2)
      ]);
    }
  }

  return triangles;
};

/*
 * Draw a shape on the image
 */
var drawShape = function(img, points, color, thickness) {
  if (points.length > 2) {
    points.push(points[0]);
  }

  for (var i = 0; i < points.length - 1; i++) {
    img.line([points[i].x, points[i].y], [points[i + 1].x, points[i + 1].y], color, thickness);
  }
};

/*
 * Draw a all triangles on the image
 */
var drawTriangles = function(img, triangles, color, thickness) {
  triangles.forEach(function(points) {
    drawShape(img, points, color, thickness);
  });
};

/*
 * Draw a random triangle on the image
 */
var drawRandomTriangle = function(img, triangles, color, thickness) {
  var rand = triangles[Math.floor(Math.random() * triangles.length)];
  if (rand) {
    drawShape(img, rand, color, thickness);
  }
};

/*
 * Hash the url with SHA1
 */
var hashUrl = function(url) {
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex');
};

/*
 * Fetch the image from the local cache
 */
var fetchCachedImage = function(path, options) {
  options = options || {}

  fs.readFile(path, function(err, data) {
    if (err === null) {
      if (typeof(options.success) === 'function') options.success(data);
    } else {
      if (typeof(options.error) === 'function') options.error(err);
    }
  });
};

/*
 * Fetch, draw and cache the image from the url
 */
var fetchImage = function(url, path, options) {
  options = options || {}

  var sharp = require('sharp');
  var convert = sharp()
    .resize(1080, 1080)
    .max()
    .withoutEnlargement()
    .toFormat('jpeg')

  var draw = new cv.ImageDataStream();
  draw.on('load', function(img) {
    var triangles = findTriangles(img);
    if (options.random) {
      drawRandomTriangle(img, triangles, [0, 0, 255], 2);
    } else {
      drawTriangles(img, triangles, [0, 0, 255], 2);
    }

    img.save(path);
    fetchCachedImage(path, options);
  });

  request(url, function(err, r) {
    if (err == null && r.statusCode == 200) {
      request(url).pipe(convert).pipe(draw);
    } else {
      if (typeof(options.error) === 'function') options.error(err);
    }
  });
}

/*
 * Main action
 */
var illuminati = function(options, req, res) {
  var tmp = 'tmp/'
  var url = req.query.src || '';
  var path = tmp + (options.random ? 'rand_' : '') + hashUrl(url) + '.jpg';

  var success = function(data) {
    res.writeHead(200, {'Content-Type': 'image/jpg'});
    res.end(data, 'binary');

    // cleanup cache poorly
    if (options.random) fs.unlink(path);
    child.exec('find "' + tmp + '" -maxdepth 1 -mmin +5 -type f -delete');
  };

  var error = function(err) {
    res.status(400).send('Fail.');
  };

  fs.readFile(path, function(err, data) {
    // omg race conditions everywhere
    if (err === null && options.random === false) {
      fetchCachedImage(path, {success: success, error: error});
    } else {
      fetchImage(url, path, {random: options.random, success: success, error: error});
    }
  });
};

var app = express();
app.get('/', illuminati.bind(null, {random: false}));
app.get('/all', illuminati.bind(null, {random: false}));
app.get('/random', illuminati.bind(null, {random: true}));
app.listen(process.argv[2] || 3000);
