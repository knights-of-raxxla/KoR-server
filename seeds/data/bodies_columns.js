
// à gauche les valeurs des clefs dans le dump json
// de EDSM
module.exports = {
    'name': ['name'],
    'body_id': ['bodyId'],
    'edsm_id': ['id'],
    'distance_from_arrival': ['distanceToArrival'],
    'is_landable': ['isLandable'],
    'type': ['type'],
    'sub_type': ['subType'],
    'parents': ['parents'],
    'mass': ['earthMasses', 'solarMasses'],
    'radius': ['solarRadius', 'radius'],
    'surface_temperature': ['surfaceTemperature'],
    'offset': ['offset'],
    "orbital_period": ["orbitalPeriod"],
    'semi_major_axis': ['semiMajorAxis'],
    "orbital_eccentricity": ["orbitalEccentricity"],
    "orbital_inclination": ["orbitalInclination"],
    "arg_of_periapsis": ["argOfPeriapsis"],
    "rotational_period": ["rotationalPeriod"],
    "rotational_period_tidally_locked": ["rotationalPeriodTidallyLocked"],
    "axial_tilt": ["axialTilt"],
    'is_main_star': ['isMainStar'],
    "is_scoopable": ["isScoopable"],
    "age": ["age"],
    'spectral_class': ['spectralClass'],
    "luminosity": ["luminosity"],
    "absolute_magnitude": ["absoluteMagnitude"],

    // planets
    'gravity': ['gravity'],
    'surface_pressure': ['surfacePressure'],
    "volcanism_type": ["volcanismType"],
    'atmosphere_type': ['atmosphereType'],
    'atmosphere_composition': ['atmosphereComposition'],
    'solid_composition': ['solidComposition'],
    "terraforming_state": ["terraformingState"],

    // sql
    'created_at': ['date'],
};
