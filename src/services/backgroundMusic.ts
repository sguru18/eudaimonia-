/**
 * Background Music Service
 * Plays calm, serene music during stretching sessions
 * Updated for Expo
 */

import { Audio } from 'expo-av';

class BackgroundMusicService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  constructor() {
    // Configure audio mode for playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  async play() {
    if (this.isPlaying) return;

    try {
      // TODO: Add your calm music file to assets
      // For now, using a placeholder - you'll need to add an actual audio file
      // Place your audio file in: assets/audio/calm_stretch_music.mp3
      
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../../assets/audio/calm_stretch_music.mp3'),
      //   { 
      //     shouldPlay: true,
      //     isLooping: true,
      //     volume: 0.3 
      //   }
      // );
      
      // this.sound = sound;
      // this.isPlaying = true;
      
      console.log('Background music: Audio file not configured yet');
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
    }
  }

  async pause() {
    if (this.sound && this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async resume() {
    if (this.sound && !this.isPlaying) {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
  }

  async setVolume(volume: number) {
    // volume should be between 0 and 1
    if (this.sound) {
      await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }
  }
}

export const backgroundMusicService = new BackgroundMusicService();

