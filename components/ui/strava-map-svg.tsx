'use client';

import * as React from 'react';
import { decodePolyline } from '@/lib/polyline';

interface StravaMapSVGProps {
  polyline: string;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export function StravaMapSVG({ polyline, className = '', strokeColor = '#f97316', strokeWidth = 3 }: StravaMapSVGProps) {
  const points = React.useMemo(() => {
    if (!polyline) return [];
    return decodePolyline(polyline);
  }, [polyline]);

  if (points.length === 0) return null;

  // Calculate bounding box
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  points.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const width = maxLng - minLng;
  const height = maxLat - minLat;

  // Add some padding
  const paddingLat = height * 0.1 || 0.001;
  const paddingLng = width * 0.1 || 0.001;

  minLat -= paddingLat;
  maxLat += paddingLat;
  minLng -= paddingLng;
  maxLng += paddingLng;

  const viewBoxWidth = maxLng - minLng;
  const viewBoxHeight = maxLat - minLat;

  // Strava polylines map [lat, lng]. In SVG, x is lng, y is lat (but inverted because SVG y goes down)
  const pathData = points
    .map(([lat, lng], index) => {
      const x = lng - minLng;
      const y = maxLat - lat; // invert y
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * (viewBoxWidth / 100)} // scale stroke width relative to viewBox
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      {/* Start Point (Green dot) */}
      <circle
        cx={points[0][1] - minLng}
        cy={maxLat - points[0][0]}
        r={(strokeWidth * 1.5) * (viewBoxWidth / 100)}
        fill="#22c55e"
      />
      {/* End Point (Red dot) */}
      <circle
        cx={points[points.length - 1][1] - minLng}
        cy={maxLat - points[points.length - 1][0]}
        r={(strokeWidth * 1.5) * (viewBoxWidth / 100)}
        fill="#ef4444"
      />
    </svg>
  );
}
