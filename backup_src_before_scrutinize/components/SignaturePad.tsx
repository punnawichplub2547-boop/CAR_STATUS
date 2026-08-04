import React, { useRef } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  error?: boolean;
  label?: string;
}

// Hand-drawn signature capture, matching the "ลงชื่อ" column on F-HR-002 / F-HR-014
export const SignaturePad: React.FC<SignaturePadProps> = ({
  onChange,
  error,
  label = 'ลงชื่อยืนยัน (วาดลายเซ็นในกรอบด้านล่าง)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const point = getPoint(e);
    const last = lastPointRef.current;
    if (last) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className="form-group" style={{ width: '100%', textAlign: 'left', margin: 0 }}>
      <label className="form-label">{label}</label>
      <canvas
        ref={canvasRef}
        width={280}
        height={100}
        style={{
          width: '100%',
          height: 100,
          background: '#fff',
          borderRadius: 8,
          border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
          touchAction: 'none',
          cursor: 'crosshair',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        {error ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>กรุณาวาดลายเซ็นก่อนบันทึก</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ใช้เมาส์หรือนิ้ววาดลายเซ็น</span>
        )}
        <button type="button" className="btn btn-sm btn-secondary" onClick={clear}>
          <Eraser size={13} /> ล้างลายเซ็น
        </button>
      </div>
    </div>
  );
};
