"""
Feature definitions for the System Threat Forecaster.
Derived from the ML pipeline notebook analysis.
"""

# Key features used for prediction (subset from notebook after feature engineering)
FEATURES = [
    # Platform / OS
    {"name": "OsBuild",               "label": "OS Build Number",                "type": "int",    "min": 0,    "max": 25000,  "default": 17134},
    {"name": "OsSuite",               "label": "OS Suite",                       "type": "int",    "min": 0,    "max": 400,    "default": 256},
    {"name": "IeVerIdentifier",       "label": "IE Version Identifier",          "type": "int",    "min": 0,    "max": 200,    "default": 80},
    {"name": "SmartScreen",           "label": "SmartScreen Status",             "type": "select", "options": ["Off", "Warn", "Block", "RequireAdmin", "Prompt", ""], "default": "RequireAdmin"},
    {"name": "Firewall",              "label": "Firewall Enabled",               "type": "bool",   "default": 1},
    {"name": "UacLuaSettings",        "label": "UAC / LUA Settings",             "type": "int",    "min": 0,    "max": 2,      "default": 1},

    # Hardware / Census
    {"name": "Census_ProcessorCoreCount",            "label": "CPU Core Count",                   "type": "int",    "min": 1,    "max": 64,     "default": 4},
    {"name": "Census_PrimaryDiskTotalCapacity",      "label": "Primary Disk Capacity (MB)",       "type": "int",    "min": 0,    "max": 2000000,"default": 500000},
    {"name": "Census_SystemVolumeTotalCapacity",     "label": "System Volume Capacity (MB)",      "type": "int",    "min": 0,    "max": 2000000,"default": 100000},
    {"name": "Census_TotalPhysicalRAM",              "label": "Total RAM (MB)",                   "type": "int",    "min": 256,  "max": 131072, "default": 8192},
    {"name": "Census_HasOpticalDiskDrive",           "label": "Has Optical Disk Drive",           "type": "bool",   "default": 0},
    {"name": "Census_InternalPrimaryDiagonalDisplaySizeInInches", "label": "Screen Size (inches)", "type": "float",  "min": 0,    "max": 100,    "default": 15.6},
    {"name": "Census_InternalPrimaryDisplayResolutionHorizontal", "label": "Display Resolution H","type": "int",    "min": 0,    "max": 7680,   "default": 1920},
    {"name": "Census_InternalPrimaryDisplayResolutionVertical",   "label": "Display Resolution V","type": "int",    "min": 0,    "max": 4320,   "default": 1080},
    {"name": "Census_InternalBatteryNumberOfCharges",             "label": "Battery Charge Count","type": "int",    "min": 0,    "max": 10000,  "default": 0},

    # Security & OS Settings
    {"name": "Census_IsSecureBootEnabled",           "label": "Secure Boot Enabled",              "type": "bool",   "default": 1},
    {"name": "Census_IsVirtualDevice",               "label": "Is Virtual Device",                "type": "bool",   "default": 0},
    {"name": "Census_IsTouchEnabled",                "label": "Touch Enabled",                    "type": "bool",   "default": 0},
    {"name": "Census_IsAlwaysOnAlwaysConnectedCapable","label":"Always On/Connected",             "type": "bool",   "default": 0},
    {"name": "Wdft_IsGamer",                         "label": "Is Gamer Device",                  "type": "bool",   "default": 0},

    # Geographic / Locale
    {"name": "CountryIdentifier",     "label": "Country Identifier",             "type": "int",    "min": 0,    "max": 300,    "default": 109},
    {"name": "LocaleEnglishNameIdentifier", "label": "Locale Identifier",        "type": "int",    "min": 0,    "max": 300,    "default": 10},
]

FEATURE_NAMES = [f["name"] for f in FEATURES]

# Model performance (from notebook outputs)
MODEL_METRICS = {
    "XGBoost": {
        "accuracy":  0.63,
        "precision": {"0": 0.64, "1": 0.63},
        "recall":    {"0": 0.62, "1": 0.64},
        "f1":        {"0": 0.63, "1": 0.64},
        "color": "#7c3aed",
    },
    "Random Forest": {
        "accuracy":  0.625,
        "precision": {"0": 0.64, "1": 0.61},
        "recall":    {"0": 0.60, "1": 0.65},
        "f1":        {"0": 0.62, "1": 0.63},
        "color": "#2563eb",
    },
    "Gradient Boosting": {
        "accuracy":  0.62,
        "precision": {"0": 0.64, "1": 0.61},
        "recall":    {"0": 0.54, "1": 0.70},
        "f1":        {"0": 0.58, "1": 0.65},
        "color": "#059669",
    },
    "Voting Classifier": {
        "accuracy":  0.6222,
        "precision": {"0": 0.63, "1": 0.62},
        "recall":    {"0": 0.60, "1": 0.66},
        "f1":        {"0": 0.61, "1": 0.64},
        "color": "#d97706",
    },
    "Stacking Classifier": {
        "accuracy":  0.62645,
        "precision": {"0": 0.64, "1": 0.62},
        "recall":    {"0": 0.57, "1": 0.68},
        "f1":        {"0": 0.60, "1": 0.65},
        "color": "#dc2626",
    },
}

# Top feature importances (from XGBoost analysis in notebook)
FEATURE_IMPORTANCES = [
    {"feature": "Census_TotalPhysicalRAM",                    "importance": 0.089},
    {"feature": "Census_SystemVolumeTotalCapacity",           "importance": 0.074},
    {"feature": "Census_PrimaryDiskTotalCapacity",            "importance": 0.071},
    {"feature": "OsBuild",                                    "importance": 0.065},
    {"feature": "Census_InternalBatteryNumberOfCharges",      "importance": 0.063},
    {"feature": "Census_InternalPrimaryDiagonalDisplaySizeInInches", "importance": 0.058},
    {"feature": "IeVerIdentifier",                            "importance": 0.051},
    {"feature": "Census_ProcessorCoreCount",                  "importance": 0.048},
    {"feature": "CountryIdentifier",                          "importance": 0.042},
    {"feature": "Census_IsSecureBootEnabled",                 "importance": 0.038},
    {"feature": "SmartScreen",                                "importance": 0.035},
    {"feature": "Wdft_IsGamer",                               "importance": 0.032},
    {"feature": "UacLuaSettings",                             "importance": 0.030},
    {"feature": "Firewall",                                   "importance": 0.028},
    {"feature": "OsSuite",                                    "importance": 0.025},
]
