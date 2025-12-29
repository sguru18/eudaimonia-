/**
 * TypeScript declarations for native modules
 */

declare module 'react-native' {
  interface NativeModulesStatic {
    WidgetDataSync?: {
      syncPlannerToAppGroup(data: string): Promise<boolean>;
    };
  }
}

