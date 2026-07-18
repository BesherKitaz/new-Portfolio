import { Canvas } from "@react-three/fiber";
import { useState } from 'react'


const Node = () => {
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  return (
      <mesh
          scale={hovered ? 1.2 : 1}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setSelected(!selected)}
        >
        <sphereGeometry args={[2, 64, 64]} />

        <meshStandardMaterial
          color={selected ? "orange" : hovered ? "cyan" : "royalblue"}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
  );
}

export default Node;