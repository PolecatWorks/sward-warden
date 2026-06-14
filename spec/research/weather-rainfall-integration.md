# Weather Forecast and Rainfall Integration Research

## Overview

This document outlines the research and methodology for integrating weather forecast and historical data into the application. The primary goal is to retrieve recent rainfall data and future predictions (7 days historical, 7 days forecast) for agricultural fields, map this data to geospatial field boundaries, and calculate the total volume of water within a field.

Note: Hydrological modeling (e.g., flow direction towards waterways based on elevation) is considered a separate concern and is not covered in this document.

## 1. Weather Data Providers

To obtain 7 days of historical and 7 days of forecast rainfall data, several APIs are available. We prioritize free/open-source options while also considering commercial alternatives for higher reliability or precision if needed.

### 1.1 Open-Meteo (Recommended Free Option)
- **Overview**: An open-source weather API that offers high-resolution weather forecasts and historical data without requiring API keys for non-commercial or low-volume use.
- **Features**:
  - Up to 14 days forecast and past 3+ months historical data.
  - Returns data in JSON format based on latitude/longitude.
  - Aggregates multiple national weather models (NOAA, DWD, MeteoFrance).
- **Cost**: Free for up to 10,000 API calls per day. Commercial plans available for higher limits.
- **Suitability**: Excellent for our requirements, as it provides exactly the 7-day historical and forecast windows needed for rainfall (`precipitation` variable), at zero cost.

### 1.2 OpenWeatherMap (Commercial with Free Tier)
- **Overview**: A widely used commercial weather data provider.
- **Features**:
  - "One Call API 3.0" provides current weather, minute forecast for 1 hour, hourly forecast for 48 hours, daily forecast for 8 days, and historical weather.
- **Cost**: 1,000 API calls/day for free. After that, pay-as-you-go. Historical data specifically might require a subscription depending on the granularity needed.
- **Suitability**: Good alternative if Open-Meteo proves unreliable, but the API pricing structure requires careful management to avoid unexpected costs.

### 1.3 Tomorrow.io (Commercial)
- **Overview**: A premium weather intelligence platform offering hyper-local forecasts.
- **Features**: Provides detailed historical, real-time, and forecast data with advanced variables (e.g., soil moisture, depending on tier).
- **Cost**: Very limited free tier (mostly real-time/short forecast). Historical data usually requires enterprise pricing.
- **Suitability**: Likely overkill and too expensive for the current requirement, but a good option if we need highly specialized agricultural weather models in the future.

### 1.4 National Weather Services (e.g., NOAA API)
- **Overview**: Direct access to government weather data.
- **Features**: Highly accurate but often region-specific (e.g., NOAA for the US, Met Office for the UK).
- **Cost**: Free.
- **Suitability**: Harder to integrate globally compared to aggregators like Open-Meteo. The API interfaces can be complex and less developer-friendly.

**Recommendation**: Start with **Open-Meteo** due to its generous free tier, easy-to-use JSON API, and built-in support for both historical and forecast data in a single request.

## 2. Integration Methodology: Field Centroids

Our application stores field boundaries as geospatial polygons (using PostGIS, specifically `GEOGRAPHY(Polygon, 4326)`).

To query the weather APIs, which typically require a single point (latitude and longitude), we will use the **centroid** (center point) of the field polygon. Since weather phenomena like rainfall generally occur over areas larger than a single field, using the centroid provides a sufficient and highly efficient approximation for the entire field's rainfall.

### 2.1 Calculating the Centroid in PostGIS
We can extract the centroid from our field polygons using the PostGIS `ST_Centroid` function:

```sql
SELECT
    field_id,
    ST_X(ST_Centroid(boundary::geometry)) AS longitude,
    ST_Y(ST_Centroid(boundary::geometry)) AS latitude
FROM fields;
```
*(Note: `ST_Centroid` operates on `geometry`, so we cast the `geography` type to `geometry` for the calculation, then extract the coordinates).*

### 2.2 API Query Structure
Using the extracted centroid coordinates, we construct a request to the weather API. For example, an Open-Meteo request for a field at `lat=52.52`, `lon=13.41` would look like:

`GET https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=precipitation_sum&past_days=7&forecast_days=7&timezone=auto`

This returns an array of dates and their corresponding total daily rainfall (in millimeters).

## 3. Water Volume Calculation

Once we have the daily rainfall depth for a field, we can calculate the total volume of water that has fallen on that field.

### 3.1 Variables Required
1. **Rainfall Depth ($d$)**: Sourced from the weather API (e.g., 10 mm).
2. **Field Area ($A$)**: Sourced from our database.

### 3.2 Calculating Field Area in PostGIS
Because we use the `geography` type in PostGIS, calculating the area in square meters is highly accurate and accounts for the curvature of the earth:

```sql
SELECT ST_Area(boundary) AS area_sq_meters FROM fields WHERE id = '...';
```

### 3.3 Volume Calculation Formula
Volume ($V$) is calculated by multiplying the area by the depth.

Since rainfall is typically reported in millimeters (mm) and area in square meters ($m^2$), we must convert the units to ensure the result is in cubic meters ($m^3$) or liters.

1. **Convert depth to meters**: $d_{meters} = d_{mm} / 1000$
2. **Calculate Volume in Cubic Meters**: $V_{m^3} = A_{m^2} \times d_{meters}$

**Example**:
- A field has an area of **10,000 $m^2$** (1 hectare).
- The weather API reports **15 mm** of rainfall yesterday.
- $15 \text{ mm} = 0.015 \text{ meters}$
- $Volume = 10,000 \times 0.015 = \mathbf{150 \text{ m}^3}$

*(Note: $1 \text{ m}^3 = 1,000 \text{ liters}$, so 150 $m^3$ is 150,000 liters of water).*

## 4. Conclusion and Next Steps

1. **Adopt Open-Meteo** as the primary weather API for fetching 7-day historical and 7-day forecast rainfall data.
2. **Database Queries**: Implement backend functions to extract the centroid and total area of each field using PostGIS `ST_Centroid` and `ST_Area`.
3. **Data Fetching Layer**: Build a scheduled or on-demand service to fetch rainfall data for field centroids and store it locally for rapid querying.
4. **Volume Calculation**: Implement the volume multiplication logic in the backend (converting mm to meters and multiplying by the area).
5. **Future Hydrology**: Once volume is established, future work can incorporate DEM (Digital Elevation Model) data to calculate slope and predict runoff/flow direction towards waterways.
