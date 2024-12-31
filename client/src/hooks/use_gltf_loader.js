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
