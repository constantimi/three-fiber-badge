import { Object3D } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

interface MeshLineGeometryProps {
    points?: number[][];
}

interface MeshLineMaterialProps {
    transparent?: boolean;
    opacity?: number;
    color?: string | number;
    depthTest?: boolean;
    resolution?: [number, number];
    lineWidth?: number;
    useMap?: boolean;
    map?: THREE.Texture;
    repeat?: [number, number];
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        meshLineGeometry: JSX.IntrinsicElements['mesh'] & MeshLineGeometryProps;
        meshLineMaterial: JSX.IntrinsicElements['meshBasicMaterial'] &
            MeshLineMaterialProps;
    }
}

export interface ExtendedRigidBody extends RapierRigidBody {
    lerped?: THREE.Vector3;
}

export interface RigidBodyRef {
    current: ExtendedRigidBody | null;
}

export interface ThemeConfig {
    colors: {
        accent: string;
        elevation1: string;
    };
}

export interface BandProps {
    maxSpeed?: number;
    minSpeed?: number;
}
