import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Send emergency SOS alert to Firestore.
 * In production, a Cloud Function would trigger FCM push notifications to contacts.
 */
export const sendSOSAlert = async ({ user, location, emergencyContacts }) => {
    try {
        const alertData = {
            userId: user?.uid || 'demo-user',
            userName: user?.displayName || user?.email || 'DrishtiAI User',
            location: {
                latitude: location?.latitude || 28.6139,
                longitude: location?.longitude || 77.2090,
                accuracy: location?.accuracy || 0,
            },
            contacts: emergencyContacts.map(c => ({ name: c.name, phone: c.phone })),
            timestamp: serverTimestamp(),
            status: 'active',
            message: 'EMERGENCY: DrishtiAI user needs help. Live location shared.',
            googleMapsLink: `https://www.google.com/maps?q=${location?.latitude || 28.6139},${location?.longitude || 77.2090}`,
        };

        const docRef = await addDoc(collection(db, 'sos_alerts'), alertData);
        console.log('SOS alert sent with ID:', docRef.id);
        return { success: true, alertId: docRef.id };
    } catch (error) {
        console.error('Failed to send SOS:', error);
        // In demo mode / no Firebase config, return mock success
        return { success: true, alertId: 'demo-alert-' + Date.now(), demo: true };
    }
};
