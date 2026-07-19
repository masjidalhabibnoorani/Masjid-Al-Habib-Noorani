/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface ParticlesProps {
  dimensionScale?: 1 | 2 | 3;
}

export default function Particles({ dimensionScale = 2 }: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const starMaterialRef = useRef<THREE.PointsMaterial | null>(null);

  // Light refs for GSAP animations
  const goldLightRef = useRef<THREE.PointLight | null>(null);
  const emeraldLightRef = useRef<THREE.PointLight | null>(null);
  const violetLightRef = useRef<THREE.PointLight | null>(null);

  // Mouse coordinate targets for smooth GSAP parallax
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Effect 1: Handle WebGL Canvas Initialization ---
  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    // Reduce fog calculation on mobile
    scene.fog = new THREE.FogExp2('#020806', isMobile ? 0.01 : 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 35;
    camera.position.y = 5;
    cameraRef.current = camera;

    // On mobile, disable antialiasing and specify high performance
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, 
      alpha: true, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    // Limit pixel ratio on mobile to 1 to save GPU load
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 3. Light Setup ---
    const ambientLight = new THREE.AmbientLight('#081512', 1.5);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight('#D4A53A', isMobile ? 2 : 4, 100);
    goldLight.position.set(15, 10, 15);
    scene.add(goldLight);
    goldLightRef.current = goldLight;

    const emeraldLight = new THREE.PointLight('#14B8A6', isMobile ? 2.5 : 5, 100);
    emeraldLight.position.set(-15, -10, 15);
    scene.add(emeraldLight);
    emeraldLightRef.current = emeraldLight;

    // Skip the third light on mobile to save rendering pass complexity
    let violetLight: THREE.PointLight | null = null;
    if (!isMobile) {
      violetLight = new THREE.PointLight('#6366F1', 3, 100);
      violetLight.position.set(0, 0, -20);
      scene.add(violetLight);
      violetLightRef.current = violetLight;
    }

    // --- 4. 3D Stars Galaxy (Fewer stars on mobile for butter smooth performance) ---
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = isMobile ? 150 : 1200;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsColors = new Float32Array(starsCount * 3);

    const colorPalette = [
      new THREE.Color('#14B8A6'), // Teal
      new THREE.Color('#D4A53A'), // Gold
      new THREE.Color('#0D9488'), // Pine Green
      new THREE.Color('#818CF8')  // Violet-indigo
    ];

    for (let i = 0; i < starsCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * (isMobile ? 100 : 160);
      starsPositions[i + 1] = (Math.random() - 0.5) * (isMobile ? 80 : 120);
      starsPositions[i + 2] = (Math.random() - 0.5) * 100 - 10;

      const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starsColors[i] = chosenColor.r;
      starsColors[i + 1] = chosenColor.g;
      starsColors[i + 2] = chosenColor.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

    // Simple texture fallback to avoid canvas draw on low-end
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const starsMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.6 : 0.45,
      map: createCircleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    starMaterialRef.current = starsMaterial;

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // --- 5. Custom 3D Floating Crystalline Meshes (Disabled on Mobile for supreme speed) ---
    const meshes: THREE.Mesh[] = [];
    let icoGeom: THREE.IcosahedronGeometry | null = null;
    let icoMat: THREE.MeshPhongMaterial | null = null;
    let icoMesh: THREE.Mesh | null = null;

    let octGeom: THREE.OctahedronGeometry | null = null;
    let octMat: THREE.MeshPhongMaterial | null = null;
    let octMesh: THREE.Mesh | null = null;

    let torusGeom: THREE.TorusGeometry | null = null;
    let torusMat: THREE.MeshPhongMaterial | null = null;
    let torusMesh: THREE.Mesh | null = null;

    let sphereGeom: THREE.SphereGeometry | null = null;
    let sphereMat: THREE.MeshPhongMaterial | null = null;
    let sphereMesh: THREE.Mesh | null = null;

    if (!isMobile) {
      // Mesh 1: Golden wireframe Icosahedron
      icoGeom = new THREE.IcosahedronGeometry(6, 1);
      icoMat = new THREE.MeshPhongMaterial({
        color: '#D4A53A',
        wireframe: true,
        transparent: true,
        opacity: 0.45,
        shininess: 100
      });
      icoMesh = new THREE.Mesh(icoGeom, icoMat);
      icoMesh.position.set(10, 2, -10);
      scene.add(icoMesh);
      meshes.push(icoMesh);

      // Mesh 2: Inner Emerald Octahedron
      octGeom = new THREE.OctahedronGeometry(3.5, 0);
      octMat = new THREE.MeshPhongMaterial({
        color: '#14B8A6',
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        shininess: 120
      });
      octMesh = new THREE.Mesh(octGeom, octMat);
      octMesh.position.set(10, 2, -10);
      scene.add(octMesh);
      meshes.push(octMesh);

      // Mesh 3: Left-Side Floating Ring/Torus
      torusGeom = new THREE.TorusGeometry(8, 0.12, 10, 40);
      torusMat = new THREE.MeshPhongMaterial({
        color: '#6366F1',
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      torusMesh = new THREE.Mesh(torusGeom, torusMat);
      torusMesh.position.set(-20, -5, -5);
      torusMesh.rotation.x = Math.PI / 4;
      scene.add(torusMesh);
      meshes.push(torusMesh);

      // Mesh 4: Floating Right-Side golden sphere grid
      sphereGeom = new THREE.SphereGeometry(3.5, 8, 8);
      sphereMat = new THREE.MeshPhongMaterial({
        color: '#F59E0B',
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
      sphereMesh.position.set(22, -8, -15);
      scene.add(sphereMesh);
      meshes.push(sphereMesh);
    }

    meshesRef.current = meshes;

    // --- 6. Interactivity & Parallax ---
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.targetX = (e.clientX / window.innerWidth) - 0.5;
      mouse.current.targetY = (e.clientY / window.innerHeight) - 0.5;
    };

    // Skip mousemove tracking on mobile
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- 7. Scroll Tracker ---
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      
      // Depth scroll effect
      gsap.to(camera.position, {
        z: (dimensionScale === 3 ? 22 : dimensionScale === 1 ? 45 : 35) - scrollPercent * 20,
        y: (dimensionScale === 3 ? 3 : dimensionScale === 1 ? 0 : 5) - scrollPercent * 6,
        duration: isMobile ? 0.8 : 1.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      gsap.to(stars.rotation, {
        y: scrollPercent * Math.PI * 0.5,
        z: scrollPercent * Math.PI * 0.2,
        duration: isMobile ? 1.0 : 2.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      if (!isMobile) {
        meshes.forEach((mesh, index) => {
          gsap.to(mesh.position, {
            y: (index % 2 === 0 ? 1 : -1) * (2 + scrollPercent * 8),
            duration: 2.0,
            ease: 'power1.out',
            overwrite: 'auto'
          });
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // --- 8. Resize Handler ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 9. Render Frame Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (!isMobile) {
        // Lerp mouse coordinates
        mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
        mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

        // Camera parallax tilt
        camera.position.x += (mouse.current.x * 12 - camera.position.x) * 0.05;
      }
      camera.lookAt(new THREE.Vector3(0, 0, -10));

      // Continuous mesh rotation
      if (icoMesh) {
        icoMesh.rotation.y = elapsedTime * (dimensionScale === 3 ? 0.3 : 0.15);
        icoMesh.rotation.z = elapsedTime * 0.08;
      }

      if (octMesh) {
        octMesh.rotation.y = -elapsedTime * (dimensionScale === 3 ? 0.5 : 0.25);
        octMesh.rotation.x = elapsedTime * 0.12;
      }

      if (torusMesh) {
        torusMesh.rotation.x = elapsedTime * 0.08;
        torusMesh.rotation.y = elapsedTime * 0.12;
      }

      if (sphereMesh) {
        sphereMesh.rotation.y = elapsedTime * 0.1;
      }

      // Stars twinkle
      if (stars) {
        stars.rotation.x = Math.sin(elapsedTime * 0.05) * 0.03;
        const baseOpacity = dimensionScale === 3 ? 0.95 : dimensionScale === 1 ? 0.15 : 0.75;
        // On mobile, keep twinkle calculation lightweight
        starsMaterial.opacity = baseOpacity + Math.sin(elapsedTime * (isMobile ? 1.5 : 2.5)) * (dimensionScale === 1 ? 0.05 : 0.15);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // --- 10. Memory Clean-Up ---
    return () => {
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      starsGeometry.dispose();
      starsMaterial.dispose();

      if (icoGeom) icoGeom.dispose();
      if (icoMat) icoMat.dispose();
      if (octGeom) octGeom.dispose();
      if (octMat) octMat.dispose();
      if (torusGeom) torusGeom.dispose();
      if (torusMat) torusMat.dispose();
      if (sphereGeom) sphereGeom.dispose();
      if (sphereMat) sphereMat.dispose();

      if (rendererRef.current && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [isMobile]);

  // --- Effect 2: Handle Dimension Scale Changes (GSAP Transition Matrix) ---
  useEffect(() => {
    if (isMobile) return;
    const camera = cameraRef.current;
    const meshes = meshesRef.current;
    const starsMaterial = starMaterialRef.current;
    const goldLight = goldLightRef.current;
    const emeraldLight = emeraldLightRef.current;
    const violetLight = violetLightRef.current;

    if (!camera) return;

    if (dimensionScale === 1) {
      // 1D Mode: Safe Flat Mode. Fade out lights & meshes, pull camera back, slow down.
      gsap.to(camera.position, {
        z: 48,
        y: 0,
        duration: isMobile ? 0.6 : 1.2,
        ease: 'power2.inOut'
      });
      if (!isMobile) {
        meshes.forEach(m => {
          gsap.to(m.scale, { x: 0, y: 0, z: 0, duration: 1.0, ease: 'power2.inOut' });
        });
      }
      if (starsMaterial) {
        gsap.to(starsMaterial, { opacity: 0.15, size: isMobile ? 0.4 : 0.3, duration: 1.0 });
      }
      if (goldLight) gsap.to(goldLight, { intensity: 0.5, duration: 1.0 });
      if (emeraldLight) gsap.to(emeraldLight, { intensity: 0.5, duration: 1.0 });
      if (violetLight) gsap.to(violetLight, { intensity: 0.2, duration: 1.0 });

    } else if (dimensionScale === 2) {
      // 2D Mode: Standard Hybrid visual layer.
      gsap.to(camera.position, {
        z: 35,
        y: 5,
        duration: isMobile ? 0.8 : 1.5,
        ease: 'power2.out'
      });
      if (!isMobile) {
        meshes.forEach(m => {
          gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'back.out(1.2)' });
        });
      }
      if (starsMaterial) {
        gsap.to(starsMaterial, { opacity: 0.85, size: isMobile ? 0.6 : 0.45, duration: 1.2 });
      }
      if (goldLight) gsap.to(goldLight, { intensity: isMobile ? 2 : 4, duration: 1.2 });
      if (emeraldLight) gsap.to(emeraldLight, { intensity: isMobile ? 2.5 : 5, duration: 1.2 });
      if (violetLight) gsap.to(violetLight, { intensity: 3, duration: 1.2 });

    } else if (dimensionScale === 3) {
      // 3D Mode: Full Immersive Warp. Expand, multiply light levels, zoom in depth!
      gsap.to(camera.position, {
        z: 22,
        y: 3,
        duration: isMobile ? 1.0 : 1.8,
        ease: 'power3.out'
      });
      if (!isMobile) {
        meshes.forEach((m, idx) => {
          const scaleMult = idx === 0 ? 1.7 : idx === 1 ? 1.6 : idx === 2 ? 1.4 : 1.35;
          gsap.to(m.scale, { x: scaleMult, y: scaleMult, z: scaleMult, duration: 1.5, ease: 'elastic.out(1, 0.8)' });
        });
      }
      if (starsMaterial) {
        gsap.to(starsMaterial, { opacity: 1.0, size: isMobile ? 0.8 : 0.65, duration: 1.5 });
      }
      if (goldLight) gsap.to(goldLight, { intensity: isMobile ? 4 : 8, duration: 1.5 });
      if (emeraldLight) gsap.to(emeraldLight, { intensity: isMobile ? 4.5 : 9, duration: 1.5 });
      if (violetLight) gsap.to(violetLight, { intensity: 5, duration: 1.5 });
    }
  }, [dimensionScale, isMobile]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020806] opacity-80">
        {/* Soft elegant glowing orbs using pure CSS gradient layers for mobile performance */}
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-teal-500/10 blur-[90px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[110px] animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-emerald-500/5 blur-[80px] animate-[pulse_10s_ease-in-out_infinite]" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen', opacity: 0.85 }}
    />
  );
}
