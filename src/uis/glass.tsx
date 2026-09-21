import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uGlassCenter;
uniform vec2 uGlassSize;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uRimGlow;
uniform float uTint;
uniform float uShadow;
uniform float uIsPill;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s * s * s * s, 0.25);
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;

  float safeRadius = min(uRadius, min(halfSize.x, halfSize.y) - 1.0);
  safeRadius = max(safeRadius, 0.0);

  float sd = sdRoundedRect(p, halfSize, safeRadius);

  if (sd > 0.0) {
    if (uIsPill > 0.5) {
      discard;
    }
    float shadowFalloff = exp(-sd * sd / 350.0);
    gl_FragColor = vec4(0.0, 0.0, 0.0, uShadow * shadowFalloff * 0.4);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(safeRadius, min(halfSize.x, halfSize.y)) - 1.0);
  bezel = max(bezel, 1.0);

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, safeRadius) - sdRoundedRect(p - vec2(eps, 0.0), halfSize, safeRadius);
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, safeRadius) - sdRoundedRect(p - vec2(0.0, eps), halfSize, safeRadius);
  
  float gradLen = length(grad);
  if (gradLen > 0.0001) {
    grad /= gradLen;
  } else {
    grad = vec2(0.0, 0.0);
  }

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.45, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);

  if (uIsPill > 0.5) {
    float edgeLinePill = 1.0 - smoothstep(0.0, 1.85, distFromEdge);
    float innerRim = smoothstep(0.35, 1.2, distFromEdge) * (1.0 - smoothstep(1.2, 2.1, distFromEdge));

    vec3 pillColor = vec3(0.0);
    pillColor = mix(pillColor, vec3(0.0), edgeLinePill * 0.42);
    pillColor += vec3(1.0) * (specHighlight * uSpecular + innerRim * 0.08);

    float pillAlpha = max(edgeLinePill * 0.55, specHighlight * uSpecular);
    pillAlpha = max(pillAlpha, innerRim * 0.25);

    gl_FragColor = vec4(pillColor, pillAlpha);
    return;
  }

  float edgeLine = 1.0 - smoothstep(0.0, 1.15, distFromEdge);
  float innerRim = smoothstep(0.35, 1.2, distFromEdge) * (1.0 - smoothstep(1.2, 2.1, distFromEdge));

  vec3 barColor = vec3(0.9608, 0.9608, 0.9686);
  barColor += vec3(specHighlight * uSpecular * uRimGlow);
  barColor += vec3(edgeLine * uSpecular * 0.34);
  barColor += vec3(innerRim * 0.055 * uSpecular);
  barColor = mix(barColor, vec3(1.0), uTint);

  float alpha = smoothstep(0.0, 1.5, distFromEdge);

  gl_FragColor = vec4(barColor, alpha);
}
`;

interface GlassProps {
  radius?: number;
  noShadow?: boolean;
  isPill?: boolean;
  centerRef?: React.MutableRefObject<{ x: number; y: number }>;
  sizeRef?: React.MutableRefObject<{ w: number; h: number }>;
}

export const Glass: React.FC<GlassProps> = ({
  radius = 33,
  noShadow = false,
  isPill = false,
  centerRef,
  sizeRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const margin = noShadow ? 30 : 20;

    let baseW = container.clientWidth || 1;
    let baseH = container.clientHeight || 1;
    let totalW = baseW + margin * 2;
    let totalH = baseH + margin * 2;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(totalW, totalH);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const initialCenter = centerRef?.current
      ? new THREE.Vector2(centerRef.current.x + margin, centerRef.current.y + margin)
      : new THREE.Vector2(totalW / 2, totalH / 2);

    const initialSize = sizeRef?.current
      ? new THREE.Vector2(sizeRef.current.w, sizeRef.current.h)
      : new THREE.Vector2(baseW, baseH);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(totalW, totalH) },
      uGlassCenter: { value: initialCenter },
      uGlassSize: { value: initialSize },
      uRadius: { value: radius },
      uThickness: { value: isPill ? 16.0 : 24.0 },
      uBezel: { value: isPill ? 14.0 : 20.0 },
      uIOR: { value: isPill ? 2.15 : 2.70 },
      uBlur: { value: isPill ? 1.0 : 2.0 },
      uSpecular: { value: 0.52 },
      uRimGlow: { value: 0.03 },
      uTint: { value: 0.07 },
      uShadow: { value: noShadow ? 0.0 : 0.08 },
      uIsPill: { value: isPill ? 1.0 : 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      uniforms,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let animationFrameId: number;

    const render = () => {
      if (container) {
        const curW = container.clientWidth;
        const curH = container.clientHeight;
        if (curW > 0 && curH > 0 && (curW !== baseW || curH !== baseH)) {
          baseW = curW;
          baseH = curH;
          totalW = baseW + margin * 2;
          totalH = baseH + margin * 2;
          renderer.setSize(totalW, totalH);
          uniforms.uResolution.value.set(totalW, totalH);
        }

        if (centerRef?.current) {
          uniforms.uGlassCenter.value.set(
            centerRef.current.x + margin,
            centerRef.current.y + margin
          );
        } else {
          uniforms.uGlassCenter.value.set(totalW / 2, totalH / 2);
        }

        if (sizeRef?.current) {
          uniforms.uGlassSize.value.set(sizeRef.current.w, sizeRef.current.h);
        } else {
          uniforms.uGlassSize.value.set(baseW, baseH);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      material.dispose();
    };
  }, [radius, noShadow, isPill, centerRef, sizeRef]);

  const margin = noShadow ? 30 : 20;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: -margin,
          left: -margin,
          width: `calc(100% + ${margin * 2}px)`,
          height: `calc(100% + ${margin * 2}px)`,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
