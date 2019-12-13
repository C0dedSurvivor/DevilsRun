function getNormalVector(firstPoint, secondPoint) {
    return new Vector2(firstPoint.y - secondPoint.y, secondPoint.x - firstPoint.x);
}

function orthoProjection(vectorX, vectorY, pointX, pointY) {
    projectionValue = (vectorX * pointX + vectorY * pointY) / (vectorX * vectorX + vectorY * vectorY);
    return new Vector2(projectionValue * vectorX, projectionValue * vectorY);
}

function projectObjectToAxis(object, axis) {
    let pointList = [];
    if (object1 instanceof CollisionCircle) {
        let projectedCenter = orthoProjection(axis.x, axis.y, object.x, object.y);
        let magnitude = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        let projectedRadius = new Vector2((axis.x / magnitude) * object.radius, (axis.y / magnitude) * object.radius)
        pointList.push(new Vector2(projectedCenter.x + projectedRadius.x, projectedCenter.y + projectedRadius.y));
        pointList.push(new Vector2(projectedCenter.x - projectedRadius.x, projectedCenter.y - projectedRadius.y));
    } else {
        object.vertexList.array.forEach(element => {
            pointList.push(orthoProjection(axis.x, axis.y, element.x, element.y));
        });
    }
    return pointList;
}

function getAxes(object1, object2) {
    let axesList = [];
    if (object1 instanceof CollisionCircle && object2 instanceof CollisionCircle) {
        axesList.push(new Vector2(object2.x - object1.x, object2.y - object1.y));
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

}