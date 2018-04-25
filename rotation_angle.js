// read machine learning book

// binary_image --> 2D array filled with binary numbers
let fs = require('fs');
let promise = require ('bluebird');
let test = [];

getAngle();

function getAngle() {
    return promise.try(() => {
        fs.readFile('./rotated.txt', 'utf-8', function(err, data) {
            if(err) console.error(err.message);
            else {
                let cells = data.split("\n");
                cells.forEach(function(item) {
                    test.push(item.split(','));
                });
                test.pop(); // remove last elem
                console.log('Angle = ' + find_correction_angle(test));
            }
        });
    });
}

function printImage(binary) {
    let strArray = "";
    for (let i = 0; i < binary.length; i++){
        strArray += `'${binary[i]}'` + '\n';
    }
    console.log(strArray)
}

function find_correction_angle (binary_image) {
    printImage(binary_image);
    let coordinates = { // coordinates data structure
        x : {
            a : 0, b: 0, c: 0, d: 0
        },
        y : {
            a : 0, b: 0, c: 0, d: 0
        }
    };

    // coordinate sweep
    sweep(binary_image, coordinates);

    console.log(JSON.stringify(coordinates));

    let diffs = [coordinates.x.b - coordinates.x.c, coordinates.y.b - coordinates.y.c];
    return (Math.atan(diffs[0]/diffs[1]) * 180 / Math.PI/2).toFixed(2); // degrees
}

// O(n^2)
function sweep(binary_image, coordinates) {
    for(let i = 0; i < binary_image.length; i++) {
        for(let j = 0; j < binary_image[0].length; j++) {
            if(binary_image[i][j] === '1') {
                coordinates.x.b = i;
                coordinates.y.b = j;
                i = binary_image.length;
                j = binary_image[0].length;
            }
        }
    }

    for(let i = binary_image.length-1; i >= 0; i--) {
        for(let j = binary_image[0].length-1; j >= 0; j--) {
            if(binary_image[i][j] === '1') {
                coordinates.x.d = i;
                coordinates.y.d = j;
                i = -1;
                j = -1;
            }
        }
    }

    for(let i = 0; i < binary_image[0].length; i++) {
        for(let j = 0; j < binary_image.length; j++) {
            if(binary_image[j][i] === '1') {
                coordinates.x.a = i;
                coordinates.y.a = j;
                i = binary_image.length;
                j = binary_image[0].length;
            }
        }
    }

    for(let i = binary_image[0].length-1; i >= 0; i--) {
        for(let j = binary_image.length-1; j >= 0; j--) {
            if(binary_image[j][i] === '1') {
                coordinates.x.c = i;
                coordinates.y.c = j;
                i = -1;
                j = -1;
            }
        }
    }
}