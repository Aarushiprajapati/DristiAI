import 'react-native-gesture-handler';
import './src/i18n'; // Initialize i18n before anything else
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

// Simple error boundary to catch initialization errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorDetails}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF1744',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetails: {
    color: '#B0B0C8',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Ensure app is mounted before rendering
    setAppReady(true);
  }, []);

  if (!appReady) {
    return null; // Wait for app to be ready
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
