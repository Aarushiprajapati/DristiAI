import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Real-time Obstacle Detection Hook
 * 
 * Provides realistic real-time object detection simulation:
 * ─ Multiple simultaneous objects
 * ─ Distance-based severity classification
 * ─ Natural movement patterns (objects moving closer/further)
 * ─ Random spawn/despawn of objects
 * ─ Ready for TF.js COCO-SSD integration on real device
 * 
 * For production: Replace processFrame with actual ML model inference.
 */

// Object categories with realistic properties
const OBJECT_CATEGORIES = [
    { class: 'person', emoji: '🚶', minDist: 0.5, maxDist: 8, moveSpeed: 0.3, frequency: 0.35 },
    { class: 'bicycle', emoji: '🚲', minDist: 1, maxDist: 10, moveSpeed: 0.5, frequency: 0.15 },
    { class: 'car', emoji: '🚗', minDist: 2, maxDist: 15, moveSpeed: 1.2, frequency: 0.2 },
    { class: 'motorcycle', emoji: '🏍️', minDist: 1.5, maxDist: 12, moveSpeed: 0.8, frequency: 0.1 },
    { class: 'stairs', emoji: '🪜', minDist: 0.5, maxDist: 5, moveSpeed: 0, frequency: 0.1 },
    { class: 'pothole', emoji: '🕳️', minDist: 0.3, maxDist: 4, moveSpeed: 0, frequency: 0.08 },
    { class: 'dog', emoji: '🐕', minDist: 0.5, maxDist: 6, moveSpeed: 0.4, frequency: 0.08 },
    { class: 'traffic cone', emoji: '🔶', minDist: 0.5, maxDist: 5, moveSpeed: 0, frequency: 0.05 },
    { class: 'bench', emoji: '🪑', minDist: 0.5, maxDist: 5, moveSpeed: 0, frequency: 0.04 },
    { class: 'pole', emoji: '🔩', minDist: 0.3, maxDist: 3, moveSpeed: 0, frequency: 0.06 },
    { class: 'auto rickshaw', emoji: '🛺', minDist: 1, maxDist: 10, moveSpeed: 0.6, frequency: 0.08 },
    { class: 'speed breaker', emoji: '⚠️', minDist: 0.5, maxDist: 5, moveSpeed: 0, frequency: 0.05 },
];

// Generate a random bounding box
const randomBBox = () => {
    const x = Math.random() * 250 + 20;
    const y = Math.random() * 300 + 80;
    const w = Math.random() * 120 + 60;
    const h = Math.random() * 150 + 80;
    return [x, y, w, h];
};

// Generate a unique ID
let idCounter = 0;
const uid = () => `det_${++idCounter}_${Date.now()}`;

export const useObstacleDetection = () => {
    const { sensitivity, isDemoMode } = useApp();
    const [detections, setDetections] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState({ totalDetected: 0, dangerAlerts: 0, sessionStart: null });
    const timerRef = useRef(null);
    const activeObjectsRef = useRef([]);
    const confidenceThreshold = 0.3 + sensitivity * 0.4; // maps 0–1 sensitivity → 0.3–0.7
    const frameCountRef = useRef(0);

    /**
     * Spawn a new random detection object
     */
    const spawnObject = useCallback(() => {
        const category = OBJECT_CATEGORIES[Math.floor(Math.random() * OBJECT_CATEGORIES.length)];
        const distance = category.minDist + Math.random() * (category.maxDist - category.minDist);
        const score = 0.6 + Math.random() * 0.35; // 0.60 - 0.95

        return {
            id: uid(),
            class: category.class,
            emoji: category.emoji,
            score,
            distanceM: parseFloat(distance.toFixed(1)),
            bbox: randomBBox(),
            moveSpeed: category.moveSpeed,
            direction: Math.random() > 0.5 ? -1 : 1, // approaching or retreating
            lifetime: 0,
            maxLifetime: 3 + Math.floor(Math.random() * 8), // 3-10 update cycles
        };
    }, []);

    /**
     * Update existing objects — simulate real-time movement
     */
    const updateObjects = useCallback(() => {
        frameCountRef.current += 1;
        const frame = frameCountRef.current;

        let objects = [...activeObjectsRef.current];

        // Update positions of existing objects
        objects = objects.map(obj => {
            const newDist = Math.max(
                0.3,
                obj.distanceM + (obj.direction * obj.moveSpeed * (0.5 + Math.random()))
            );
            // Slight score fluctuation (simulates real ML model)
            const newScore = Math.min(0.99, Math.max(0.4, obj.score + (Math.random() - 0.5) * 0.08));
            // Slight bbox jitter
            const bbox = obj.bbox.map((v, i) => v + (Math.random() - 0.5) * (i < 2 ? 4 : 2));

            return {
                ...obj,
                distanceM: parseFloat(newDist.toFixed(1)),
                score: parseFloat(newScore.toFixed(2)),
                bbox,
                lifetime: obj.lifetime + 1,
            };
        });

        // Remove objects that have expired or gone too far
        objects = objects.filter(obj => obj.lifetime < obj.maxLifetime && obj.distanceM < 15);

        // Randomly spawn new objects (1-3 spawn attempts per frame)
        const spawnChance = 0.4 + sensitivity * 0.3;
        if (objects.length < 4 && Math.random() < spawnChance) {
            objects.push(spawnObject());
        }
        // Occasionally spawn a second object
        if (objects.length < 2 && Math.random() < 0.25) {
            objects.push(spawnObject());
        }

        activeObjectsRef.current = objects;

        // Filter by confidence threshold
        const filtered = objects.filter(d => d.score >= confidenceThreshold);

        // Sort by distance (closest first = most urgent)
        filtered.sort((a, b) => a.distanceM - b.distanceM);

        // Update stats
        const dangerCount = filtered.filter(d => d.distanceM < 2).length;
        setStats(prev => ({
            ...prev,
            totalDetected: prev.totalDetected + filtered.length,
            dangerAlerts: prev.dangerAlerts + dangerCount,
        }));

        setDetections(filtered);
    }, [confidenceThreshold, sensitivity, spawnObject]);

    /**
     * Start real-time detection loop
     */
    const start = useCallback(() => {
        setIsRunning(true);
        frameCountRef.current = 0;
        activeObjectsRef.current = [];
        setStats({ totalDetected: 0, dangerAlerts: 0, sessionStart: Date.now() });

        // Initial spawn
        activeObjectsRef.current = [spawnObject()];

        // Run at ~2 FPS simulation (500ms interval)
        timerRef.current = setInterval(() => {
            updateObjects();
        }, 800);
    }, [spawnObject, updateObjects]);

    /**
     * Stop detection
     */
    const stop = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRunning(false);
        setDetections([]);
        activeObjectsRef.current = [];
    }, []);

    /**
     * Process a real camera frame (for production use with TF.js)
     * This would run the ML model on the frame data.
     */
    const processFrame = useCallback(async (frameData) => {
        // Production implementation:
        // const model = await cocoSsd.load();
        // const predictions = await model.detect(frameData);
        // setDetections(predictions.map(p => ({
        //     class: p.class,
        //     score: p.score,
        //     distanceM: estimateDistance(p.bbox),
        //     bbox: p.bbox,
        // })));
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Severity: danger if < 2m, warning if < 4m, safe otherwise
    const getSeverity = (distanceM) => {
        if (distanceM < 2) return 'danger';
        if (distanceM < 4) return 'warning';
        return 'safe';
    };

    const enrichedDetections = detections.map(d => ({
        ...d,
        severity: getSeverity(d.distanceM),
    }));

    return {
        detections: enrichedDetections,
        isRunning,
        start,
        stop,
        processFrame,
        stats,
    };
};
