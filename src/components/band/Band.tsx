import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import {
    BallCollider,
    CuboidCollider,
    RigidBody,
    useRopeJoint,
    useSphericalJoint,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { BandProps, RigidBodyRef } from '../../types/three';

extend({ MeshLineGeometry, MeshLineMaterial });

useGLTF.preload(
    'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb'
);
useTexture.preload(
    'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/SOT1hmCesOHxEYxL7vkoZ/c57b29c85912047c414311723320c16b/band.jpg'
);

export const Band = ({ maxSpeed = 50, minSpeed = 10 }: BandProps) => {
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

    const segmentProps = {
        type: 'dynamic' as const,
        canSleep: true,
        colliders: undefined,
        angularDamping: 2,
        linearDamping: 2,
    };

    const { nodes, materials } = useGLTF(
        'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb'
    );
    const texture = useTexture(
        'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/SOT1hmCesOHxEYxL7vkoZ/c57b29c85912047c414311723320c16b/band.jpg'
    );

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
    const [hovered, setHovered] = useState(false);

    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
    useSphericalJoint(j3, card, [
        [0, 0, 0],
        [0, 1.45, 0],
    ]);

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = dragged ? 'grabbing' : 'grab';
            return () => {
                document.body.style.cursor = 'auto';
            };
        }
    }, [hovered, dragged]);

    useFrame((state, delta) => {
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

        if (
            fixed.current &&
            band.current &&
            j1.current &&
            j2.current &&
            j3.current
        ) {
            [j1, j2].forEach((ref) => {
                if (ref.current && !ref.current.lerped) {
                    ref.current.lerped = new THREE.Vector3().copy(
                        ref.current.translation()
                    );
                }
                if (ref.current?.lerped) {
                    const clampedDistance = Math.max(
                        0.1,
                        Math.min(
                            1,
                            ref.current.lerped.distanceTo(
                                ref.current.translation()
                            )
                        )
                    );
                    ref.current.lerped.lerp(
                        ref.current.translation(),
                        delta *
                            (minSpeed + clampedDistance * (maxSpeed - minSpeed))
                    );
                }
            });

            const j3Translation = new THREE.Vector3().copy(
                j3.current.translation()
            );
            const j2Translation = j2.current.lerped || j2.current.translation();
            const j1Translation = j1.current.lerped || j1.current.translation();
            const fixedTranslation = new THREE.Vector3().copy(
                fixed.current.translation()
            );

            curve.points[0].copy(j3Translation);
            curve.points[1].copy(j2Translation);
            curve.points[2].copy(j1Translation);
            curve.points[3].copy(fixedTranslation);
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

    curve.curveType = 'chordal';
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    return (
        <>
            <group position={[0, 4, 0]}>
                <RigidBody ref={fixed} {...segmentProps} type='fixed' />
                <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody
                    position={[2, 0, 0]}
                    ref={card}
                    {...segmentProps}
                    type={dragged ? 'kinematicPosition' : 'dynamic'}
                >
                    <CuboidCollider args={[0.8, 1.125, 0.01]} />
                    <group
                        scale={2.25}
                        position={[0, -1.2, -0.05]}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
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
                        <mesh geometry={(nodes.card as THREE.Mesh).geometry}>
                            <meshPhysicalMaterial
                                map={
                                    (
                                        materials.base as THREE.MeshPhysicalMaterial
                                    ).map
                                }
                                map-anisotropy={16}
                                clearcoat={1}
                                clearcoatRoughness={0.15}
                                roughness={0.3}
                                metalness={0.5}
                            />
                        </mesh>
                        <mesh
                            geometry={(nodes.clip as THREE.Mesh).geometry}
                            material={materials.metal}
                            material-roughness={0.3}
                        />
                        <mesh
                            geometry={(nodes.clamp as THREE.Mesh).geometry}
                            material={materials.metal}
                        />
                    </group>
                </RigidBody>
            </group>
            <mesh ref={band}>
                <meshLineGeometry />
                <meshLineMaterial
                    color='white'
                    depthTest={false}
                    resolution={[width, height]}
                    useMap
                    map={texture}
                    repeat={[-3, 1]}
                    lineWidth={1}
                />
            </mesh>
        </>
    );
};

export default Band;
