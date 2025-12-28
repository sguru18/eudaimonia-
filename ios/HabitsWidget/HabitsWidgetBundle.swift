//
//  HabitsWidgetBundle.swift
//  HabitsWidget
//
//  Created by rSrihari on 12/16/25.
//

import WidgetKit
import SwiftUI

@main
struct HabitsWidgetBundle: WidgetBundle {
    var body: some Widget {
        HabitsWidget()
        PlannerWidget()
        FinanceWidget()
    }
}
