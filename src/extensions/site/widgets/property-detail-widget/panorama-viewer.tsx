import { useEffect, useRef, useState, type FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ListingImage } from "../../../../lib/listing-types";
import styles from "./property-detail-widget.module.css";

export const PanoramaViewer: FC<{ images: ListingImage[]; title: string }> = ({ images, title }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const current = images[index];
  const imageUrl = current?.url ?? "";

  const urlsKey = images.map((image) => image.url).join("|");

  useEffect(() => {
    setIndex(0);
  }, [urlsKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageUrl) return;
    let disposed = false;
    let cleanup = () => undefined;
    void Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]).then(([THREE, controlsModule]) => {
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 0.01);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren();
      container.appendChild(renderer.domElement);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.minDistance = 0.01;
      controls.maxDistance = 0.1;

      const geometry = new THREE.SphereGeometry(10, 64, 32);
      const texture = new THREE.TextureLoader().load(imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      scene.add(new THREE.Mesh(geometry, material));

      const resize = () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      let animationFrame = 0;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(render);
      };
      animationFrame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        controls.dispose();
        geometry.dispose();
        texture.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch((error: unknown) => {
      console.error("Unable to load the 360° panorama viewer.", error);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [imageUrl]);

  if (!current) return null;

  const move = (delta: number) => {
    setIndex((value) => (value + delta + images.length) % images.length);
  };

  return (
    <div className={styles.panoramaLayout}>
      {images.length > 1 ? (
        <div className={styles.panoramaScenes} role="list" aria-label="360° scenes">
          {images.map((image, imageIndex) => (
            <button
              key={`${image.url}-${imageIndex}`}
              type="button"
              role="listitem"
              className={imageIndex === index ? styles.panoramaSceneActive : styles.panoramaScene}
              onClick={() => setIndex(imageIndex)}
              aria-pressed={imageIndex === index}
              aria-label={image.title ?? `Scene ${imageIndex + 1}`}
            >
              <img src={image.url} alt="" />
              <span>{image.title ?? `Scene ${imageIndex + 1}`}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.panoramaWrap}>
        <div
          ref={containerRef}
          className={styles.panorama}
          aria-label={`Interactive 360° panorama of ${current.title ?? title}`}
        />
        {images.length > 1 ? (
          <>
            <button className={`${styles.iconButton} ${styles.previous}`} type="button" onClick={() => move(-1)} aria-label="Previous 360° scene">
              <ChevronLeft />
            </button>
            <button className={`${styles.iconButton} ${styles.next}`} type="button" onClick={() => move(1)} aria-label="Next 360° scene">
              <ChevronRight />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
