/**
 * Checks if a point is inside a polygon using the Ray Casting algorithm.
 * @param point The point to check { lat, lng }
 * @param polygon The polygon as an array of points [{ lat, lng }]
 */
export function isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: { lat: number; lng: number }[],
): boolean {
    let isInside = false;
    const { lat, lng } = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat;
        const yi = polygon[i].lng;
        const xj = polygon[j].lat;
        const yj = polygon[j].lng;

        const intersect =
            yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

        if (intersect) {
            isInside = !isInside;
        }
    }

    return isInside;
}
