export function toCartesian(lat, lon, altitude) {
    const EARTH_RADIUS = 6371; // Earth's radius in kilometers
    const r = EARTH_RADIUS + altitude; // Total radius
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return {
        x: r * Math.sin(phi) * Math.cos(theta) * 0.01,
        y: r * Math.cos(phi) * 0.01,
        z: r * Math.sin(phi) * Math.sin(theta) * 0.01,
    };
}
