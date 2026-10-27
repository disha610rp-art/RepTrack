import React from 'react';

export const BarbellGraphic = ({ platesPerSide = [], barWeight = 20, unit = 'kg' }) => {
  return (
    <div className="barbell-container">
      {/* Left Knurled Shaft */}
      <div className="barbell-shaft" title={`Barbell Shaft (${barWeight} ${unit})`} />

      {/* Inside Collar */}
      <div className="barbell-collar" title="Barbell Collar / Shoulder" />

      {/* Barbell Sleeve with Plates */}
      <div className="barbell-sleeve">
        {platesPerSide.length === 0 ? (
          <div
            style={{
              padding: '0 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
            }}
          >
            Empty Bar ({barWeight} {unit})
          </div>
        ) : (
          platesPerSide.map((plateGroup, idx) => {
            // Render each plate in this group
            return Array.from({ length: plateGroup.count }).map((_, pIdx) => (
              <div
                key={`${idx}-${pIdx}`}
                className="loaded-plate"
                style={{
                  backgroundColor: plateGroup.color,
                  color: plateGroup.textColor,
                  height: plateGroup.heightPx || 80,
                  width: plateGroup.widthPx || 16,
                }}
                title={`${plateGroup.weight} ${unit} Plate`}
              >
                <span
                  style={{
                    transform: 'rotate(-90deg)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {plateGroup.weight}
                </span>
              </div>
            ));
          })
        )}
      </div>
    </div>
  );
};
