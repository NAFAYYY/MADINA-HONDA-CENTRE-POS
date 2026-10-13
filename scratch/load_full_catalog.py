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

def infer_category(name):
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

# Master dictionary of products keyed by part_number
products_map = {}
slabs_list = []

# 1. Parse Price List (June-26).pdf
print("Parsing Price List (June-26).pdf...")
reader_pl = pypdf.PdfReader('Price List (June-26).pdf')
pending = ''
pl_row_count = 0

for page in reader_pl.pages:
    for raw in page.extract_text().split('\n'):
        line = raw.strip()
        if not line or any(h in line for h in ['Sr.', 'No.', 'Part Code', 'Part Name', 'Model Scheme', 'Slab', 'Ex-Factory', 'Price', 'Sales Tax', 'Dealer', 'Retail', 'Page ']):
            continue
        fl = (pending + ' ' + line).strip() if pending else line
        m_start = re.match(r'^(\d+)\s+([A-Za-z0-9\-]+)\s+(.*)', fl)
        if m_start:
            rest = m_start.group(3)
            m_end = re.search(num_pattern, rest)
            if m_end:
                slab, ex_fac, tax, dealer, retail = m_end.groups()
                part_code = m_start.group(2).strip()
                middle = rest[:m_end.start()].strip()
                name, model = split_name_and_model(middle)
                slab_int = int(slab.replace(',', ''))
                ex_fac_f = clean_num(ex_fac)
                tax_f = clean_num(tax)
                dealer_f = clean_num(dealer)
                retail_f = clean_num(retail)
                
                pl_row_count += 1
                slabs_list.append({
                    'part_number': part_code,
                    'min_quantity': slab_int,
                    'dealer_price': dealer_f,
                    'retail_price': retail_f,
                    'ex_factory_price': ex_fac_f,
                    'sales_tax': tax_f
                })
                
                if part_code not in products_map:
                    cat, shelf, abc = infer_category(name)
                    products_map[part_code] = {
                        'part_number': part_code,
                        'name': name,
                        'model_compat': model,
                        'category': cat,
                        'brand': 'Atlas Honda',
                        'shelf_location': shelf,
                        'cost_price': round(ex_fac_f + tax_f, 2),
                        'retail_price': retail_f,
                        'wholesale_price': dealer_f, # base wholesale price at slab 1
                        'base_slab': slab_int,
                        'stock_quantity': 50 if abc == 'A' else (25 if abc == 'B' else 10),
                        'min_stock_alert': 5,
                        'abc_category': abc,
                        'barcode': '89640' + re.sub(r'[^0-9]', '', part_code)[-6:].zfill(6)
                    }
                else:
                    # If this is slab 1 or lower slab, use its dealer price as default wholesale
                    if slab_int < products_map[part_code]['base_slab']:
                        products_map[part_code]['wholesale_price'] = dealer_f
                        products_map[part_code]['base_slab'] = slab_int
                
                pending = ''
            else:
                pending = fl
        else:
            pending = fl

print(f"Price List parsed: {pl_row_count} rows, {len(products_map)} unique parts.")

# 2. Parse Painted Parts Price Circular.pdf
print("Parsing Painted Parts Price Circular.pdf...")
reader_paint = pypdf.PdfReader('Painted Parts Price Circular.pdf')
paint_count = 0
for page in reader_paint.pages:
    for line in page.extract_text().split('\n'):
        line = line.strip()
        m = re.match(r'^(\d+)\s+([A-Za-z0-9\-]+)\s+(.*?)\s+([0-9,]+)$', line)
        if m:
            sr, part, middle, price = m.groups()
            part = part.strip()
            name, model = split_name_and_model(middle)
            ret_price = clean_num(price)
            paint_count += 1
            
            # Dealer price estimated at standard ~12% dealer trade margin
            dealer_price = round(ret_price * 0.88)
            cost_price = round(ret_price * 0.82)
            cat, shelf, abc = 'Body & Painted Parts', 'Rack E - Body/Paint', 'C'
            
            if part not in products_map:
                products_map[part] = {
                    'part_number': part,
                    'name': name,
                    'model_compat': model,
                    'category': cat,
                    'brand': 'Atlas Honda',
                    'shelf_location': shelf,
                    'cost_price': cost_price,
                    'retail_price': ret_price,
                    'wholesale_price': dealer_price,
                    'base_slab': 1,
                    'stock_quantity': 8,
                    'min_stock_alert': 2,
                    'abc_category': abc,
                    'barcode': '89640' + re.sub(r'[^0-9]', '', part)[-6:].zfill(6)
                }
                slabs_list.append({
                    'part_number': part,
                    'min_quantity': 1,
                    'dealer_price': dealer_price,
                    'retail_price': ret_price,
                    'ex_factory_price': round(cost_price * 0.82, 2),
                    'sales_tax': round(cost_price * 0.18, 2)
                })
            else:
                # Update existing with latest painted parts circular retail price
                products_map[part]['retail_price'] = ret_price
                products_map[part]['wholesale_price'] = dealer_price

print(f"Painted parts parsed: {paint_count} parts.")

# 3. Parse New Parts Price Circular.pdf
print("Parsing New Parts Price Circular.pdf...")
reader_new = pypdf.PdfReader('New Parts Price Circular.pdf')
new_count = 0
for line in reader_new.pages[0].extract_text().split('\n'):
    line = line.strip()
    m = re.match(r'^(\d+)\s+([A-Za-z0-9\-]+)\s+(.*?)\s+([0-9,]+)$', line)
    if m:
        sr, part, middle, price = m.groups()
        part = part.strip()
        name, model = split_name_and_model(middle)
        ret_price = clean_num(price)
        new_count += 1
        
        dealer_price = round(ret_price * 0.86)
        cost_price = round(ret_price * 0.80)
        cat, shelf, abc = infer_category(name)
        
        if part not in products_map:
            products_map[part] = {
                'part_number': part,
                'name': name,
                'model_compat': model,
                'category': cat,
                'brand': 'Atlas Honda',
                'shelf_location': shelf,
                'cost_price': cost_price,
                'retail_price': ret_price,
                'wholesale_price': dealer_price,
                'base_slab': 1,
                'stock_quantity': 20,
                'min_stock_alert': 5,
                'abc_category': abc,
                'barcode': '89640' + re.sub(r'[^0-9]', '', part)[-6:].zfill(6)
            }
            slabs_list.append({
                'part_number': part,
                'min_quantity': 1,
                'dealer_price': dealer_price,
                'retail_price': ret_price,
                'ex_factory_price': round(cost_price * 0.82, 2),
                'sales_tax': round(cost_price * 0.18, 2)
            })
        else:
            # Revised circular price takes precedence over June price
            products_map[part]['retail_price'] = ret_price
            products_map[part]['wholesale_price'] = dealer_price

print(f"New parts parsed: {new_count} parts.")
print(f"*** TOTAL UNIQUE PRODUCTS: {len(products_map)} ***")
print(f"*** TOTAL SLABS: {len(slabs_list)} ***")
