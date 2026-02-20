import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchRef = useRef(null);

    const requestPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Location permission denied');
            return false;
        }
        return true;
    };

    const getCurrentLocation = async () => {
        const ok = await requestPermissions();
        if (!ok) return null;
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(loc.coords);
            return loc.coords;
        } catch (e) {
            setErrorMsg('Could not get location');
            return null;
        }
    };

    const startTracking = async () => {
        const ok = await requestPermissions();
        if (!ok) return;
        setIsTracking(true);
        watchRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
            (loc) => setLocation(loc.coords)
        );
    };

    const stopTracking = () => {
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }
        setIsTracking(false);
    };

    useEffect(() => {
        return () => stopTracking();
    }, []);

    return { location, errorMsg, isTracking, getCurrentLocation, startTracking, stopTracking };
};
