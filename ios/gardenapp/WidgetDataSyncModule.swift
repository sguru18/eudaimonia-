//
//  WidgetDataSyncModule.swift
//  Native module to sync widget data to App Groups
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
  func syncToAppGroup(_ data: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let appGroupIdentifier = "group.com.sriharigurugubelli.gardenapp"
    
    guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
      rejecter("APP_GROUP_ERROR", "Failed to access App Group: \(appGroupIdentifier)", nil)
      return
    }
    
    sharedDefaults.set(data, forKey: "widget_data")
    sharedDefaults.synchronize()
    
    // Reload widget timelines
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "HabitsWidget")
    }
    
    resolver(true)
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
    
    // Reload widget timelines
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "PlannerWidget")
    }
    
    resolver(true)
  }
}

