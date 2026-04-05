import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, ContactShadows, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Restaurant } from '../types';

function RestaurantModel({ 
  position, 
  color, 
  restaurant, 
  onSelect,
  isSelected,
  rotation = [0, 0, 0] 
}: { 
  position: [number, number, number], 
  color: string, 
  restaurant: Restaurant,
  onSelect: (id: string) => void,
  isSelected: boolean,
  rotation?: [number, number, number] 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      // Smooth rotation
      const targetRotationSpeed = (hovered || isSelected) ? 0.04 : 0.01;
      groupRef.current.rotation.y += targetRotationSpeed;
      
      // Gentle bobbing
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.1;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(restaurant.id);
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scale = isSelected ? 1.3 : hovered ? 1.2 : 1;

  return (
    <Float speed={hovered ? 4 : 2} rotationIntensity={0.5} floatIntensity={1}>
      <group 
        ref={groupRef}
        position={position} 
        rotation={rotation as any}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick as any}
        scale={scale}
      >
        {/* Main Building Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1.2, 0.6]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.2} 
            emissive={isSelected ? color : '#000000'}
            emissiveIntensity={isSelected ? 1.5 : 0}
          />
        </mesh>

        {/* Windows / Details */}
        <mesh position={[0, 0.2, 0.31]}>
          <planeGeometry args={[0.7, 0.4]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff" 
            emissiveIntensity={hovered || isSelected ? 2 : 0.5} 
            transparent 
            opacity={0.8}
          />
        </mesh>

        {/* Roof Structure */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.1, 0.2, 0.7]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Signage / Cuisine Tag */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.6, 0.3, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        
        <Text
          position={[0, 0.9, 0.06]}
          fontSize={0.07}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {restaurant.cuisine.toUpperCase()}
        </Text>

        <Text
          position={[0, -0.8, 0]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="top"
          maxWidth={1.5}
          textAlign="center"
          font="https://fonts.gstatic.com/s/outfit/v11/Q_3W9S6mXGVmSgb8Xm7X.woff"
        >
          {restaurant.name}
        </Text>

        {/* Selection Glow Ring */}
        {isSelected && (
          <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 32]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={4} 
              transparent 
              opacity={0.6} 
            />
          </mesh>
        )}

        {/* Hover/Select Indicator */}
        {(hovered || isSelected) && (
          <Html position={[0, 1.4, 0]} center>
            <div className="bg-black/90 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 whitespace-nowrap pointer-events-none shadow-2xl scale-90">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                  {isSelected ? 'Active' : 'Explore'}
                </span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

function Scene({ 
  onSelectRestaurant, 
  selectedId 
}: { 
  onSelectRestaurant: (id: string) => void,
  selectedId: string | null
}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    const restaurantsPath = 'restaurants';
    const q = query(collection(db, restaurantsPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      setRestaurants(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, restaurantsPath);
    });
    return () => unsubscribe();
  }, []);

  const colors = ['#ff4e00', '#ff9e00', '#ff2e00', '#ff6e00'];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {restaurants.map((res, i) => {
        const x = (i - (restaurants.length - 1) / 2) * 2.5;
        return (
          <RestaurantModel 
            key={res.id}
            position={[x, 0, 0]} 
            color={colors[i % colors.length]} 
            restaurant={res}
            onSelect={onSelectRestaurant}
            isSelected={selectedId === res.id}
            rotation={[0, (i - 1) * 0.2, 0]}
          />
        );
      })}

      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={15} blur={2} far={4.5} />
      <Environment preset="city" />
    </>
  );
}

interface ThreeHeroProps {
  onSelectRestaurant: (id: string) => void;
  selectedId: string | null;
}

export default function ThreeHero({ onSelectRestaurant, selectedId }: ThreeHeroProps) {
  return (
    <div className="h-[70vh] w-full relative overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none text-center px-4">
        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-4 text-white">
          SMACKERS
        </h1>
        <p className="text-xl md:text-2xl font-light text-white/70 max-w-2xl">
          Experience food delivery in a new dimension. Click a restaurant to explore.
        </p>
      </div>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene onSelectRestaurant={onSelectRestaurant} selectedId={selectedId} />
        </Suspense>
      </Canvas>
    </div>
  );
}
