import * as THREE from 'three';

export function createEarth() {
    // Earth geometry
    const geometry = new THREE.SphereGeometry(6371, 6400, 64); // Earth's radius
    const earthTexture = new THREE.TextureLoader().load('/src/assets/earth8k.jpg');
    
    // Earth material with texture, bump, and specular map
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture, // Use Earth texture
        bumpMap: new THREE.TextureLoader().load('/src/assets/8081-earthbump10k.jpg'),
        bumpScale: 0.005,
        specularMap: new THREE.TextureLoader().load('/src/assets/8081-earthspec10k.jpg'),
        specular: new THREE.Color('grey'),
    });

    const earth = new THREE.Mesh(geometry, material);
    earth.scale.set(0.08, 0.08, 0.08); // Scale for visualization

    // Create a transparent glowing sphere surrounding the Earth
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00aaff) }, // Glow color (light blue)
            glowIntensity: { value: 1.5 },  // Intensity of the glow
            radius: { value: 6371 * 1.05 }, // Slightly larger than Earth
            cameraPosition: { value: new THREE.Vector3(0, 0, 0) }, // Camera position
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vVertexWorldPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float glowIntensity;
            uniform float radius;
            uniform vec3 cameraPosition;
            varying vec3 vNormal;
            varying vec3 vVertexWorldPosition;

            void main() {
                float distanceFromEarth = length(vVertexWorldPosition);
                float alpha = smoothstep(radius - 10.0, radius + 10.0, distanceFromEarth);  // Glowing effect range
                float intensity = pow(max(0.0, dot(vNormal, normalize(cameraPosition - vVertexWorldPosition))), 2.0);
                
                // Only show glow along the axis, fading out near poles
                float axisGlow = smoothstep(-0.1, 0.1, vNormal.y); // Only show along Earth's axis (y-axis)

                gl_FragColor = vec4(glowColor * intensity * glowIntensity * axisGlow, alpha);
            }
        `,
        side: THREE.FrontSide,  // Only render the front side of the sphere
        blending: THREE.AdditiveBlending, // Additive blend for glowing effect
        transparent: true,  // Make the glow material transparent
        depthWrite: false,  // Prevent depth from being written to, so glow is visible
    });

    // Create the mesh for the glow effect (a transparent sphere around the Earth)
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(6371 * 1.05, 64, 64), glowMaterial);
    
    // Add glow effect to Earth
    earth.add(glowMesh);

    return earth;
}
