import { Canvas } from "@react-three/fiber";
import { useState } from 'react'
import Node from './components/Node.tsx'

export default function App() {
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);


  return (
    <Canvas camera={{ position: [0, 0, 5] }} style={{ height: 600 }}>
      <color attach="background" args={["#080b16"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 5]} intensity={2} />

      <Node />
    </Canvas>

  );
}

