package com.portfolio.model;

public enum CloseReason {
    TP_HIT,      // Take Profit was hit
    SL_HIT,      // Stop Loss was hit
    LIQUIDATED,  // Position was liquidated
    MANUAL       // Manually closed at custom price
}
