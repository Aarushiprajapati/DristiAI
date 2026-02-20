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

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
            <AuthStack.Screen name="Auth" component={AuthScreen} />
        </AuthStack.Navigator>
    );
}

function MainNavigator() {
    return (
        <AppStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: '#0a0a1a' },
            }}
        >
            <AppStack.Screen name="Home" component={HomeScreen} />
            <AppStack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ animation: 'slide_from_bottom' }}
            />
            <AppStack.Screen
                name="Navigation"
                component={NavigationScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <AppStack.Screen
                name="SOS"
                component={SOSScreen}
                options={{ animation: 'slide_from_bottom' }}
            />
            <AppStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ animation: 'slide_from_right' }}
            />
        </AppStack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useApp();

    // Show SplashScreen while loading (checking auth state)
    if (isLoading) {
        return (
            <NavigationContainer>
                <RootStack.Navigator screenOptions={{ headerShown: false }}>
                    <RootStack.Screen name="Splash" component={SplashScreen} />
                </RootStack.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <RootStack.Screen name="Main" component={MainNavigator} />
                ) : (
                    <RootStack.Screen name="AuthFlow" component={AuthNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
