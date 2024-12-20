import { css } from "@emotion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const FILTER_MAPPINGS: Record<string, (x: number) => string> = {
  brightness: (x) => `${x + 100}%`,
  contrast: (x) => `${x + 100}%`,
  saturate: (x) => `${x + 100}%`,
};

function addFilenameSuffix(filename: string, suffix: string) {
  const extIndex = filename.lastIndexOf(".");
  const ext = extIndex === -1 ? "" : filename.slice(extIndex);
  return filename.slice(0, extIndex) + suffix + ext;
}

function generateSvgFilter({
  transfer,
}: {
  transfer: { r: number[]; g: number[]; b: number[]; a: number[] };
}) {
  const { r, g, b, a } = transfer;

  const svg = `\
<svg
version="1.1"
xmlns="http://www.w3.org/2000/svg"
xmlns:xlink="http://www.w3.org/1999/xlink"
>
<defs>
<filter id="curve">
  <feComponentTransfer>
    <feFuncR type="table" tableValues="${r.join(" ")}"></feFuncR>
    <feFuncG type="table" tableValues="${g.join(" ")}"></feFuncG>
    <feFuncB type="table" tableValues="${b.join(" ")}"></feFuncB>
    <feFuncA type="table" tableValues="${a.join(" ")}"></feFuncA>
  </feComponentTransfer>
</filter>
</defs>
</svg>`;
  const svgUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return `url(${svgUrl}#curve)`;
}

void generateSvgFilter;

function Editor({
  image,
  onBack,
}: {
  image?: HTMLImageElement;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filters, setFilters] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState("brightness");
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSave = useCallback(() => {
    if (!image) return;
    const link = document.createElement("a");
    link.download = image.alt
      ? addFilenameSuffix(image.alt, "-edited")
      : "image.jpeg";
    link.href = canvasRef.current!.toDataURL("image/jpeg");
    link.click();
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx || !image) return;
    canvasRef.current!.width = image.width;
    canvasRef.current!.height = image.height;
  }, [image]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx || !image) return;
    ctx.filter = showOriginal
      ? "none"
      : Object.entries(filters)
          .map(([key, value]) => `${key}(${FILTER_MAPPINGS[key](value)})`)
          .join(" ");
    ctx.clearRect(0, 0, image.width, image.height);
    ctx.drawImage(image, 0, 0);
  }, [image, showOriginal, filters]);

  return (
    <div
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        css={css`
          display: flex;
          & > button {
            background-color: transparent;
            min-width: 48px;
            min-height: 40px;
            text-align: center;
          }
          & > button:hover {
            background-color: rgba(255, 255, 255, 0.15);
          }
        `}
      >
        <button onClick={onBack}>返回</button>
        <div
          css={css`
            flex-grow: 1;
          `}
        ></div>
        <button onClick={handleSave}>保存</button>
      </div>
      <div
        css={css`
          height: 100%;
          display: flex;
          flex-direction: column;
          @media (min-width: 800px) {
            flex-direction: row;
          }
        `}
      >
        <div
          css={css`
            flex-grow: 1;
          `}
          onPointerDown={() => setShowOriginal(true)}
          onPointerUp={() => setShowOriginal(false)}
        >
          <canvas
            css={css`
              width: 100%;
              height: 100%;
              object-fit: contain;
            `}
            ref={canvasRef}
            width={800}
            height={600}
          />
        </div>
        <div
          css={css`
            align-items: center;
            overflow: auto;
            padding: 8px;
          `}
        >
          <div
            css={css`
              padding: 16px;
              display: flex;
              justify-content: center;
              gap: 8px;
            `}
          >
            <input
              type="range"
              min={-100}
              max={100}
              value={filters[activeFilter] ?? 0}
              onChange={(event) =>
                setFilters((filters) => ({
                  ...filters,
                  [activeFilter]: Number(event.target.value),
                }))
              }
            />
            <span
              css={css`
                display: inline-block;
                width: 40px;
              `}
            >
              {filters[activeFilter] ?? 0}
            </span>
          </div>
          <div
            css={css`
              display: flex;
              gap: 8px;
              align-items: center;
              padding: 16px 0;
              @media (min-width: 800px) {
                flex-direction: column;
              }
              & > button {
                width: 64px;
                height: 64px;
                display: flex;
                padding: 0;
                justify-content: center;
                align-items: center;
                font-size: 14px;
                transition: transform 0.2s;
              }
              & > button:active {
                transform: scale(0.97);
              }
              & > button.active {
                background-color: #f0f0f0;
                color: black;
              }
            `}
          >
            <button
              onClick={() => setActiveFilter("brightness")}
              className={activeFilter === "brightness" ? "active" : ""}
            >
              亮度
            </button>
            <button
              className={activeFilter === "contrast" ? "active" : ""}
              onClick={() => setActiveFilter("contrast")}
            >
              对比度
            </button>
            <button
              className={activeFilter === "saturate" ? "active" : ""}
              onClick={() => setActiveFilter("saturate")}
            >
              饱和度
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
