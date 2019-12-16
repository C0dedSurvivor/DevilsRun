//Utilizes separating axis theorem collision detection. For more information, reference https://www.sevenson.com.au/actionscript/sat/

function getNormalVector(firstPoint, secondPoint) {
    return new PIXI.Point(firstPoint.y - secondPoint.y, secondPoint.x - firstPoint.x);
}

function orthoProjection(vectorX, vectorY, pointX, pointY) {
    projectionValue = (vectorX * pointX + vectorY * pointY) / (vectorX * vectorX + vectorY * vectorY);
    return new PIXI.Point(projectionValue * vectorX, projectionValue * vectorY);
}

function projectObjectToAxis(object, axis) {
    let pointList = [];
    if (object instanceof CollisionCircle) {
        let projectedCenter = orthoProjection(axis.x, axis.y, object.x, object.y);
        let magnitude = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        let projectedRadius = new PIXI.Point((axis.x / magnitude) * object.radius, (axis.y / magnitude) * object.radius)
        pointList.push(new PIXI.Point(projectedCenter.x + projectedRadius.x, projectedCenter.y + projectedRadius.y));
        pointList.push(new PIXI.Point(projectedCenter.x - projectedRadius.x, projectedCenter.y - projectedRadius.y));
    } else {
        object.vertexList.forEach(element => {
            pointList.push(orthoProjection(axis.x, axis.y, element.x, element.y));
        });
    }
    //If the axis is the y axis we need to compare by y values
    if (axis.x == 0) {
        pointList.sort((a, b) => a.y - b.y);
    }
    //Otherwise we can use x values
    else {
        pointList.sort((a, b) => a.x - b.x);
    }
    //We only care about the max and min points
    pointList.splice(1, pointList.length - 2);
    return pointList;
}

function getAxes(object1, object2) {
    let axesList = [];
    if (object1 instanceof CollisionCircle && object2 instanceof CollisionCircle) {
        axesList.push(new PIXI.Point(object2.x - object1.x, object2.y - object1.y));
    } else if (object1 instanceof CollisionPoly && object2 instanceof CollisionPoly) {
        for (let i = 0; i < object1.vertexList.length; i++) {
            axesList.push(getNormalVector(object1.vertexList[i], object1.vertexList[i + 1 != object1.vertexList.length ? i + 1 : 0]))
        }
        for (let i = 0; i < object2.vertexList.length; i++) {
            axesList.push(getNormalVector(object2.vertexList[i], object2.vertexList[i + 1 != object2.vertexList.length ? i + 1 : 0]))
        }
    } else {
        //Finds the closest vertex to the circle's center
        let closestPoint = poly.vertexList[0];
        if (object1 instanceof CollisionCircle) {
            for (let i = 0; i < object2.vertexList.length; i++) {
                if (Math.pow(closestPoint.x - object1.x, 2) + Math.pow(closestPoint.y - object1.y, 2) > Math.pow(object2.vertexList[i].x - object1.x, 2) + Math.pow(object2.vertexList[i].y - object1.y, 2)) {
                    closestPoint = object2.vertexList[i];
                }
                axesList.push(getNormalVector(object2.vertexList[i], object2.vertexList[i + 1 != object2.vertexList.length ? i + 1 : 0]))
            }
            axesList.push(closestPoint.x - object1.x, closestPoint.y - object1.y);
        } else {
            for (let i = 0; i < object1.vertexList.length; i++) {
                if (Math.pow(closestPoint.x - object2.x, 2) + Math.pow(closestPoint.y - object2.y, 2) > Math.pow(object1.vertexList[i].x - object2.x, 2) + Math.pow(object1.vertexList[i].y - object2.y, 2)) {
                    closestPoint = object1.vertexList[i];
                }
                axesList.push(getNormalVector(object1.vertexList[i], object1.vertexList[i + 1 != object1.vertexList.length ? i + 1 : 0]))
            }
            axesList.push(closestPoint.x - object2.x, closestPoint.y - object2.y);
        }
    }
    return axesList;
}

function colliding(object1, object2) {
    //For each combination of bounding shapes between the two objects
    for (let i = 0; i < object1.boundingObjects.length; i++) {
        for (let j = 0; j < object2.boundingObjects.length; j++) {
            if (testObjectSet(object1.boundingObjects[i], object2.boundingObjects[j])) {
                return true;
            }
        }
    }
    return false;
}

function testObjectSet(object1, object2) {
    let axesList = getAxes(object1, object2);
    for (let i = 0; i < axesList.length; i++) {
        //Get the min and max vertices of each projected object
        let object1ProjectedPoints = projectObjectToAxis(object1, axesList[i]);
        let object2ProjectedPoints = projectObjectToAxis(object2, axesList[i]);
        if (axesList[i].x == 0) {
            if (!intersection(object1ProjectedPoints[0].y, object1ProjectedPoints[1].y, object2ProjectedPoints[0].y, object2ProjectedPoints[1].y)) {
                return false;
            }
        } else {
            if (!intersection(object1ProjectedPoints[0].x, object1ProjectedPoints[1].x, object2ProjectedPoints[0].x, object2ProjectedPoints[1].x)) {
                return false;
            }
        }
    }
    return true;
}