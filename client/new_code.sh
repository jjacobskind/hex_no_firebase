#!/usr/bin/env bash

#############################################
# REFRACTOR OUT @react-three/drei
# 
# 1) npm uninstall @react-three/drei
# 2) Remove import lines referencing drei
# 3) Create orbit_controls.jsx (raw three-stdlib)
# 4) Create useGltfLoader.js if desired
#############################################

echo "1) Uninstalling @react-three/drei ..."
npm uninstall @react-three/drei

echo
echo "2) Removing import lines referencing '@react-three/drei' from .jsx files..."
# This is a naive approach, backing up with .bak just in case
find src -type f -name "*.jsx" -exec sed -i.bak '/@react-three\/drei/d' {} \;

echo
echo "3) Creating orbit_controls.jsx (replaces <OrbitControls> from drei)..."
mkdir -p src/components/orbit_controls
cat << 'EOF' > src/components/orbit_controls/orbit_controls.jsx
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
EOF

echo
echo "4) (Optional) Creating hooks/useGltfLoader.js if you want to load GLTF without drei..."
mkdir -p src/hooks
cat << 'EOF' > src/hooks/use_gltf_loader.js
import { useState, useEffect } from 'react';
import { GLTFLoader } from 'three-stdlib';

/**
 * Basic GLTF loader hook, replaces drei's useGLTF.
 */
export function useGltfLoader(url) {
  const [gltf, setGltf] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(url, (data) => setGltf(data));
  }, [url]);

  return gltf;
}
EOF

echo
echo "Done! You have now removed @react-three/drei, replaced OrbitControls, and created a sample GLTF loader."
echo "Next steps:"
echo " - If your code used other drei components (useTexture, <Text>, <Environment>, etc.), refactor them similarly."
echo " - Check *.bak backups if the sed removal impacted any lines incorrectly."
echo " - Test your app. For OrbitControls usage, import the new orbit_controls.jsx."