import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"

import "./index.css"

import Shader from "./Raymarching.jsx"

export default function App() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 4], fov: 40 }}>
      <Environment background path="./cubemap/potsdamer_platz/" />
      <color attach="background" args={["#eeeeee"]} />
      <Shader />
    </Canvas>
  )
}
