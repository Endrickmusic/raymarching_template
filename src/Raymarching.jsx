import {
  useCubeTexture,
  useTexture,
  useFBO,
  Image,
  OrbitControls,
} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useCallback, useState } from "react"
import { useControls, Leva } from "leva"

import vertexShader from "./shaders/vertexShader.js"
import fragmentShader from "./shaders/fragmentShader.js"
import { Vector2, Vector3, MathUtils, Matrix4 } from "three"

export default function Shader() {
  const meshRef = useRef()
  const buffer = useFBO()
  const viewport = useThree((state) => state.viewport)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  const nearPlaneWidth =
    camera.near *
    Math.tan(MathUtils.degToRad(camera.fov / 2)) *
    camera.aspect *
    2
  const nearPlaneHeight = nearPlaneWidth / camera.aspect

  const mousePosition = useRef({ x: 0, y: 0 })

  const updateMousePosition = useCallback((e) => {
    mousePosition.current = { x: e.pageX, y: e.pageY }
  }, [])

  const noiseTexture = useTexture("./textures/noise.png")

  const cubeTexture = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: "./cubemap/potsdamer_platz/" }
  )

  const [worldToObjectMatrix, setWorldToObjectMatrix] = useState(new Matrix4())

  const { value, speed } = useControls({
    value: {
      value: 1.5,
      min: 0.01,
      max: 6.0,
      step: 0.1,
    },
    speed: {
      value: 0.5,
      min: 0.01,
      max: 1.0,
      step: 0.1,
    },
  })

  // const reflection = 1.5
  // const speed = 0.5
  // const IOR = 0.84
  // const count = 3
  // const size = 1.0
  // const dispersion = 0.03
  // const refract = 0.15
  // const chromaticAbberation = 0.5

  useEffect(() => {
    const object = meshRef.current

    if (object) {
      object.updateMatrixWorld()
      const worldMatrix = object.matrixWorld
      const inverseMatrix = new Matrix4().copy(worldMatrix).invert()
      setWorldToObjectMatrix(inverseMatrix)
      console.log("World to Object Matrix:", inverseMatrix)
      meshRef.current.material.uniforms.uInverseModelMat.value = inverseMatrix
      meshRef.current.updateMatrixWorld()
    }
  }, [
    meshRef.current?.position,
    meshRef.current?.rotation,
    meshRef.current?.scale,
  ])

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition, false)
    console.log("mousePosition", mousePosition)
    return () => {
      window.removeEventListener("mousemove", updateMousePosition, false)
    }
  }, [updateMousePosition])

  let cameraForwardPos = new Vector3(0, 0, -1)

  useFrame((state) => {
    let time = state.clock.getElapsedTime()

    if (meshRef.current) {
    }

    // Update the uniform

    meshRef.current.material.uniforms.uCamPos.value = camera.position
    // meshRef.current.material.uniforms.uMouse.value = new Vector2(0, 0)

    meshRef.current.material.uniforms.uMouse.value = new Vector2(
      mousePosition.current.x,
      mousePosition.current.y
    )

    meshRef.current.material.uniforms.uTime.value = time * speed
    meshRef.current.material.uniforms.uValue.value = value

    // FBO
    // state.gl.setRenderTarget(buffer)
    // state.gl.setClearColor("#d8d7d7")
    // state.gl.render(scene, state.camera)
    // state.gl.setRenderTarget(null)
  })

  // Define the shader uniforms with memoization to optimize performance
  const uniforms = useMemo(
    () => ({
      uCamPos: { value: camera.position },
      uCamToWorldMat: { value: camera.matrixWorld },
      uCamInverseProjMat: { value: camera.projectionMatrixInverse },
      uInverseModelMat: {
        value: new Matrix4(),
      },
      uTime: {
        type: "f",
        value: 1.0,
      },
      uMouse: {
        type: "v2",
        value: new Vector2(0, 0),
      },
      uResolution: {
        type: "v2",
        value: new Vector2(viewport.width, viewport.height).multiplyScalar(
          Math.min(window.devicePixelRatio, 2)
        ),
      },
      uTexture: {
        type: "sampler2D",
        value: buffer.texture,
      },
      uNoiseTexture: {
        type: "sampler2D",
        value: noiseTexture,
      },
      iChannel0: {
        type: "samplerCube",
        value: cubeTexture,
      },
      uValue: {
        type: "f",
        value: value,
      },
    }),
    [viewport.width, viewport.height, buffer.texture]
  )

  return (
    <>
      <Leva hidden />
      <OrbitControls />

      <mesh position={[0, 0.5, -4]} rotation={[2, 4, 1]}>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh>

      <mesh ref={meshRef} scale={[2, 2, 2]} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={true}
        />
      </mesh>
    </>
  )
}
