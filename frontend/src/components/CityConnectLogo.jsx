import React from 'react';

export default function CityConnectLogo({ className = "w-8 h-8" }) {
  return (
    <img 
      src="/cityconnect-logo.svg" 
      alt="CityConnectAI Logo" 
      className={`${className} object-contain shrink-0`}
    />
  );
}
