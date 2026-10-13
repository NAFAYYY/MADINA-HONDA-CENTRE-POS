import pypdf
import re
import sqlite3
import json

num_pattern = r'([0-9,]+)\s+([0-9,]+\.[0-9]+)\s+([0-9,]+\.[0-9]+)\s+([0-9,]+(?:\.[0-9]+)?)\s+([0-9,]+(?:\.[0-9]+)?)$'

def clean_num(val):
    if not val: return 0.0
    return float(str(val).replace(',', '').strip())

known_models = [
    'CB125F / CG125 S', 'CB-150 / CB150F', 'CB150F', 'CB-150', 'CB125F', 'CB125-F',
    'CG125 S-G', 'CG125 S', 'CG125 (OLD)', 'CG125 STD', 'CG-125 (EII)', 'CG-125', 'CG125', 'CG 150', 'CG150',
    'CD70 (GGJX)', 'CD70N', 'CD70 DREAM', 'CD DREAM', 'CD70', 'CD-70',
    'PRIDOR', 'CD100', 'DELUXE',
    'COMMON (2,3,4)', 'COMMON (3,4)', 'COMMON (2,4)', 'COMMON'
]

def split_name_and_model(middle):
    middle = middle.strip()
    for km in known_models:
        pattern = r'(?:\s+' + re.escape(km) + r'|\b' + re.escape(km) + r')\s*$'
        m = re.search(pattern, middle, re.IGNORECASE)
        if m:
            name = middle[:m.start()].strip()
            model = normalize_model(km)
            return name, model
    tokens = middle.split()
    if len(tokens) > 1 and (any(c.isdigit() for c in tokens[-1]) or tokens[-1] in ['PRIDOR', 'COMMON', 'DELUXE']):
        return ' '.join(tokens[:-1]), normalize_model(tokens[-1])
    return middle, 'Universal'

def normalize_model(model):
    m = model.upper().strip()
    if 'CD70' in m or 'CD-70' in m:
        if 'DREAM' in m: return 'CD70 Dream'
        return 'CD70'
    if 'CD DREAM' in m: return 'CD70 Dream'
    if 'CG125 S' in m or 'CG125 S-G' in m: return 'CG125 Self'
    if 'CG125' in m or 'CG-125' in m:
        if 'DELUXE' in m: return 'CG125 Deluxe'
        return 'CG125'
    if 'CB150' in m or 'CB-150' in m or 'CG 150' in m or 'CG150' in m: return 'CB150F'
    if 'CB125' in m: return 'CB125F'
    if 'PRIDOR' in m or 'CD100' in m: return 'Pridor / CD100'
    if 'DELUXE' in m: return 'CG125 Deluxe'
    return 'Universal'

def infer_category(name, part_code):
    n = name.upper()
    if any(k in n for k in ['OIL', 'LUBRICANT', 'FLUID']):
        return 'Engine Oil & Fluids', 'Rack F - Lubricants', 'A'
    if any(k in n for k in ['PLUG', 'COIL', 'RECTIFIER', 'REG RECT', 'WIRE', 'WINKER', 'LIGHT', 'BULB', 'SWITCH', 'HORN', 'METER', 'SPEEDOMETER', 'STATOR', 'BATTERY', 'IGNITION']):
        return 'Electrical & Lighting', 'Rack B - Electrical', 'B'
    if any(k in n for k in ['GASKET', 'O-RING', 'O RING', 'OIL SEAL', 'SEAL']):
        return 'Gaskets & Seals', 'Rack A - Gaskets', 'A'
    if any(k in n for k in ['PISTON', 'CYLINDER', 'CRANK', 'VALVE', 'CAM', 'ROCKER', 'RING SET', 'CLUTCH', 'CARB', 'CARBURETOR', 'ROD', 'GEAR', 'SHAFT', 'RATCHET']):
        return 'Engine & Transmission', 'Rack A - Engine', 'B'
    if any(k in n for k in ['BRAKE', 'SHOE', 'PAD', 'CALIPER', 'DRUM', 'DISC']):
        return 'Brakes', 'Rack D - Brakes', 'A'
    if any(k in n for k in ['CABLE']):
        return 'Control Cables', 'Rack C - Cables', 'A'
    if any(k in n for k in ['CHAIN', 'SPROCKET', 'DRIVE']):
        return 'Chain & Sprockets', 'Rack D - Drive', 'A'
    if any(k in n for k in ['TANK', 'COVER', 'COWL', 'SHROUD', 'GARNISH', 'FENDER', 'VISOR', 'EMBLEM', 'STRIPE', 'ILLUST', 'SET ILLUST']):
        return 'Body & Painted Parts', 'Rack E - Body/Paint', 'C'
    if any(k in n for k in ['TIRE', 'TYRE', 'TUBE', 'RIM', 'SPOKE', 'WHEEL', 'HUB']):
        return 'Wheels & Tires', 'Rack D - Wheels', 'B'
    if any(k in n for k in ['FORK', 'DAMPER', 'SHOCK', 'CUSHION', 'ARM', 'STAND', 'FOOTREST', 'HANDLE', 'LEVER', 'GRIP']):
        return 'Suspension & Chassis', 'Rack C - Chassis', 'B'
    if any(k in n for k in ['MUFFLER', 'EXHAUST', 'PIPE']):
        return 'Exhaust System', 'Rack E - Exhaust', 'B'
    return 'Genuine Honda Parts', 'Rack G - General', 'B'

print("Test parser script ready.")
