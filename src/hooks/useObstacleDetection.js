import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

// ─── Demo detections for simulator/no-camera mode ───────────────────────────
const DEMO_DETECTIONS = [
    { class: 'person', score: 0.92, distanceM: 2.5, bbox: [60, 80, 180, 320] },
    { class: 'bicycle', score: 0.85, distanceM: 3.8, bbox: [200, 150, 260, 280] },
    { class: 'car', score: 0.91, distanceM: 6.0, bbox: [10, 200, 300, 200] },
    { class: 'stairs', score: 0.78, distanceM: 1.5, bbox: [50, 350, 280, 150] },
    { class: 'drain cover', score: 0.72, distanceM: 1.0, bbox: [90, 400, 140, 80] },
];

// Estimate distance from bounding box height (rough heuristic)
const estimateDistance = (bbox, frameHeight = 720) => {
    const boxHeight = bbox[3];
    // Taller box = closer object
    const ratio = boxHeight / frameHeight;
    const distance = Math.max(0.5, (1 - ratio) * 8).toFixed(1);
    return parseFloat(distance);
};

export const useObstacleDetection = () => {
    const { sensitivity, isDemoMode } = useApp();
    const [detections, setDetections] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [demoIndex, setDemoIndex] = useState(0);
    const demoTimerRef = useRef(null);
    const confidenceThreshold = 0.3 + sensitivity * 0.4; // maps 0–1 sensitivity → 0.3–0.7

    // ── Demo mode: cycle through fake detections ─────────────────────────────
    const startDemoMode = useCallback(() => {
        setIsRunning(true);
        demoTimerRef.current = setInterval(() => {
            setDemoIndex(i => {
                const next = (i + 1) % DEMO_DETECTIONS.length;
                const det = DEMO_DETECTIONS[next];
                if (det.score >= confidenceThreshold) {
                    setDetections([{ ...det, distanceM: det.distanceM }]);
                } else {
                    setDetections([]);
                }
                return next;
            });
        }, 2500);
    }, [confidenceThreshold]);

    const stopDemoMode = useCallback(() => {
        if (demoTimerRef.current) {
            clearInterval(demoTimerRef.current);
            demoTimerRef.current = null;
        }
        setIsRunning(false);
        setDetections([]);
    }, []);

    // ── Real-device frame processing ─────────────────────────────────────────
    // Called by CameraScreen with each camera frame
    const processFrame = useCallback(async (frameData) => {
        // In a real implementation, run TF.js COCO-SSD here:
        // const model = await cocoSsd.load();
        // const predictions = await model.detect(frameData);
        // For now, this hook operates in demo mode by default.
        // Frame data processing is a no-op here — demo mode handles output.
    }, []);

    const start = useCallback(() => {
        // Always use demo mode (TF.js web models don't yet work in Expo Go native)
        startDemoMode();
    }, [startDemoMode]);

    const stop = useCallback(() => {
        stopDemoMode();
    }, [stopDemoMode]);

    // Clean up on unmount
    useEffect(() => {
        return () => stopDemoMode();
    }, [stopDemoMode]);

    // Filter by confidence
    const filteredDetections = detections.filter(d => d.score >= confidenceThreshold);

    // Severity: danger if < 2m, warning if < 4m, safe otherwise
    const getSeverity = (distanceM) => {
        if (distanceM < 2) return 'danger';
        if (distanceM < 4) return 'warning';
        return 'safe';
    };

    const enrichedDetections = filteredDetections.map(d => ({
        ...d,
        severity: getSeverity(d.distanceM),
    }));

    return {
        detections: enrichedDetections,
        isRunning,
        start,
        stop,
        processFrame,
    };
};
