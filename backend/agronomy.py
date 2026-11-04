"""FAO-56-inspired water-balance calculation for an educational prototype.
NOT a replacement for a local agronomist / validated crop-water scheduling.
Units: ETo mm/day, rain mm over period, area hectares, volumes m³.
"""
from dataclasses import dataclass, asdict

CROPS = {
    'olive': {'label': 'Olive trees', 'kc': {'initial': .50, 'mid': .70, 'late': .60}},
    'tomato': {'label': 'Tomatoes', 'kc': {'initial': .60, 'mid': 1.15, 'late': .80}},
    'wheat': {'label': 'Wheat', 'kc': {'initial': .40, 'mid': 1.15, 'late': .40}},
    'citrus': {'label': 'Citrus', 'kc': {'initial': .70, 'mid': .75, 'late': .70}},
    'grape': {'label': 'Grapes', 'kc': {'initial': .30, 'mid': .85, 'late': .45}},
    'rice': {'label': 'Rice', 'kc': {'initial': 1.05, 'mid': 1.20, 'late': .90}},
    'date_palm': {'label': 'Date palms', 'kc': {'initial': .75, 'mid': .90, 'late': .80}},
}
EFFICIENCY = {'drip': .90, 'sprinkler': .75, 'surface': .58}
SOIL_RAIN_FACTOR = {'sandy': .65, 'loamy': .80, 'clay': .85}
REFERENCE_EFFICIENCY = .55  # illustrative conventional irrigation benchmark
SAFE_FRACTION = .90  # screening only, not a real crop-safety guarantee
AGT_PER_M3 = 10


def estimate(*, area_ha: float, crop: str, stage: str, soil: str,
             irrigation: str, eto_mm_day: float, rain_mm: float, days: int = 7) -> dict:
    if crop not in CROPS or stage not in ('initial', 'mid', 'late'):
        raise ValueError('Unsupported crop or growth stage')
    if soil not in SOIL_RAIN_FACTOR or irrigation not in EFFICIENCY:
        raise ValueError('Unsupported soil or irrigation method')
    if not (.01 <= area_ha <= 10000 and 0 <= eto_mm_day <= 20
            and 0 <= rain_mm <= 1000 and 1 <= days <= 14):
        raise ValueError('Invalid area or weather inputs')
    kc = CROPS[crop]['kc'][stage]
    crop_et_mm = eto_mm_day * kc * days
    effective_rain_mm = min(crop_et_mm, rain_mm * SOIL_RAIN_FACTOR[soil])
    net_mm = max(0.0, crop_et_mm - effective_rain_mm)
    # 1 mm of water over 1 hectare = 10 m³
    net_m3 = net_mm * area_ha * 10
    recommended = net_m3 / EFFICIENCY[irrigation]
    reference = net_m3 / REFERENCE_EFFICIENCY
    potential = max(0., reference - recommended)
    return {
        'area_ha': area_ha, 'days': days, 'kc': kc,
        'eto_mm_day': round(eto_mm_day, 3), 'rain_mm': round(rain_mm, 3),
        'crop_et_mm': round(crop_et_mm, 2), 'effective_rain_mm': round(effective_rain_mm, 2),
        'net_irrigation_m3': round(net_m3, 2),
        'recommended_m3': round(recommended, 2),
        'reference_m3': round(reference, 2),
        'potential_savings_m3': round(potential, 2),
        'lower_screening_m3': round(recommended * SAFE_FRACTION, 2),
        'irrigation_efficiency': EFFICIENCY[irrigation],
        'reference_efficiency': REFERENCE_EFFICIENCY,
        'note': 'Illustrative FAO-56-style water balance. Verify locally; does not certify crop health or actual savings.',
    }


def evaluate(actual_m3: float, calculation: dict) -> dict:
    if actual_m3 < 0:
        raise ValueError('Volume cannot be negative')
    if calculation['reference_m3'] <= .01:
        return {'eligible': False, 'reason': 'No irrigation demand in this period.', 'saved_m3': 0, 'tokens': 0}
    if actual_m3 < calculation['lower_screening_m3'] - .01:
        return {'eligible': False, 'reason': 'Below the prototype crop-safety screening threshold. Check plants and irrigation before claiming rewards.', 'saved_m3': 0, 'tokens': 0}
    if actual_m3 >= calculation['reference_m3']:
        return {'eligible': False, 'reason': 'No savings versus the illustrative reference.', 'saved_m3': 0, 'tokens': 0}
    saved = round(calculation['reference_m3'] - actual_m3, 2)
    tokens = min(int(saved * AGT_PER_M3), 50000)
    if tokens <= 0:
        return {'eligible': False, 'reason': 'Savings too small to earn a token.', 'saved_m3': 0, 'tokens': 0}
    return {'eligible': True, 'reason': 'Passes prototype screening (not independently verified).', 'saved_m3': saved, 'tokens': tokens}
