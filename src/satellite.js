import * as THREE from 'three';

// Create a sound element for the ripple effect
const rippleAudio = new Audio('/src/assets/sound.wav'); // Replace with the correct path to your ripple sound
rippleAudio.loop = false; // Do not loop automatically, we trigger playback for each ripple
rippleAudio.volume = 0.5; // Adjust the volume as needed

// Create satellites with interaction meshes
export function createSatellites() {
    const satelliteData = [];
    for (let i = 0; i < 4500; i++) {
        satelliteData.push({
            inclination: Math.random() * 180 - 90, // Angle relative to the equator
            altitude: Math.random() * 400 + 50, // Altitude in arbitrary units
            speed: Math.random() * 0.0001 + 0.0002, // Speed of rotation
            startingAngle: Math.random() * Math.PI * 2, // Initial orbital position
            ascendingNode: Math.random() * Math.PI * 2, // Longitude of ascending node
        });
    }

    const earthScale = 0.08;
    const scaledRadius = 6371 * earthScale;

    return satelliteData.map(data => {
        const geometry = new THREE.SphereGeometry(1.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const satellite = new THREE.Mesh(geometry, material);

        satellite.userData = {
            inclination: data.inclination,
            altitude: data.altitude * earthScale,
            speed: data.speed,
            angle: data.startingAngle,
            ascendingNode: data.ascendingNode,
        };

        // Create an invisible interaction mesh (larger sphere)
        const interactionGeometry = new THREE.SphereGeometry(5, 16, 16);
        const interactionMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible
        const interactionMesh = new THREE.Mesh(interactionGeometry, interactionMaterial);

        // Group satellite and interaction mesh together
        const group = new THREE.Group();
        group.add(satellite); // Add the visible satellite
        group.add(interactionMesh); // Add the invisible interaction mesh

        // Position both at the correct initial position
        const { x, y, z } = toCartesian(
            data.inclination,
            data.startingAngle,
            data.ascendingNode,
            scaledRadius + data.altitude * earthScale
        );
        group.position.set(x, y, z);

        group.userData = satellite.userData; // Copy satellite data to the group

        return group;
    });
}


// Update satellite positions
export function updateSatellites(satellites) {
    satellites.forEach(group => {
        const { inclination, altitude, speed, ascendingNode } = group.userData;
        group.userData.angle += speed; // Update angle for rotation
        group.userData.angle %= Math.PI * 2;

        const radius = 6371 * 0.08 + altitude;
        const { x, y, z } = toCartesian(inclination, group.userData.angle, ascendingNode, radius);
        group.position.set(x, y, z);
    });
}

// ... (Rest of the satellite.js code remains unchanged as per your provided code)

// Create orbit geometry dynamically
// Helper functions like `toCartesian`, `handleSatelliteHover`, etc., remain intact.


// Handle hover and click for satellite selection and orbit display
export function handleSatelliteHover(
    raycaster,
    satelliteGroups,
    orbitLine,
    earthRadius,
    selectedSatellite
) {
    const intersects = raycaster.intersectObjects(
        satelliteGroups.map(group => group.children[1]) // Test only interaction meshes
    );

    // If a satellite is selected, keep showing its orbit
    if (selectedSatellite.current) {
        const hoveredGroup = selectedSatellite.current;
        const { inclination, altitude, ascendingNode } = hoveredGroup.userData;

        // Update the orbit line geometry for the selected satellite
        const orbitGeometry = createOrbitGeometry(
            earthRadius + altitude,
            inclination,
            ascendingNode
        );
        orbitLine.geometry.dispose(); // Clean up old geometry
        orbitLine.geometry = orbitGeometry;

        orbitLine.visible = true;
    } else {
        orbitLine.visible = false; // Hide orbit line by default
    }

    if (intersects.length > 0) {
        const hoveredGroup = intersects[0].object.parent;

        // Highlight orbit line if hovering over a satellite and no satellite is selected
        if (!selectedSatellite.current) {
            const { inclination, altitude, ascendingNode } = hoveredGroup.userData;

            const orbitGeometry = createOrbitGeometry(
                earthRadius + altitude,
                inclination,
                ascendingNode
            );
            orbitLine.geometry.dispose(); // Clean up old geometry
            orbitLine.geometry = orbitGeometry;

            orbitLine.visible = true;
        }
    }
}

// Handle satellite click to select/deselect a satellite

export function handleSatelliteClick(raycaster, satelliteGroups, selectedSatellite) {
    const intersects = raycaster.intersectObjects(
        satelliteGroups.map(group => group.children[1]) // Test only interaction meshes
    );

    if (intersects.length > 0) {
        // Select the clicked satellite
        const clickedGroup = intersects[0].object.parent;
        selectedSatellite.current = clickedGroup;
    } else {
        // Deselect if clicked elsewhere
        selectedSatellite.current = null;
    }
}


// Create orbit geometry dynamically
function createOrbitGeometry(radius, inclination, ascendingNode) {
    const points = [];
    for (let angle = 0; angle <= 360; angle += 1) {
        const radians = THREE.MathUtils.degToRad(angle);
        const { x, y, z } = toCartesian(inclination, radians, ascendingNode, radius);
        points.push(new THREE.Vector3(x, y, z));
    }
    const orbitCurve = new THREE.BufferGeometry().setFromPoints(points);
    return orbitCurve;
}

// Convert orbital parameters to Cartesian coordinates
function toCartesian(inclination, angle, ascendingNode, radius) {
    const phi = (90 - inclination) * (Math.PI / 180);
    const theta = angle;
    const omega = ascendingNode;

    const x = radius * (Math.cos(omega) * Math.cos(theta) - Math.sin(omega) * Math.sin(theta) * Math.cos(phi));
    const y = radius * (Math.sin(omega) * Math.cos(theta) + Math.cos(omega) * Math.sin(theta) * Math.cos(phi));
    const z = radius * (Math.sin(phi) * Math.sin(theta));

    return { x, y, z };
}

// Create a tracking animation object (red pulsating ring)
export function createTrackingEffect() {
    const ringGeometry = new THREE.RingGeometry(0.1, 0.6, 32); // Slightly larger than the satellite
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        opacity: 0.8,
        transparent: true,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Orient the ring horizontally
    ring.visible = false; // Hidden initially
    return ring;
}

// Update the tracking effect to follow the selected satellite
export function updateTrackingEffect(trackingEffect, selectedSatellite) {
    if (selectedSatellite && selectedSatellite.position) {
        trackingEffect.visible = true; // Make the ring visible
        trackingEffect.position.copy(selectedSatellite.position); // Move the ring to the satellite's position
        trackingEffect.scale.x = trackingEffect.scale.y = 
            1 + Math.sin(Date.now() * 0.005) * 0.3; // Pulsating effect
    } else {
        trackingEffect.visible = false; // Hide the ring if no satellite is selected
    }
}

// Create the ripple effect
// Create the ripple effect
export function createRippleEffect() {
    const rippleGroup = new THREE.Group();

    // Create a set of ripples
    for (let i = 0; i < 1; i++) {
        const geometry = new THREE.RingGeometry(24, 26, 22); // A thin ring that looks like a ripple
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Aqua blue for the ripple
            transparent: true,
            opacity: 0.8,
        });
        const ripple = new THREE.Mesh(geometry, material);
        ripple.visible = false; // Initially hidden
        ripple.userData = { scale: 1, opacity: 0.2, delay: i * 0.3 }; // No soundPlayed flag needed anymore

        rippleGroup.add(ripple);
    }

    rippleGroup.visible = false; // Hidden until assigned to a satellite
    return rippleGroup;
}

// Update the ripple effect
// Update the ripple effect
export function updateRippleEffect(rippleGroup, target, camera) {
    if (target) {
        rippleGroup.visible = true;

        // Attach ripple group to the satellite's position
        rippleGroup.position.copy(target.position);

        // Loop over each ripple and update it
        rippleGroup.children.forEach((ripple, index) => {
            ripple.lookAt(camera.position); // Make the ripple face the camera

            const elapsedTime = (Date.now() * 0.001 - ripple.userData.delay) % 2; // Loop animation every 2 seconds

            if (elapsedTime >= 0) {
                ripple.visible = true;
                ripple.userData.scale = elapsedTime; // Scale increases over time
                ripple.userData.opacity = Math.max(0, 0.5 - elapsedTime * 0.25); // Fade out over time

                ripple.scale.set(ripple.userData.scale, ripple.userData.scale, 1);
                ripple.material.opacity = ripple.userData.opacity;

                // Play sound only if it's the first time during the ripple animation
                if (elapsedTime < 0.1 && !ripple.isSoundPlaying) {
                    rippleAudio.currentTime = 0; // Reset sound playback
                    rippleAudio.play(); // Play the sound
                    ripple.isSoundPlaying = true; // Mark that sound has started playing for this ripple
                }
            } else {
                ripple.visible = false;
            }
            
            // Reset sound status after the ripple stops (after its animation is complete)
            if (elapsedTime < 0.1 && ripple.isSoundPlaying) {
                ripple.isSoundPlaying = false; // Stop playing sound after animation ends
            }
        });
    } else {
        rippleGroup.visible = false; // Hide if no target is selected
    }
}


