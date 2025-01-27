import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth.js';
import {
    createSatellites,
    updateSatellites,
    handleSatelliteHover,
    handleSatelliteClick,
    createTrackingEffect,
    updateTrackingEffect,
    createRippleEffect,
    updateRippleEffect,
} from './satellite.js';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true,
    alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x000033, 1);

// Add Earth
const earth = createEarth();
scene.add(earth);

// Earth radius (scaled)
const earthRadius = 6371 * 0.08;

// Add satellites (groups with interaction meshes)
const satelliteGroups = createSatellites();
satelliteGroups.forEach((group) => scene.add(group));

// Add orbit line (single object for all satellites)
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.8, transparent: true });
const orbitGeometry = new THREE.BufferGeometry();
const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
orbitLine.visible = false;
scene.add(orbitLine);

// Add tracking effect
const trackingEffect = createTrackingEffect();
scene.add(trackingEffect);

// Add ripple effect
const rippleEffect = createRippleEffect();
scene.add(rippleEffect);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(3, 6, 2).normalize();
scene.add(directionalLight);

// Camera controls
camera.position.set(0, 0, 1000);
const controls = new OrbitControls(camera, renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Raycasting for satellite interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Store the selected satellite
const selectedSatellite = { current: null };

// Create satellite info box
const infoBox = document.createElement('div');
infoBox.style.position = 'absolute';
infoBox.style.bottom = '20px';
infoBox.style.right = '20px';
infoBox.style.padding = '10px';
infoBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
infoBox.style.color = 'white';
infoBox.style.borderRadius = '8px';
infoBox.style.fontSize = '14px';
infoBox.style.display = 'none'; // Hidden by default
infoBox.style.zIndex = '10';
document.body.appendChild(infoBox);

// Function to update satellite info box
function updateInfoBox(satellite) {
    if (satellite) {
        const { altitude, speed } = satellite.userData;
        infoBox.innerHTML = `
            <p><strong>Name:</strong> Satellite-${Math.floor(Math.random() * 10000)}</p>
            <p><strong>Altitude:</strong> ${(altitude * 100).toFixed(2)} km</p>
            <p><strong>Speed:</strong> ${(speed * 100000).toFixed(2)} m/s</p>
        `;
        infoBox.style.display = 'block';
    } else {
        infoBox.style.display = 'none';
    }
}

// Event listener for mouse move (hover)
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    handleSatelliteHover(raycaster, satelliteGroups, orbitLine, earthRadius, selectedSatellite);
});

// Event listener for mouse click
window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    handleSatelliteClick(raycaster, satelliteGroups, selectedSatellite);

    // Update the satellite info box on click
    if (selectedSatellite.current) {
        updateInfoBox(selectedSatellite.current);
    } else {
        updateInfoBox(null);
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update satellite positions
    updateSatellites(satelliteGroups);

    earth.rotation.y += 0.0001;

    // Update ripple effect for the currently selected satellite
    updateRippleEffect(rippleEffect, selectedSatellite.current, camera);

    // Update tracking effect
    updateTrackingEffect(trackingEffect, selectedSatellite.current);

    // Render the scene
    renderer.render(scene, camera);
}

animate();

