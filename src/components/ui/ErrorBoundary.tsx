import React, { Component, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Sentry } from '../../config/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    } catch { /* Sentry might not be initialized */ }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Oups !</Text>
          <Text style={styles.message}>
            Une erreur inattendue est survenue.
          </Text>
          <Button mode="contained" onPress={this.handleReset} style={styles.button}>
            Réessayer
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FAFAFA',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#1C1B1F' },
  message: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  button: { borderRadius: 12 },
});
