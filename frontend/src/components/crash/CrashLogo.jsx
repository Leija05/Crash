import React from 'react';

/**
 * C.R.A.S.H. Logo Component (SVG)
 * Collision Response & Analysis System for Helmets
 */
const CrashLogo = ({ 
  width = 200, 
  height = 200, 
  color = "#ef4444",
  className = "",
  showText = false 
}) => {
  const aspectRatio = 1;
  const viewBoxHeight = width / aspectRatio;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${viewBoxHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Outline */}
      <path
        d="M 100 20 
           L 180 20 
           C 185 20, 190 25, 190 30
           L 190 100
           C 190 120, 180 140, 165 160
           L 100 190
           L 35 160
           C 20 140, 10 120, 10 100
           L 10 30
           C 10 25, 15 20, 20 20
           Z"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
      />
      
      {/* Inner Shield Decoration */}
      <path
        d="M 100 25
           L 175 25
           C 178 25, 180 27, 180 30
           L 180 95
           C 180 115, 170 133, 158 148
           L 100 175
           L 42 148
           C 30 133, 20 115, 20 95
           L 20 30
           C 20 27, 22 25, 25 25
           Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Helmet Base */}
      <ellipse
        cx="100"
        cy="85"
        rx="45"
        ry="50"
        stroke={color}
        strokeWidth="3.5"
        fill="none"
      />
      
      {/* Helmet Top Curve */}
      <path
        d="M 60 70 Q 100 45, 140 70"
        stroke={color}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Helmet Visor Line */}
      <path
        d="M 70 95 L 130 95"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Helmet Chin Strap */}
      <path
        d="M 65 115 Q 100 120, 135 115"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Telemetry/Heartbeat Line */}
      <g>
        {/* Main heartbeat pattern */}
        <path
          d="M 40 100
             L 50 100
             L 55 85
             L 60 115
             L 65 90
             L 70 105
             L 75 100
             L 85 100
             L 90 95
             L 95 105
             L 100 100
             L 110 100
             L 115 110
             L 120 90
             L 125 105
             L 135 100
             L 145 98
             L 155 102
             L 165 100"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        
        {/* Extended line to the right */}
        <path
          d="M 165 100 L 180 100"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Accent dots for tech feel */}
      <circle cx="100" cy="60" r="2" fill={color} opacity="0.6" />
      <circle cx="85" cy="75" r="1.5" fill={color} opacity="0.5" />
      <circle cx="115" cy="75" r="1.5" fill={color} opacity="0.5" />

      {/* Optional Text */}
      {showText && (
        <g>
          <text
            x="100"
            y="210"
            textAnchor="middle"
            fill={color}
            fontSize="24"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="2"
          >
            C.R.A.S.H.
          </text>
          <text
            x="100"
            y="225"
            textAnchor="middle"
            fill={color}
            fontSize="8"
            fontWeight="700"
            fontFamily="sans-serif"
            letterSpacing="1.5"
            opacity="0.8"
          >
            RESPONSE & MONITORING SYSTEMS
          </text>
        </g>
      )}
    </svg>
  );
};

export default CrashLogo;
