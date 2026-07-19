/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function MasjidDome3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const domeGroupRef = useRef<THREE.Group | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mouse coordinate targets for smooth GSAP parallax
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene & Camera Setup ---
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 12);
    cameraRef.current = camera;

    // --- 2. Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 3. Lights ---
    // Soft environmental ambient light
    const ambientLight = new THREE.AmbientLight('#041A16', 2.0);
    scene.add(ambientLight);

    // Warm Golden light from top right
    const goldLight = new THREE.DirectionalLight('#D4A53A', 3.0);
    goldLight.position.set(5, 8, 4);
    scene.add(goldLight);

    // Spiritual Green light from bottom left to add depth
    const emeraldLight = new THREE.PointLight('#10B981', 4.0, 20);
    emeraldLight.position.set(-4, -2, 3);
    scene.add(emeraldLight);

    // Core light from INSIDE the dome pointing outwards
    const innerGlowLight = new THREE.PointLight('#14B8A6', 6.0, 12);
    innerGlowLight.position.set(0, 1.5, 0);
    scene.add(innerGlowLight);

    // --- 4. Dome Geometry & Group Construction ---
    const domeGroup = new THREE.Group();
    domeGroupRef.current = domeGroup;
    scene.add(domeGroup);

    // A. Generate custom parametric curve for an Islamic Onion Dome Shape
    const points: THREE.Vector2[] = [];
    
    // Bottom base point (close cap)
    points.push(new THREE.Vector2(0.001, -0.8));
    
    // Base cylinder collar
    points.push(new THREE.Vector2(1.5, -0.8));
    points.push(new THREE.Vector2(1.5, -0.4));
    
    // Main dome curve profiles
    const segmentsCount = 45;
    for (let i = 0; i <= segmentsCount; i++) {
      const t = i / segmentsCount;
      const y = -0.4 + t * 3.4; // Dome body height span: 3.4 units
      let r = 0;

      if (t < 0.15) {
        // Base transitions and expands slightly
        const localT = t / 0.15;
        r = 1.5 + localT * 0.25;
      } else if (t < 0.65) {
        // Bulb swelling outward to maximum radius
        const localT = (t - 0.15) / 0.5;
        r = 1.75 + Math.sin(localT * Math.PI) * 0.7;
      } else {
        // Elegant curve tapering to the sharp top spire tip
        const localT = (t - 0.65) / 0.35;
        r = 1.75 * Math.pow(1 - localT, 1.85);
      }
      points.push(new THREE.Vector2(r, y));
    }

    // Top closing point
    points.push(new THREE.Vector2(0.001, 3.0));

    // Lathe the points to get the full 3D onion dome
    const domeGeometry = new THREE.LatheGeometry(points, 32);

    // B. Dual-Layer Materials for Depth Holographic Effect
    // Layer 1: Solid translucent glowing emerald glass core
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: '#115E59',
      emissive: '#042F2E',
      specular: '#14B8A6',
      shininess: 90,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const innerDomeMesh = new THREE.Mesh(domeGeometry, innerMaterial);
    domeGroup.add(innerDomeMesh);

    // Layer 2: Wireframe gold outer crust
    const outerMaterial = new THREE.MeshPhongMaterial({
      color: '#D4A53A',
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      shininess: 100
    });
    const outerDomeMesh = new THREE.Mesh(domeGeometry, outerMaterial);
    outerDomeMesh.scale.set(1.02, 1.02, 1.02); // slightly larger to encase the inner core
    domeGroup.add(outerDomeMesh);

    // C. The Top Finial Spire (Cylinder + brass spheres + Crescent Moon)
    const finialGroup = new THREE.Group();
    finialGroup.position.set(0, 3.0, 0); // Position on top peak
    domeGroup.add(finialGroup);

    // Spire rod
    const rodGeom = new THREE.CylinderGeometry(0.04, 0.08, 1.6, 12);
    const goldMetalMat = new THREE.MeshStandardMaterial({
      color: '#EAB308',
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 1.5
    });
    const rodMesh = new THREE.Mesh(rodGeom, goldMetalMat);
    rodMesh.position.y = 0.8;
    finialGroup.add(rodMesh);

    // Three golden brass spheres of descending sizes
    const sphereOffsets = [0.3, 0.8, 1.2];
    const sphereSizes = [0.24, 0.16, 0.1];
    sphereOffsets.forEach((offset, idx) => {
      const spGeom = new THREE.SphereGeometry(sphereSizes[idx], 16, 16);
      const spMesh = new THREE.Mesh(spGeom, goldMetalMat);
      spMesh.position.y = offset;
      finialGroup.add(spMesh);
    });

    // Elegant 3D Extruded Crescent Moon at the absolute pinnacle
    const crescentShape = new THREE.Shape();
    // Outer circle arc
    crescentShape.absarc(0, 0, 0.38, 0, Math.PI * 2, false);
    // Inner cutout circle arc offset slightly to form a sharp crescent
    const holePath = new THREE.Path();
    holePath.absarc(0.12, 0.06, 0.32, 0, Math.PI * 2, true);
    crescentShape.holes.push(holePath);

    const extrudeSettings = {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    };

    const crescentGeom = new THREE.ExtrudeGeometry(crescentShape, extrudeSettings);
    const crescentMesh = new THREE.Mesh(crescentGeom, goldMetalMat);
    crescentMesh.position.set(-0.06, 1.7, -0.03);
    crescentMesh.rotation.y = Math.PI / 2; // Face the camera
    finialGroup.add(crescentMesh);

    // D. Arch-windowed Base drum ring at the very bottom
    const baseRingGeom = new THREE.CylinderGeometry(1.51, 1.51, 0.35, 32, 1, true);
    const baseRingMat = new THREE.MeshPhongMaterial({
      color: '#1F2937',
      emissive: '#111827',
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const baseRingMesh = new THREE.Mesh(baseRingGeom, baseRingMat);
    baseRingMesh.position.y = -0.98;
    domeGroup.add(baseRingMesh);

    // --- 5. GSAP Entrance Animation on Mount ---
    gsap.fromTo(domeGroup.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1.8, ease: 'back.out(1.2)' }
    );
    gsap.fromTo(domeGroup.rotation,
      { y: Math.PI * 2 },
      { y: 0, duration: 2.2, ease: 'power3.out' }
    );

    // --- 6. Event Handlers ---
    const handleMouseMove = (e: MouseEvent) => {
      // Get normalized cursor offset relative to the dome's container viewport
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      mouse.current.targetX = (relativeX / rect.width) - 0.5;
      mouse.current.targetY = (relativeY / rect.height) - 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 7. Animation Frame Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smoothly interpolate current coordinates toward cursor target (spring damping)
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.06;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.06;

      // Rotate group dynamically based on mouse position (interactive tilt and pan)
      if (domeGroup) {
        // Continuous gentle rotation as background breeze
        domeGroup.rotation.y = elapsedTime * 0.08 + (mouse.current.x * 0.95);
        // Tilt forward or back slightly based on mouse Y
        domeGroup.rotation.x = (mouse.current.y * 0.45);
        // Add subtle floating hover drift up and down
        domeGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      }

      // Shimmering twinkle inside the emerald glass
      if (innerMaterial) {
        innerMaterial.opacity = 0.45 + Math.sin(elapsedTime * 2.0) * 0.12;
      }

      // Rotate the spire crescent to add secondary motion detail
      if (crescentMesh) {
        crescentMesh.rotation.z = Math.sin(elapsedTime * 0.8) * 0.04;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // --- 8. Cleanup Resources ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      domeGeometry.dispose();
      innerMaterial.dispose();
      outerMaterial.dispose();
      rodGeom.dispose();
      goldMetalMat.dispose();
      crescentGeom.dispose();
      baseRingGeom.dispose();
      baseRingMat.dispose();

      if (rendererRef.current && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="relative w-full h-[280px] flex items-center justify-center select-none cursor-pointer">
        {/* Decorative ambient background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[200px] h-[200px] rounded-full border border-teal-500/10 animate-pulse" />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-gold-500/5 animate-[spin_45s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
        </div>
        
        {/* Vector dome */}
        <div className="w-[180px] h-[240px] relative z-10 flex items-center justify-center animate-[bounce_6s_ease-in-out_infinite]">
          <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-[0_10px_25px_rgba(20,184,166,0.3)]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF1C5" />
                <stop offset="50%" stopColor="#D4A53A" />
                <stop offset="100%" stopColor="#AA7C11" />
              </linearGradient>
              <linearGradient id="domeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0B372F" />
                <stop offset="30%" stopColor="#115E51" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="70%" stopColor="#115E51" />
                <stop offset="100%" stopColor="#0B372F" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            
            {/* Back glowing aura */}
            <circle cx="50" cy="75" r="30" fill="url(#glowGrad)" />

            {/* Base rings */}
            <rect x="25" y="105" width="50" height="4" rx="2" fill="url(#goldGrad)" />
            <rect x="22" y="109" width="56" height="6" rx="3" fill="#0B372F" stroke="#14B8A6" strokeWidth="0.5" />
            
            {/* Main dome body */}
            <path d="M 28,105 
                     C 28,85 18,75 50,45 
                     C 82,75 72,85 72,105 Z" 
                  fill="url(#domeGrad)" 
                  stroke="url(#goldGrad)" 
                  strokeWidth="1.5" />
                  
            {/* Internal vertical structural design lines */}
            <path d="M 50,45 C 44,75 42,85 42,105" fill="none" stroke="#14B8A6" strokeWidth="0.5" opacity="0.6" />
            <path d="M 50,45 C 56,75 58,85 58,105" fill="none" stroke="#14B8A6" strokeWidth="0.5" opacity="0.6" />
            <path d="M 50,45 Q 50,105 50,105" fill="none" stroke="url(#goldGrad)" strokeWidth="0.8" opacity="0.8" />
            
            {/* Spire shaft */}
            <rect x="48.5" y="20" width="3" height="25" fill="url(#goldGrad)" />
            
            {/* Spire ornament balls */}
            <circle cx="50" cy="38" r="3.5" fill="url(#goldGrad)" />
            <circle cx="50" cy="30" r="2.5" fill="url(#goldGrad)" />
            <circle cx="50" cy="24" r="1.5" fill="url(#goldGrad)" />
            
            {/* Crescent at the tip */}
            <path d="M 50,10 
                     C 44,10 40,14 40,20 
                     C 40,26 44,30 50,30 
                     C 47,28 45,24 45,20 
                     C 45,16 47,12 50,10 Z" 
                  fill="url(#goldGrad)" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] md:h-[450px] flex items-center justify-center select-none cursor-pointer">
      {/* Decorative ambient background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[260px] h-[260px] md:w-[350px] md:h-[350px] rounded-full border border-teal-500/10 animate-pulse" />
        <div className="absolute w-[300px] h-[300px] md:w-[410px] md:h-[410px] rounded-full border border-gold-500/5 animate-[spin_40s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
      </div>
      
      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10"
        title="Interactive 3D Dome - Hover or move mouse to look around!"
      />
    </div>
  );
}
