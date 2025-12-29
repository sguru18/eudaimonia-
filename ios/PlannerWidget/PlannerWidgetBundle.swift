//
//  PlannerWidgetBundle.swift
//  PlannerWidget
//
//  Created by rSrihari on 12/29/25.
//

import WidgetKit
import SwiftUI

@main
struct PlannerWidgetBundle: WidgetBundle {
    var body: some Widget {
        PlannerWidget()
        PlannerWidgetControl()
        PlannerWidgetLiveActivity()
    }
}
