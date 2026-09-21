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
uniform float uDarkContour;
uniform sampler2D uBgTex;
uniform float uBgAspect;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s * s * s * s, 0.25);
}

vec3 sampleBg(vec2 screenUV) {
  float screenAspect = uResolution.x / uResolution.y;
  vec2 uv = screenUV;
  if (uBgAspect > screenAspect) {
    float s = screenAspect / uBgAspect;
    uv.x = uv.x * s + (1.0 - s) * 0.5;
  } else {
    float s = uBgAspect / screenAspect;
    uv.y = uv.y * s + (1.0 - s) * 0.5;
  }
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, uv).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  vec2 o[16];
  o[0] = vec2(-0.942, -0.399); o[1] = vec2(0.946, -0.769);
  o[2] = vec2(-0.094, -0.929);  o[3] = vec2(0.345, 0.294);
  o[4] = vec2(-0.916, -0.458);  o[5] = vec2(-0.815, 0.486);
  o[6] = vec2(-0.383, -0.561);  o[7] = vec2(-0.127, 0.846);
  o[8] = vec2(0.896, 0.413);    o[9] = vec2(0.182, -0.300);
  o[10] = vec2(-0.014, -0.160); o[11] = vec2(0.596, 0.711);
  o[12] = vec2(0.497, -0.473);  o[13] = vec2(0.807, 0.046);
  o[14] = vec2(-0.325, -0.040); o[15] = vec2(-0.610, 0.066);

  for (int i = 0; i < 16; i++) {
    sum += sampleBg(uv + o[i] * radius * px);
  }
  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;

  float safeRadius = min(uRadius, min(halfSize.x, halfSize.y) - 1.0);
  safeRadius = max(safeRadius, 0.0);

  float sd = sdRoundedRect(p, halfSize, safeRadius);

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 350.0);
    gl_FragColor = vec4(0.0, 0.0, 0.0, uShadow * shadowFalloff * 0.25);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(safeRadius, min(halfSize.x, halfSize.y)) - 1.0);
  bezel = max(bezel, 1.0);

  float t = clamp(distFromEdge / bezel, 0.0, 1.0);
  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  float slopeAngle = atan(dh * (uThickness / bezel));
  float sinR = clamp(sin(slopeAngle) / uIOR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, safeRadius) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, safeRadius) - sd;
  grad = normalize(grad);

  vec2 offset = -grad * displacement / uResolution;
  vec2 screenUV = screenPx / uResolution;

  vec3 color = sampleBgBlurred(screenUV + offset, uBlur);
  float edgeLine = 1.0 - smoothstep(0.0, 1.2, distFromEdge);

  if (uDarkContour > 0.5) {
    // Темная капля: затемняем края
    color = mix(color, vec3(0.0), edgeLine * 0.15);
  } else {
    // Светлое стекло (таббар/кнопка)
    vec2 lightDir = normalize(vec2(0.5, -0.7));
    float rimDot = abs(dot(grad, lightDir));
    float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
    float specHighlight = pow(rimDot * rimFalloff, 1.5);
    
    color += vec3(specHighlight * uSpecular * uRimGlow);
    color += vec3(edgeLine * uSpecular * 0.45);
    
    float innerRim = smoothstep(0.3, 1.2, distFromEdge) * (1.0 - smoothstep(1.2, 2.0, distFromEdge));
    color += vec3(innerRim * 0.08 * uSpecular);
  }

  color = mix(color, vec3(1.0), uTint);
  float alpha = smoothstep(0.0, 1.0, distFromEdge);

  // ГЕНИАЛЬНЫЙ ТРЮК: Делаем центр капли прозрачным, чтобы HTML-иконки просвечивали!
  // Оставляем только края, которые преломляют всё под собой.
  if (uDarkContour > 0.5) {
    float centerFade = 1.0 - smoothstep(bezel * 0.2, bezel * 1.0, distFromEdge);
    alpha *= centerFade;
  }

  gl_FragColor = vec4(color, alpha);
}
`;

interface GlassProps {
  radius?: number;
  noShadow?: boolean;
  variant?: 'light' | 'dark';
}

export const Glass: React.FC<GlassProps> = ({ radius = 33, noShadow = false, variant = 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const margin = noShadow ? 0 : 20;

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

    const defaultTexture = new THREE.DataTexture(
      new Uint8Array([245, 245, 247, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    defaultTexture.needsUpdate = true;

    const scale = Math.min(baseW, baseH) / 280;
    const scaledBezel = Math.max(6.0, 42.0 * scale);
    const scaledThickness = Math.max(8.0, 44.0 * scale);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(totalW, totalH) },
      uGlassCenter: { value: new THREE.Vector2(totalW / 2, totalH / 2) },
      uGlassSize: { value: new THREE.Vector2(baseW, baseH) },
      uRadius: { value: radius },
      uBezel: { value: scaledBezel },
      uThickness: { value: scaledThickness },
      uIOR: { value: 2.7 },
      uBlur: { value: 2.0 },
      uSpecular: { value: 0.52 },
      uRimGlow: { value: 0.03 },
      uTint: { value: 0.07 },
      uShadow: { value: noShadow ? 0.0 : 0.06 },
      uDarkContour: { value: variant === 'dark' ? 1.0 : 0.0 },
      uBgTex: { value: defaultTexture },
      uBgAspect: { value: 1.0 },
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
          uniforms.uGlassCenter.value.set(totalW / 2, totalH / 2);
          uniforms.uGlassSize.value.set(baseW, baseH);

          const curScale = Math.min(baseW, baseH) / 280;
          uniforms.uBezel.value = Math.max(6.0, 42.0 * curScale);
          uniforms.uThickness.value = Math.max(8.0, 44.0 * curScale);
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
      defaultTexture.dispose();
    };
  }, [radius, noShadow, variant]);

  const margin = noShadow ? 0 : 20;

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
