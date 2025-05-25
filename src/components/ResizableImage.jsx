import React, { useState, useRef, useEffect } from "react";

export function ResizableImage({ node, updateAttributes }) {
  const { src, width, height, alignment = "center" } = node.attrs;
  const [aspectRatio, setAspectRatio] = useState(1);
  const [size, setSize] = useState({
    width: width ? parseInt(width) : 300,
    height: height && height !== "auto" ? parseInt(height) : 300 / aspectRatio,
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
      if (!width || !height || height === "auto") {
        setSize({ width: 300, height: 300 / ratio });
      }
    };
  }, [src, width, height]);

  const onMouseMove = (e) => {
    if (!isResizing) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;
    if (newWidth < 50) newWidth = 50;
    const newHeight = newWidth / aspectRatio;

    setSize({ width: newWidth, height: newHeight });
  };

  const onMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      updateAttributes({
        width: `${size.width}px`,
        height: `${size.height}px`,
      });
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, size.width, size.height]);

  let justifyContent = "center";
  if (alignment === "left") justifyContent = "flex-start";
  if (alignment === "right") justifyContent = "flex-end";

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent,
        margin: "8px 0",
        position: "relative",
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: size.width,
          height: size.height,
          userSelect: "none",
          pointerEvents: isResizing ? "none" : "auto",
        }}
        draggable={false}
      />
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          backgroundColor: "blue",
          bottom: 0,
          right: 0,
          cursor: "nwse-resize",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
