import { useState } from 'react'

type NodeProps = {
  position?: [number, number, number]
}

const Node = ({ position }: NodeProps) => {
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  return (
    <mesh
      position={position}
      scale={hovered ? 1.1 : 1}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={() => setSelected(!selected)}
    >
      <sphereGeometry args={[2, 64, 64]} />

      <meshStandardMaterial
        color={selected ? 'orange' : hovered ? 'cyan' : 'royalblue'}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  )
}

export default Node
