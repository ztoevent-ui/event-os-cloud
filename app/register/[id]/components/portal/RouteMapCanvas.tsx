'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapPin = {
    code: string;
    name: string;
    landmark?: string;
    km: number;
    lat: number;
    lng: number;
    isTurnaround?: boolean;
    returnKm?: number;
    supplies?: string[];
};

type Props = {
    polyline: [number, number][];
    startPoint?: { lat: number; lng: number; name?: string; landmark?: string };
    endPoint?: { lat: number; lng: number; name?: string; landmark?: string };
    pins: MapPin[];
    focusedCode: string | null;
    onSelectCode: (code: string | null) => void;
    accentColor: string;
    mapStyle: 'street' | 'satellite';
    fitSignal?: number;
};

const STREET_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const SAT_IMAGERY_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ROADS_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';
const SAT_LABELS_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

function escapeHtml(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export default function RouteMapCanvas({
    polyline,
    startPoint,
    endPoint,
    pins,
    focusedCode,
    onSelectCode,
    accentColor,
    mapStyle,
    fitSignal = 0,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const tileGroupRef = useRef<L.LayerGroup | null>(null);
    const routeGroupRef = useRef<L.LayerGroup | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const lastFitKeyRef = useRef<string>('');

    // Initialize Leaflet map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const el = containerRef.current;
        const map = L.map(el, {
            center: startPoint ? [startPoint.lat, startPoint.lng] : [3.205, 113.055],
            zoom: 12,
            scrollWheelZoom: false,
            attributionControl: true,
        });

        map.attributionControl.setPrefix(false);
        const tileGroup = L.layerGroup().addTo(map);
        const routeGroup = L.layerGroup().addTo(map);

        mapRef.current = map;
        tileGroupRef.current = tileGroup;
        routeGroupRef.current = routeGroup;

        const ro = new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
        });
        ro.observe(el);

        return () => {
            ro.disconnect();
            map.remove();
            mapRef.current = null;
            tileGroupRef.current = null;
            routeGroupRef.current = null;
            markersRef.current.clear();
        };
    }, []);

    // Switch street vs satellite hybrid tiles
    useEffect(() => {
        const tg = tileGroupRef.current;
        if (!tg) return;
        tg.clearLayers();

        if (mapStyle === 'satellite') {
            L.tileLayer(SAT_IMAGERY_TILE, {
                maxZoom: 18,
                attribution: 'Imagery © Esri',
            }).addTo(tg);
            L.tileLayer(SAT_ROADS_TILE, { maxZoom: 18, opacity: 0.78 }).addTo(tg);
            L.tileLayer(SAT_LABELS_TILE, { maxZoom: 18, opacity: 0.9 }).addTo(tg);
        } else {
            L.tileLayer(STREET_TILE, {
                maxZoom: 19,
                attribution: 'Map © Esri · OpenStreetMap contributors',
            }).addTo(tg);
        }
    }, [mapStyle]);

    // Render polyline + Start/Finish + Station markers cleanly
    useEffect(() => {
        const map = mapRef.current;
        const rg = routeGroupRef.current;
        if (!map || !rg) return;

        rg.clearLayers();
        markersRef.current.clear();

        const validPts: [number, number][] =
            polyline.length >= 2
                ? polyline
                : [
                      ...(startPoint ? [[startPoint.lat, startPoint.lng] as [number, number]] : []),
                      ...pins.map(p => [p.lat, p.lng] as [number, number]),
                      ...(endPoint ? [[endPoint.lat, endPoint.lng] as [number, number]] : []),
                  ];

        if (validPts.length >= 2) {
            // Soft outer glow + crisp inner course line
            L.polyline(validPts, {
                color: '#000000',
                weight: 9,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(rg);

            L.polyline(validPts, {
                color: accentColor,
                weight: 5,
                opacity: 0.96,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(rg);
        }

        const separateEndpoints =
            !!endPoint &&
            (!startPoint || Math.abs(endPoint.lat - startPoint.lat) > 0.0002 || Math.abs(endPoint.lng - startPoint.lng) > 0.0002);

        // Start marker (or merged Start / Finish)
        if (startPoint) {
            const isActive = focusedCode === 'START';
            const badgeText = separateEndpoints ? 'START · 5:30 PM' : 'START / FINISH';
            const badgeBg = separateEndpoints ? '#10b981' : '#f43f5e';
            const icon = L.divIcon({
                className: 'zto-map-pin',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
                html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
                    <div style="background:${badgeBg};color:#fff;font-size:10px;font-weight:900;letter-spacing:0.06em;padding:3px 9px;border-radius:999px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;${isActive ? 'transform:scale(1.12);' : ''}">${badgeText}</div>
                </div>`,
            });
            const m = L.marker([startPoint.lat, startPoint.lng], { icon, zIndexOffset: 600 }).addTo(rg);
            m.bindPopup(
                `<div style="font-family:sans-serif;min-width:170px;">
                    <div style="font-size:10px;font-weight:800;color:${separateEndpoints ? '#059669' : '#e11d48'};text-transform:uppercase;letter-spacing:0.08em;">${separateEndpoints ? 'Assembly & Start · 0.0 KM' : 'Race Village · 0.0 KM'}</div>
                    <div style="font-size:13px;font-weight:800;color:#111827;margin-top:2px;">${escapeHtml(startPoint.name || 'Start Line')}</div>
                    ${startPoint.landmark ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${escapeHtml(startPoint.landmark)}</div>` : ''}
                </div>`
            );
            m.on('click', () => onSelectCode(focusedCode === 'START' ? null : 'START'));
            markersRef.current.set('START', m);
        }

        // Separate Finish marker (for point-to-point routes/parades)
        if (separateEndpoints && endPoint) {
            const isActive = focusedCode === 'FINISH';
            const icon = L.divIcon({
                className: 'zto-map-pin',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
                html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
                    <div style="background:#f43f5e;color:#fff;font-size:10px;font-weight:900;letter-spacing:0.06em;padding:3px 9px;border-radius:999px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;${isActive ? 'transform:scale(1.12);' : ''}">FINISH · END POINT</div>
                </div>`,
            });
            const m = L.marker([endPoint.lat, endPoint.lng], { icon, zIndexOffset: 610 }).addTo(rg);
            m.bindPopup(
                `<div style="font-family:sans-serif;min-width:170px;">
                    <div style="font-size:10px;font-weight:800;color:#e11d48;text-transform:uppercase;letter-spacing:0.08em;">Finish & Finale Point</div>
                    <div style="font-size:13px;font-weight:800;color:#111827;margin-top:2px;">${escapeHtml(endPoint.name || 'Finish Line')}</div>
                    ${endPoint.landmark ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${escapeHtml(endPoint.landmark)}</div>` : ''}
                </div>`
            );
            m.on('click', () => onSelectCode(focusedCode === 'FINISH' ? null : 'FINISH'));
            markersRef.current.set('FINISH', m);
        }

        // Aid stations & checkpoint markers
        pins.forEach(p => {
            const isActive = focusedCode === p.code;
            const bg = p.isTurnaround ? '#f59e0b' : accentColor;
            const numLabel = p.code.replace(/^(WS|CP|P)/i, '');
            const tag = p.isTurnaround ? `U-TURN · ${p.km}KM` : `${p.code} · ${p.km}km`;

            const icon = L.divIcon({
                className: 'zto-map-pin',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
                html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
                    <span style="background:rgba(9,11,16,0.9);color:${p.isTurnaround ? '#fbbf24' : '#f4f4f5'};border:1px solid ${isActive ? '#fff' : bg};font-size:9px;font-weight:900;padding:1px 6px;border-radius:999px;margin-bottom:3px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${escapeHtml(tag)}</span>
                    <div style="width:${isActive ? 28 : 24}px;height:${isActive ? 28 : 24}px;border-radius:999px;background:${bg};color:#09090b;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.5);transition:transform 150ms;">${escapeHtml(numLabel)}</div>
                </div>`,
            });

            const m = L.marker([p.lat, p.lng], {
                icon,
                zIndexOffset: p.isTurnaround ? 550 : isActive ? 500 : 400,
            }).addTo(rg);

            const passText = p.returnKm
                ? `Outbound ${p.km} km · Return ${p.returnKm} km`
                : p.isTurnaround
                  ? `${p.km} km Turnaround Point`
                  : `${p.km} km`;

            m.bindPopup(
                `<div style="font-family:sans-serif;min-width:190px;">
                    <div style="font-size:10px;font-weight:800;color:${p.isTurnaround ? '#d97706' : '#0284c7'};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(p.code)} · ${escapeHtml(passText)}</div>
                    <div style="font-size:13px;font-weight:800;color:#111827;margin-top:2px;">${escapeHtml(p.name)}</div>
                    ${p.landmark ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${escapeHtml(p.landmark)}</div>` : ''}
                    ${p.supplies?.length ? `<div style="font-size:11px;color:#0f172a;margin-top:6px;padding-top:5px;border-top:1px solid #e5e7eb;"><b>Notes:</b> ${escapeHtml(p.supplies.join(' · '))}</div>` : ''}
                </div>`
            );
            m.on('click', () => onSelectCode(focusedCode === p.code ? null : p.code));
            markersRef.current.set(p.code, m);
        });

        // Fit full route when category switches or reset is requested
        const fitKey = `${validPts.length}-${validPts[0]?.join(',')}-${validPts[validPts.length - 1]?.join(',')}-${fitSignal}`;
        if (validPts.length >= 2 && lastFitKeyRef.current !== fitKey) {
            lastFitKeyRef.current = fitKey;
            const bounds = L.latLngBounds(validPts.map(pt => L.latLng(pt[0], pt[1])));
            if (startPoint) bounds.extend([startPoint.lat, startPoint.lng]);
            if (endPoint) bounds.extend([endPoint.lat, endPoint.lng]);
            pins.forEach(p => bounds.extend([p.lat, p.lng]));
            const fit = () => {
                if (!mapRef.current) return;
                mapRef.current.invalidateSize({ animate: false });
                mapRef.current.fitBounds(bounds, { padding: [52, 52], maxZoom: 16, animate: false });
            };
            fit();
            requestAnimationFrame(fit);
        }
    }, [polyline, startPoint, endPoint, pins, focusedCode, accentColor, fitSignal]);

    // Smoothly fly to focused station & open popup
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !focusedCode) return;
        const m = markersRef.current.get(focusedCode);
        if (!m) return;
        const pos = m.getLatLng();
        map.flyTo(pos, Math.max(map.getZoom(), 15), { duration: 0.55 });
        m.openPopup();
    }, [focusedCode]);

    return <div ref={containerRef} className="w-full h-full z-10" />;
}
