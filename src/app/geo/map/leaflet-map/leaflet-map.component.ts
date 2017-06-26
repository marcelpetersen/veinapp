import { Component, OnInit, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { Map, LatLng, control, Marker, LayerGroup } from 'leaflet';

import { INIT_GEOCODE_DATA } from '../../geodata';
import { LeafletConfig, PlaceType } from './leaflet-config';
import { GeoMarker } from './geo-marker';

@Component({
  selector: 'app-leaflet-map',
  template: `
    <div id="map"></div>
  `,
  styles: [`
    #map {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
    }
 `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeafletMapComponent implements OnInit {
  map;
  centerMarker;
  placesMarkers = [];
  currentPlaceKey;
  placesLayer = new LayerGroup([]);
  @Output() setSelectedPlace = new EventEmitter();
  @Input() set mapVisible(hidden) {
    if (!hidden) {
      this.resetMap();
    }
  };
  @Input() set center(center) {
    if (typeof this.map !== 'undefined') {
      this.map.panTo(center);
      this.centerMarker.setLatLng(center);
    }
  };

  @Input() set selectedPlaceKey(key) {
    const oldMarker = this
      .findMarkerByKey(this.placesMarkers, this.currentPlaceKey);
    if (oldMarker) {
      oldMarker.setIcon(LeafletConfig.PRIMARY_MARKER);
    }
    if (key) {
      const newMarker = this.findMarkerByKey(this.placesMarkers, key);
      newMarker.setIcon(LeafletConfig.SELECTED_MARKER);
      this.map.panTo(newMarker.getLatLng());
    }
    this.currentPlaceKey = key;
  };

  @Input() set places(places) {
    if (typeof this.map !== 'undefined') {
      this.placesLayer.clearLayers();
      this.placesMarkers = places.reduce((acc, place) => {
        const marker = this.findMarkerByCoords(this.placesMarkers, place.location) ||
          new GeoMarker(place.location, place.$key, {
              title: place.name,
              alt: place.name,
              icon: place.type === LeafletConfig.PLACE_TYPES[PlaceType.Primary]
                    ? LeafletConfig.PRIMARY_MARKER
                    : LeafletConfig.SECONDARY_MARKER
            });
        marker.on('click', (e) => this.setSelectedPlace.emit(e.target.$key));
        acc.push(marker);
        return acc;
      }, []);
      this.placesMarkers.forEach((place) => this.placesLayer.addLayer(place));

      this.map.setZoom(LeafletConfig.INIT_ZOOM);
    }
  };

  private findMarkerByCoords(arr, val) {
    return arr.find((item) => item.getLatLng() === val);
  }
  private findMarkerByKey(arr, val) {
    return arr.find((item) => item.$key === val);
  }

  ngOnInit() {
    const center = new LatLng(INIT_GEOCODE_DATA.center[0], INIT_GEOCODE_DATA.center[1]);
    const address = INIT_GEOCODE_DATA.address;

    if (typeof this.map === 'undefined') {
      this.map = new Map('map', {
        zoomControl: false,
        center: center,
        zoom: LeafletConfig.INIT_ZOOM,
        layers: [
          this.placesLayer,
          LeafletConfig.BASE_MAPS.OpenStreetMap
        ],
      });

      this.resetMap();

      control.zoom(LeafletConfig.CONTROL_ZOOM_POSITION).addTo(this.map);
      this.centerMarker = new Marker(center, { icon: LeafletConfig.CENTER_MARKER }).addTo(this.map);
    }

  }

  // TODO (study better solution)
  // this weird thing corrects center position of the map on load
  private resetMap () {
    setTimeout(() => this.map.invalidateSize(false), 100);
  }

}
