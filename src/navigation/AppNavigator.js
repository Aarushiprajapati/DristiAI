import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import NavigationScreen from '../screens/NavigationScreen';
import SOSScreen from '../screens/SOSScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, isLoading } = useApp();

    if (isLoading) return null; // AppContext loading persisted settings

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { backgroundColor: '#0a0a1a' },
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                    name="Camera"
                    component={CameraScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="Navigation"
                    component={NavigationScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="SOS"
                    component={SOSScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ animation: 'slide_from_right' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
