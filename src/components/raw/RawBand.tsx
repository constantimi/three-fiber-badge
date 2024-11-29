import * as THREE from 'three';
import { useRef, useState } from 'react';
import { extend, useThree, useFrame } from '@react-three/fiber';
import {
    BallCollider,
    CuboidCollider,
    RigidBody,
    useRopeJoint,
    useSphericalJoint,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { RigidBodyRef } from '../../types/three';

extend({ MeshLineGeometry, MeshLineMaterial });

export const RawBand = () => {
    const band = useRef<THREE.Mesh>(null);
    const fixed: RigidBodyRef = useRef(null);
    const j1: RigidBodyRef = useRef(null);
    const j2: RigidBodyRef = useRef(null);
    const j3: RigidBodyRef = useRef(null);
    const card: RigidBodyRef = useRef(null);

    const vec = new THREE.Vector3();
    const ang = new THREE.Vector3();
    const rot = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const { width, height } = useThree((state) => state.size);

    const [curve] = useState(
        () =>
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
            ])
    );

    const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);

    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
    useSphericalJoint(j3, card, [
        [0, 0, 0],
        [0, 1.45, 0],
    ]);

    useFrame((state) => {
        if (dragged && card.current) {
            vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(
                state.camera
            );
            dir.copy(vec).sub(state.camera.position).normalize();
            vec.add(dir.multiplyScalar(state.camera.position.length()));

            [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());

            card.current.setNextKinematicTranslation({
                x: vec.x - dragged.x,
                y: vec.y - dragged.y,
                z: vec.z - dragged.z,
            });
        }

        if (fixed.current && band.current) {
            curve.points[0].copy(j3.current!.translation());
            curve.points[1].copy(j2.current!.translation());
            curve.points[2].copy(j1.current!.translation());
            curve.points[3].copy(fixed.current.translation());
            (band.current.geometry as MeshLineGeometry).setPoints(
                curve.getPoints(32)
            );

            if (card.current) {
                ang.copy(card.current.angvel());
                rot.copy(card.current.rotation());
                card.current.setAngvel(
                    {
                        x: ang.x,
                        y: ang.y - rot.y * 0.25,
                        z: ang.z,
                    },
                    true
                );
            }
        }
    });

    return (
        <>
            <group position={[0, 4, 0]}>
                <RigidBody
                    ref={fixed}
                    angularDamping={2}
                    linearDamping={2}
                    type='fixed'
                />
                <RigidBody
                    position={[0.5, 0, 0]}
                    ref={j1}
                    angularDamping={2}
                    linearDamping={2}
                >
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody
                    position={[1, 0, 0]}
                    ref={j2}
                    angularDamping={2}
                    linearDamping={2}
                >
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody
                    position={[1.5, 0, 0]}
                    ref={j3}
                    angularDamping={2}
                    linearDamping={2}
                >
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody
                    position={[2, 0, 0]}
                    ref={card}
                    angularDamping={2}
                    linearDamping={2}
                    type={dragged ? 'kinematicPosition' : 'dynamic'}
                >
                    <CuboidCollider args={[0.8, 1.125, 0.01]} />
                    <mesh
                        onPointerUp={(e) => {
                            (e.target as HTMLElement).releasePointerCapture(
                                e.pointerId
                            );
                            setDragged(false);
                        }}
                        onPointerDown={(e) => {
                            (e.target as HTMLElement).setPointerCapture(
                                e.pointerId
                            );
                            if (card.current) {
                                setDragged(
                                    new THREE.Vector3()
                                        .copy(e.point)
                                        .sub(
                                            vec.copy(card.current.translation())
                                        )
                                );
                            }
                        }}
                    >
                        <planeGeometry args={[0.8 * 2, 1.125 * 2]} />
                        <meshBasicMaterial
                            transparent
                            opacity={0.25}
                            color='white'
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </RigidBody>
            </group>
            <mesh ref={band}>
                <meshLineGeometry />
                <meshLineMaterial
                    transparent
                    opacity={0.25}
                    color='white'
                    depthTest={false}
                    resolution={[width, height]}
                    lineWidth={1}
                />
            </mesh>
        </>
    );
};

export default RawBand;
