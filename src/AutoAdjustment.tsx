import { css } from "@emotion/react";
import { useEffect, useRef } from "react";

function AutoAdjustment({
  inputRef,
  open,
  onClose,
}: {
  inputRef: React.RefObject<HTMLCanvasElement>;
  open: boolean;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (open) {
      dialogRef.current.showModal();
      const canvas = canvasRef.current;
      const input = inputRef.current;
      if (!canvas || !input) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = input.width;
      canvas.height = input.height;
      ctx.drawImage(input, 0, 0);
    } else {
      dialogRef.current.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      css={css`
        max-width: 100%;
        max-height: 100%;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
      `}
    >
      <div
        css={css`
          position: relative;
          background-color: black;
          width: 100%;
          height: 100%;
        `}
      >
        <button
          css={css`
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: 9999px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
          `}
          onClick={onClose}
        >
          <span>×</span>
        </button>
        <canvas
          ref={canvasRef}
          css={css`
            width: 100%;
            height: 100%;
            object-fit: contain;
          `}
        ></canvas>
      </div>
    </dialog>
  );
}

export default AutoAdjustment;
