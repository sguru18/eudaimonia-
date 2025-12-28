/**
 * Text-to-Speech Service
 * Provides calm female voice for stretching guidance
 * Updated for Expo
 */

import * as Speech from 'expo-speech';

class TTSService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if speech is available
      const available = await Speech.isSpeakingAsync();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing TTS:', error);
    }
  }

  async speak(text: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Configure speech parameters for calm, soothing delivery
      await Speech.speak(text, {
        rate: 0.45, // Slower, more mindful pace
        pitch: 1, // Slightly lower, more soothing
        language: 'en-US',
        voice: 'com.apple.voice.enhanced.en-US.Samantha', // Enhanced quality voice (iOS)
        // For Android, it will use the best available female voice
      });
      const voices = await Speech.getAvailableVoicesAsync();
      console.log('Voices:', voices);

    } catch (error) {
      console.error('Error speaking:', error);
    }
  }

  async stop() {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  }

  async announceStretch(stretchName: string) {
    await this.speak(stretchName);
  }

  async announceSwitchSides() {
    await this.speak('Switch sides');
  }

  async announceComplete() {
    await this.speak('Routine complete. Great work.');
  }

  async announceRest() {
    await this.speak('Rest');
  }
}

export const ttsService = new TTSService();

