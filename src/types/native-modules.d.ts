/**
 * TypeScript declarations for native modules
 */

declare module 'react-native' {
  interface NativeModulesStatic {
    WidgetDataSync?: {
      syncToSharedPreferences(data: string): Promise<boolean>;
      syncToAppGroup(data: string): Promise<boolean>;
    };
  }
}

