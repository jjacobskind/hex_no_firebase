import React, { useRef, useEffect } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useThree, useFrame } from '@react-three/fiber';

/**
 * Minimal replacement for <OrbitControls> from drei:
 * - Installs OrbitControls from 'three-stdlib'
 * - Attaches them to your scene/camera
 */
export default function OrbitControls(props) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    controlsRef.current = new OrbitControlsImpl(camera, gl.domElement);

    // Optional settings:
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;
    controlsRef.current.screenSpacePanning = false;
    controlsRef.current.minDistance = 1;
    controlsRef.current.maxDistance = 200;

    return () => {
      controlsRef.current.dispose();
    };
  }, [camera, gl]);

  useFrame(() => {
    if (controlsRef.current && controlsRef.current.update) {
      controlsRef.current.update();
    }
  });

  return null; // No JSX to render, purely hooking into the R3F scene
}
