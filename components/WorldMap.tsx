"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

interface WorldMapProps {
    onRegionSelect: (region: string) => void;
    selectedRegion?: string;
}

// Comprehensive Mapping based on User Logic
// Priority: India DEVP > PREM > TIER2 > SEA > DEVP
export const COUNTRY_TIERS: Record<string, string> = {
    // India
    "IND": "India DEVP",

    // PREM (Tier-1)
    "USA": "PREM", "CAN": "PREM", "GBR": "PREM", "DEU": "PREM", "FRA": "PREM",
    "NLD": "PREM", "SWE": "PREM", "NOR": "PREM", "DNK": "PREM", "FIN": "PREM",
    "CHE": "PREM", "AUT": "PREM", "AUS": "PREM", "NZL": "PREM", "JPN": "PREM",
    "KOR": "PREM", "SGP": "PREM", "BEL": "PREM", "IRL": "PREM",

    // TIER2
    "ESP": "TIER2", "ITA": "TIER2", "PRT": "TIER2", "GRC": "TIER2", "POL": "TIER2",
    "CZE": "TIER2", "HUN": "TIER2", "ROU": "TIER2", "SVK": "TIER2", "SVN": "TIER2",
    "HRV": "TIER2", "LTU": "TIER2", "LVA": "TIER2", "EST": "TIER2", "ISR": "TIER2",

    // SEA (Excluding SGP which is PREM)
    "IDN": "SEA", "THA": "SEA", "VNM": "SEA", "PHL": "SEA", "MYS": "SEA",
    "KHM": "SEA", "LAO": "SEA", "MMR": "SEA",

    // DEVP (Rest)
    "TUR": "DEVP", "BRA": "DEVP", "MEX": "DEVP", "ARG": "DEVP", "COL": "DEVP",
    "CHL": "DEVP", "PER": "DEVP", "PAK": "DEVP", "BGD": "DEVP", "EGY": "DEVP",
    "MAR": "DEVP", "ZAF": "DEVP", "NGA": "DEVP", "KEN": "DEVP", "SAU": "DEVP",
    "ARE": "DEVP", "QAT": "DEVP"
};

import { NUMERIC_TO_ISO } from './isoMapping';

const geoUrl = "/world-110m.json";

export function WorldMap({ onRegionSelect, selectedRegion }: WorldMapProps) {
    const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
    const [scale, setScale] = useState(240);
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [geoData, setGeoData] = useState<any>(null);

    useEffect(() => {
        fetch(geoUrl)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load map data');
                return res.json();
            })
            .then(data => setGeoData(data))
            .catch(err => console.error("Map Load Error:", err));
    }, []);

    // Make the globe rotatable
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.buttons === 1) { // Left click held
            setRotation(prev => [
                prev[0] + event.movementX * 0.5,
                prev[1] - event.movementY * 0.5,
                prev[2]
            ]);
        }
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        // Prevent default window scroll if possible (though React synthetic event might not cancel window scroll easily without ref)
        // Simple zoom logic
        const newScale = scale - event.deltaY * 0.1;
        setScale(Math.max(100, Math.min(800, newScale))); // Clamp zoom
    };

    return (
        <div
            className="w-full aspect-video bg-[#131722] rounded-lg overflow-hidden border border-slate-800 relative cursor-move"
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
        >
            <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider">3D Globe Selector</h4>
                <p className="text-slate-400 text-xs mt-1">
                    {hoveredCountry ? hoveredCountry : (selectedRegion ? `Selected: ${selectedRegion}` : "Drag to rotate, Scroll to zoom, Click to select")}
                </p>
            </div>

            <ComposableMap projection="geoOrthographic" projectionConfig={{ scale: scale, rotate: rotation }}>
                <Sphere stroke="#374151" strokeWidth={0.5} id="sphere" fill="transparent" />
                <Graticule stroke="#374151" strokeWidth={0.5} />
                {geoData && (
                    <Geographies geography={geoData}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                // Default world-atlas uses M49 numeric codes (string or number)
                                // We convert "840" -> "USA"
                                const numericId = String(geo.id).padStart(3, '0');
                                const iso = NUMERIC_TO_ISO[numericId];

                                const isSelected = selectedRegion && iso ? selectedRegion === iso : false;
                                const isHovered = hoveredCountry === geo.properties.name;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            setHoveredCountry(geo.properties.name);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredCountry(null);
                                        }}
                                        onClick={() => {
                                            onRegionSelect(iso);
                                            console.log("Selected Country:", geo.properties.name, iso);
                                        }}
                                        style={{
                                            default: {
                                                fill: isSelected ? "#3b82f6" : "#1f2937",
                                                stroke: "#374151",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: "#60a5fa",
                                                stroke: "#60a5fa",
                                                strokeWidth: 0.75,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#2563eb",
                                                stroke: "#2563eb",
                                                strokeWidth: 1,
                                                outline: "none",
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                )}
            </ComposableMap>
        </div>
    );
}
