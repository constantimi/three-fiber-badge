import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, Lightformer } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { theme } from './constants/theme';
import Band from './components/Band';
import RawBand from './components/RawBand';

const App = () => {
  // Use Leva to control the debug and raw state with more descriptive labels
  const { debug, raw } = useControls({
    debug: { label: 'Enable Debug Mode', value: false },
    raw: { label: 'Show Raw Band', value: false },
  });

  return (
    <div
      className="App"
      style={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: '#202025',
      }}
    >
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
        {/* Ambient light with intensity set to Math.PI */}
        <ambientLight intensity={Math.PI} />
        {/* Physics simulation with optional debug rendering */}
        <Physics
          debug={debug}
          interpolate
          gravity={[0, -40, 0]}
          timeStep={1 / 60}
        >
          {raw ? <RawBand /> : <Band />}
        </Physics>
        {/* Environment setup with background and lightformers */}
        <Environment background blur={0.75}>
          <color attach="background" args={['black']} />
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
      <Leva theme={theme} />
    </div>
  );
};

export default App;
