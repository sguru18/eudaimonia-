//
//  WidgetDataSyncModule.swift
//  Native module to sync planner widget data to App Groups
//

import Foundation
import React
import WidgetKit

@objc(WidgetDataSync)
class WidgetDataSync: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func syncPlannerToAppGroup(_ data: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let appGroupIdentifier = "group.com.sriharigurugubelli.gardenapp"
    
    guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
      rejecter("APP_GROUP_ERROR", "Failed to access App Group: \(appGroupIdentifier)", nil)
      return
    }
    
    sharedDefaults.set(data, forKey: "planner_widget_data")
    sharedDefaults.synchronize()
    
    // Reload widget timelines - use async to ensure data is written first
    if #available(iOS 14.0, *) {
      // Small delay to ensure data is fully written
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        WidgetCenter.shared.reloadTimelines(ofKind: "PlannerWidget")
      }
    }
    
    resolver(true)
  }
}

